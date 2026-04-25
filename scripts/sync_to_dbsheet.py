#!/usr/bin/env python3
"""
运营数据同步脚本：从 Worker API 拉取记录，增量同步到 WPS 多维表
支持：巡店、通报、会议、培训四种记录
"""

import sys, os, json, requests
from datetime import datetime

# ============================================================
# 配置区
# ============================================================

WORKER_API = "https://operator-upload-center-api.shujia-liang.workers.dev/api"
DBSHEET_CONFIG = {
    "patrol": {
        "file_id": "jWXKDrfq9xMYpuPH1Q6frxrt855mYBKDp",
        "sheet_id": 1,
        "api_table": "patrol_records",
        "date_field": "巡店日期",
        # field mapping: D1 column -> 多维表字段名
        "field_map": {
            "id": "记录ID",
            "operator_name": "操盘手姓名",
            "store_name": "门店名称",
            "date": "巡店日期",
            "report": "巡店报告",
            "gps_anomaly": "GPS异常",
        },
        # 特殊字段需要转换
        "computed_fields": {
            "所属区域": lambda rec: "",  # 需要从 operators 获取
            "门头照": lambda rec: 1 if _has_image(rec, "door") else 0,
            "乐橙截图": lambda rec: 1 if _has_image(rec, "lecheng") else 0,
            "店员照片": lambda rec: 1 if _has_image(rec, "staff") else 0,
            "操作台照片": lambda rec: 1 if _has_image(rec, "counter") else 0,
        },
    },
    "report": {
        "file_id": "eGWgZNhZD1MNPnMAA5uvrxbwtiJ5yUc1V",
        "sheet_id": 1,
        "api_table": "report_records",
        "date_field": "通报日期",
        "field_map": {
            "id": "记录ID",
            "operator_name": "操盘手姓名",
            "date": "通报日期",
        },
        "computed_fields": {
            "所属区域": lambda rec: "",
            "上午通报图": lambda rec: _slot_status(rec, 0),
            "下午通报1图": lambda rec: _slot_status(rec, 1),
            "下午通报2图": lambda rec: _slot_status(rec, 2),
            "下午通报3图": lambda rec: _slot_status(rec, 3),
        },
    },
    "meeting": {
        "file_id": "vEaaaGDACrM5HkXGSQFL1xZobTvm8fdaJ",
        "sheet_id": 1,
        "api_table": "meeting_records",
        "date_field": "会议日期",
        "field_map": {
            "id": "记录ID",
            "operator_name": "操盘手姓名",
            "date": "会议日期",
            "meeting_link": "会议链接",
            "summary": "会议纪要",
            "gps_anomaly": "GPS异常",
        },
        "computed_fields": {
            "所属区域": lambda rec: "",
            "照片数量": lambda rec: _count_images(rec.get("images")),
        },
    },
    "training": {
        "file_id": "huHbAthGc1MjoGYuD7xQxxgZ8Pyyfmoap",
        "sheet_id": 1,
        "api_table": "training_records",
        "date_field": "培训日期",
        "field_map": {
            "id": "记录ID",
            "operator_name": "操盘手姓名",
            "date": "培训日期",
            "theme": "培训主题",
            "exam_info": "考核信息",
            "gps_anomaly": "GPS异常",
        },
        "computed_fields": {
            "所属区域": lambda rec: "",
            "照片数量": lambda rec: _count_images(rec.get("images")),
        },
    },
}


# ============================================================
# 辅助函数
# ============================================================

def _parse_images(images_str):
    """解析 D1 中 JSON 字符串格式的 images/slots"""
    if not images_str:
        return []
    if isinstance(images_str, str):
        try:
            return json.loads(images_str)
        except:
            return []
    return images_str if isinstance(images_str, list) else []

def _has_image(rec, image_type):
    """检查巡店记录中是否有某类型照片"""
    images = _parse_images(rec.get("images"))
    for img in images:
        if isinstance(img, dict) and img.get("type") == image_type and img.get("data"):
            return True
    return False

def _slot_status(rec, slot_index):
    """获取通报某个时段的上传状态"""
    slots = _parse_images(rec.get("slots"))
    if slot_index < len(slots):
        slot = slots[slot_index]
        if isinstance(slot, dict) and slot.get("image"):
            return "已上传"
        return "未上传"
    return "-"

def _count_images(images_val):
    """统计图片数量"""
    if not images_val:
        return 0
    images = _parse_images(images_val)
    return len(images)

def _format_date(date_str):
    """格式化日期为 YYYY-MM-DD"""
    if not date_str:
        return ""
    # D1 中日期格式可能是 "2026-04-25" 或 "2026-04-25T..."
    return date_str[:10] if len(date_str) >= 10 else date_str


# ============================================================
# 多维表操作
# ============================================================

def dbsheet_list_records(file_id, sheet_id):
    """获取多维表中所有记录ID"""
    sys.path.insert(0, os.path.join(os.getenv('skill_path', ''), 'kdocs', 'dbsheet', 'scripts'))
    import dbsheet
    result = dbsheet.list_records(file_id, sheet_id, fields=["记录ID"], page_size=1000)
    if not result.get("success"):
        return []
    records = (result.get("data") or {}).get("records") or []
    return [r["fields"].get("记录ID", "") for r in records if r.get("fields")]

def dbsheet_create_records(file_id, sheet_id, records):
    """批量创建多维表记录"""
    sys.path.insert(0, os.path.join(os.getenv('skill_path', ''), 'kdocs', 'dbsheet', 'scripts'))
    import dbsheet
    return dbsheet.create_records(file_id, sheet_id, records)


# ============================================================
# 主同步逻辑
# ============================================================

def sync_module(module_name, config):
    """同步单个模块的数据"""
    api_table = config["api_table"]
    file_id = config["file_id"]
    sheet_id = config["sheet_id"]
    field_map = config["field_map"]
    computed = config.get("computed_fields", {})
    date_field = config["date_field"]

    print(f"\n{'='*50}")
    print(f"同步 {module_name} 记录...")
    print(f"  API: {api_table}")
    print(f"  多维表: {file_id} (sheet {sheet_id})")

    # 1. 获取 Worker API 数据
    try:
        r = requests.get(f"{WORKER_API}/{api_table}", timeout=15)
        r.raise_for_status()
        api_data = r.json()
        api_records = api_data.get("data", [])
        print(f"  Worker API: {len(api_records)} 条记录")
    except Exception as e:
        print(f"  [ERROR] Worker API 请求失败: {e}")
        return {"synced": 0, "error": str(e)}

    if not api_records:
        print("  无记录，跳过")
        return {"synced": 0}

    # 2. 获取多维表已有记录ID
    existing_ids = set(dbsheet_list_records(file_id, sheet_id))
    print(f"  多维表已有: {len(existing_ids)} 条记录")

    # 3. 找出需要新增的记录
    new_records = []
    for rec in api_records:
        rec_id = rec.get("id", "")
        if rec_id and rec_id not in existing_ids:
            # 构建多维表记录
            db_record = {}
            # 基础字段映射
            for d1_col, db_field in field_map.items():
                val = rec.get(d1_col)
                if d1_col in ("date",):
                    val = _format_date(val)
                elif d1_col == "gps_anomaly":
                    val = bool(val) if val is not None else False
                elif d1_col == "meeting_link":
                    # 确保是有效 URL
                    val = val if val and val.startswith("http") else ""
                db_record[db_field] = val if val is not None else ""
            # 计算字段
            for db_field, fn in computed.items():
                db_record[db_field] = fn(rec)
            new_records.append(db_record)

    if not new_records:
        print("  无新增记录")
        return {"synced": 0}

    # 4. 分批写入多维表（每批最多 50 条）
    BATCH_SIZE = 50
    total_synced = 0
    for i in range(0, len(new_records), BATCH_SIZE):
        batch = new_records[i:i + BATCH_SIZE]
        try:
            result = dbsheet_create_records(file_id, sheet_id, batch)
            if result.get("success"):
                n = len((result.get("data") or {}).get("records") or [])
                total_synced += n
                print(f"  写入第 {i//BATCH_SIZE + 1} 批: {n} 条")
            else:
                print(f"  [ERROR] 写入失败: {result.get('error')}")
        except Exception as e:
            print(f"  [ERROR] 写入异常: {e}")

    print(f"  完成! 新增 {total_synced} 条记录")
    return {"synced": total_synced}


def main():
    """执行所有模块的同步"""
    print(f"数据同步开始: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    results = {}
    for module_name, config in DBSHEET_CONFIG.items():
        results[module_name] = sync_module(module_name, config)

    total = sum(r.get("synced", 0) for r in results.values())
    errors = sum(1 for r in results.values() if r.get("error"))
    print(f"\n{'='*50}")
    print(f"同步完成: 共新增 {total} 条记录, {errors} 个模块出错")
    for name, r in results.items():
        status = f"新增 {r.get('synced', 0)} 条" if not r.get("error") else f"错误: {r.get('error')}"
        print(f"  {name}: {status}")
    print(f"时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    return total


if __name__ == "__main__":
    main()
