import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ImageUploader from '../components/ui/ImageUploader';
import Button from '../components/ui/Button';
import { addPatrolRecord, getPatrolRecords, fetchPatrolRecords } from '../utils/storage';
import { generateId, getTodayStr } from '../utils/helpers';
import { generateFingerprint } from '../utils/device';
import type { PatrolImage, GPSData } from '../types';

const IMAGE_TYPES: { type: PatrolImage['type']; label: string; hint: string }[] = [
  { type: 'door', label: '门店门头照', hint: '必须实时拍摄，含门店招牌全景' },
  { type: 'lecheng', label: '乐橙全景截图', hint: '必须实时拍摄，乐橙监控全景画面' },
  { type: 'staff', label: '店员全身照', hint: '必须实时拍摄，店内店员全身照' },
  { type: 'counter', label: '操作台照片', hint: '必须实时拍摄，收银台/操作台照片' },
];

export default function Patrol() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [report, setReport] = useState('');
  const [images, setImages] = useState<Record<string, string | null>>({});
  const [gpsData, setGpsData] = useState<Record<string, GPSData | null>>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch records from API on mount
  useEffect(() => {
    if (user) {
      setRefreshing(true);
      fetchPatrolRecords(user.id).finally(() => setRefreshing(false));
    }
  }, [user]);

  if (!user) return null;

  // Check duplicate: same store today
  const todayRecords = getPatrolRecords().filter(
    (r) => r.operatorId === user.id && r.date === getTodayStr()
  );
  const todayStoreIds = new Set(todayRecords.map((r) => r.storeId));

  const selectedStore = user.stores.find((s) => s.id === selectedStoreId);
  const isDuplicate = selectedStoreId ? todayStoreIds.has(selectedStoreId) : false;

  const watermarkBase = useMemo(() => ({
    operatorName: user.name,
    storeName: selectedStore?.name,
  }), [user.name, selectedStore?.name]);

  const handleImageChange = (type: string, data: string | null, gps: GPSData | null) => {
    setImages((prev) => ({ ...prev, [type]: data }));
    setGpsData((prev) => ({ ...prev, [type]: gps }));
  };

  const handleSubmit = async () => {
    if (!selectedStoreId) {
      showToast('请选择门店', 'error');
      return;
    }
    if (!selectedStore) return;

    if (isDuplicate) {
      showToast('该门店今天已提交过巡店记录，不可重复提交', 'error');
      return;
    }

    if (!report.trim()) {
      showToast('请填写巡店报告', 'error');
      return;
    }

    const requiredTypes = IMAGE_TYPES.map((t) => t.type);
    const missingTypes = requiredTypes.filter((t) => !images[t]);
    if (missingTypes.length > 0) {
      const missing = IMAGE_TYPES.find((t) => t.type === missingTypes[0]);
      showToast(`请拍摄${missing?.label}`, 'error');
      return;
    }

    // Check GPS anomaly (any image without GPS)
    const hasGpsAnomaly = requiredTypes.some((t) => !gpsData[t]);

    setLoading(true);

    const patrolImages: PatrolImage[] = IMAGE_TYPES.map((t) => ({
      type: t.type,
      data: images[t.type] as string,
      gps: gpsData[t.type] ?? null,
      watermarked: true,
    }));

    const record = {
      id: generateId(),
      operatorId: user.id,
      operatorName: user.name,
      storeId: selectedStoreId,
      storeName: selectedStore.name,
      date: getTodayStr(),
      report: report.trim(),
      images: patrolImages,
      gpsAnomaly: hasGpsAnomaly,
      deviceFingerprint: generateFingerprint().id,
      createdAt: new Date().toISOString(),
    };

    try {
      await addPatrolRecord(record);
      if (hasGpsAnomaly) {
        showToast('巡店记录已提交（部分照片GPS未获取，已标记异常）', 'warning');
      } else {
        showToast('巡店记录提交成功');
      }
      setSelectedStoreId('');
      setReport('');
      setImages({});
      setGpsData({});
    } catch {
      showToast('提交失败，请检查网络后重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-slate-800">巡店上传</h2>
          <div className="flex items-center gap-2">
            {refreshing && (
              <span className="text-xs text-slate-400">同步中...</span>
            )}
            <span className="text-xs text-slate-400">{getTodayStr()}</span>
          </div>
        </div>
        <p className="text-sm text-slate-500">请实时拍摄4张照片并填写巡店报告</p>
      </div>

      {/* Store Selection */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          选择门店 <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedStoreId}
          onChange={(e) => setSelectedStoreId(e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
        >
          <option value="">请选择要巡店的门店</option>
          {user.stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name} - {store.region}
              {todayStoreIds.has(store.id) ? ' (已巡店)' : ''}
            </option>
          ))}
        </select>
        {isDuplicate && (
          <div className="mt-2 p-2.5 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-xs text-red-600 font-medium">该门店今天已提交过巡店记录</p>
          </div>
        )}
      </div>

      {/* Patrol Report */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          巡店报告 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={report}
          onChange={(e) => setReport(e.target.value)}
          placeholder="请输入巡店发现的问题、整改建议等"
          rows={4}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-300 resize-none"
        />
      </div>

      {/* Image Uploads - Force Camera */}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-sm font-medium text-slate-700">上传照片</h3>
          <span className="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded font-medium">全部必须实时拍摄</span>
        </div>
        {IMAGE_TYPES.map((item, index) => (
          <div key={item.type} className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-6 font-medium">
              {index + 1}
            </div>
            <div className="flex-1">
              <ImageUploader
                label={item.label}
                value={images[item.type] ?? null}
                onChange={(data, gps) => handleImageChange(item.type, data, gps)}
                required
                forceCamera
                hint={item.hint}
                watermarkOptions={{
                  ...watermarkBase,
                  label: `巡店-${item.label}`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Submit */}
      <div className="px-4 pb-4">
        <Button
          block
          size="lg"
          loading={loading}
          onClick={handleSubmit}
          disabled={isDuplicate}
        >
          {isDuplicate ? '该门店今日已巡店' : '提交巡店记录'}
        </Button>
      </div>
    </div>
  );
}