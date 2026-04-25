import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/ui/Modal';
import { getPatrolRecords, deletePatrolRecord, fetchPatrolRecords } from '../utils/storage';
import { getReportRecords, deleteReportRecord, fetchReportRecords } from '../utils/storage';
import { getMeetingRecords, deleteMeetingRecord, fetchMeetingRecords } from '../utils/storage';
import { getTrainingRecords, deleteTrainingRecord, fetchTrainingRecords } from '../utils/storage';
import { formatDate, isToday } from '../utils/helpers';
import type { RecordType } from '../types';

type TabKey = 'patrol' | 'report' | 'meeting' | 'training';

interface RecordItem {
  id: string;
  type: RecordType;
  date: string;
  label: string;
  detail: string;
  thumbnails: string[];
  canDelete: boolean;
  anomaly?: boolean;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'patrol', label: '巡店' },
  { key: 'report', label: '通报' },
  { key: 'meeting', label: '会议' },
  { key: 'training', label: '培训' },
];

export default function Records() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabKey>('patrol');
  const [refreshing, setRefreshing] = useState(false);
  const [previewModal, setPreviewModal] = useState<{ open: boolean; images: string[]; index: number }>({
    open: false,
    images: [],
    index: 0,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; type: TabKey; id: string }>({
    open: false,
    type: 'patrol',
    id: '',
  });
  const [detailModal, setDetailModal] = useState<{ open: boolean; item: RecordItem | null }>({
    open: false,
    item: null,
  });

  const fetchRecords = useCallback(async (operatorId: string) => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchPatrolRecords(operatorId),
        fetchReportRecords(operatorId),
        fetchMeetingRecords(operatorId),
        fetchTrainingRecords(operatorId),
      ]);
    } catch {
      // Silently use cached data
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Fetch from API on mount and when tab changes
  useEffect(() => {
    if (user) {
      fetchRecords(user.id);
    }
  }, [user, fetchRecords]);

  if (!user) return null;

  const getRecords = (): RecordItem[] => {
    const items: RecordItem[] = [];

    if (activeTab === 'patrol') {
      const records = getPatrolRecords().filter((r) => r.operatorId === user.id);
      for (const r of records) {
        items.push({
          id: r.id,
          type: 'patrol',
          date: r.date,
          label: '巡店',
          detail: `${r.storeName} | ${r.report ? r.report.slice(0, 30) : '无报告'}`,
          thumbnails: r.images.map((img) => img.data),
          canDelete: isToday(r.date),
          anomaly: r.gpsAnomaly,
        });
      }
    } else if (activeTab === 'report') {
      const records = getReportRecords().filter((r) => r.operatorId === user.id);
      for (const r of records) {
        const filledSlots = r.slots.filter((s) => s.image);
        items.push({
          id: r.id,
          type: 'report',
          date: r.date,
          label: '数据通报',
          detail: `通报${filledSlots.length}次`,
          thumbnails: filledSlots.map((s) => s.image as string),
          canDelete: isToday(r.date),
        });
      }
    } else if (activeTab === 'meeting') {
      const records = getMeetingRecords().filter((r) => r.operatorId === user.id);
      for (const r of records) {
        items.push({
          id: r.id,
          type: 'meeting',
          date: r.date,
          label: '会议',
          detail: `${r.meetingLink ? '有链接' : '无链接'}${'summary' in r ? ' | ' + (r.summary as string).slice(0, 20) : ''}`,
          thumbnails: r.images,
          canDelete: isToday(r.date),
          anomaly: r.gpsAnomaly,
        });
      }
    } else if (activeTab === 'training') {
      const records = getTrainingRecords().filter((r) => r.operatorId === user.id);
      for (const r of records) {
        items.push({
          id: r.id,
          type: 'training',
          date: r.date,
          label: '培训',
          detail: r.theme || '未填写主题',
          thumbnails: r.images,
          canDelete: isToday(r.date),
          anomaly: r.gpsAnomaly,
        });
      }
    }

    return items;
  };

  const records = getRecords();

  const handleDelete = async () => {
    const { type, id } = deleteConfirm;
    const deleteFn = {
      patrol: deletePatrolRecord,
      report: deleteReportRecord,
      meeting: deleteMeetingRecord,
      training: deleteTrainingRecord,
    }[type];

    try {
      await deleteFn(id, user?.id);
      showToast('删除成功');
      setDeleteConfirm({ open: false, type: 'patrol', id: '' });
    } catch {
      showToast('删除失败，请检查网络后重试', 'error');
    }
  };

  const typeLabels: Record<TabKey, string> = {
    patrol: '巡店记录',
    report: '通报记录',
    meeting: '会议记录',
    training: '培训记录',
  };

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-800">上传记录</h2>
          <button
            onClick={() => user && fetchRecords(user.id)}
            disabled={refreshing}
            className="text-xs text-primary font-medium flex items-center gap-1 disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? '同步中...' : '刷新'}
          </button>
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-slate-500 active:bg-white/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Records List */}
      {records.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <svg className="w-12 h-12 text-slate-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-sm text-slate-400">暂无{typeLabels[activeTab]}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <div
              key={record.id}
              className="bg-white rounded-2xl p-4 shadow-sm animate-fade-in cursor-pointer active:bg-slate-50"
              onClick={() => setDetailModal({ open: true, item: record })}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-800">{formatDate(record.date)}</p>
                  {record.anomaly && (
                    <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-medium">GPS异常</span>
                  )}
                </div>
                {record.canDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm({ open: true, type: record.type as TabKey, id: record.id });
                    }}
                    className="text-xs text-red-400 hover:text-red-500 px-2 py-1 rounded-lg active:bg-red-50"
                  >
                    删除
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 mb-2">{record.label} - {record.detail}</p>
              {/* Thumbnails */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {record.thumbnails.slice(0, 4).map((thumb, idx) => (
                  <img
                    key={idx}
                    src={thumb}
                    alt={`缩略图${idx + 1}`}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    loading="lazy"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewModal({ open: true, images: record.thumbnails, index: idx });
                    }}
                  />
                ))}
                {record.thumbnails.length > 4 && (
                  <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 text-xs text-slate-400">
                    +{record.thumbnails.length - 4}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        open={detailModal.open}
        title="记录详情"
        onClose={() => setDetailModal({ open: false, item: null })}
      >
        {detailModal.item && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-400">日期</span>
                <p className="font-medium">{formatDate(detailModal.item.date)}</p>
              </div>
              <div>
                <span className="text-slate-400">类型</span>
                <p className="font-medium">{detailModal.item.label}</p>
              </div>
            </div>
            <div>
              <span className="text-slate-400 text-sm">详情</span>
              <p className="text-sm">{detailModal.item.detail}</p>
            </div>
            {detailModal.item.anomaly && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-700 font-medium">GPS定位未获取，此记录已标记为异常</p>
              </div>
            )}
            <div>
              <span className="text-slate-400 text-sm">附件（{detailModal.item.thumbnails.length}张）</span>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {detailModal.item.thumbnails.map((thumb, idx) => (
                  <img
                    key={idx}
                    src={thumb}
                    alt={`详情图${idx + 1}`}
                    className="w-full rounded-lg"
                    loading="lazy"
                    onClick={() => setPreviewModal({ open: true, images: detailModal.item!.thumbnails, index: idx })}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        open={previewModal.open}
        title={`图片预览 ${previewModal.index + 1}/${previewModal.images.length}`}
        onClose={() => setPreviewModal({ open: false, images: [], index: 0 })}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setPreviewModal((prev) => ({ ...prev, index: Math.max(0, prev.index - 1) }))}
              disabled={previewModal.index === 0}
              className="px-4 py-2 bg-slate-100 rounded-lg text-sm text-slate-600 disabled:opacity-30"
            >
              上一张
            </button>
            <span className="text-sm text-slate-500">{previewModal.index + 1} / {previewModal.images.length}</span>
            <button
              onClick={() => setPreviewModal((prev) => ({
                ...prev,
                index: Math.min(prev.images.length - 1, prev.index + 1),
              }))}
              disabled={previewModal.index === previewModal.images.length - 1}
              className="px-4 py-2 bg-slate-100 rounded-lg text-sm text-slate-600 disabled:opacity-30"
            >
              下一张
            </button>
          </div>
          <img
            src={previewModal.images[previewModal.index] || ''}
            alt="预览"
            className="w-full rounded-xl"
          />
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        open={deleteConfirm.open}
        title="确认删除"
        onClose={() => setDeleteConfirm({ open: false, type: 'patrol', id: '' })}
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteConfirm({ open: false, type: 'patrol', id: '' })}
              className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium active:bg-slate-200"
            >
              取消
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium active:bg-red-600"
            >
              删除
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">确定要删除这条记录吗？删除后无法恢复。</p>
      </Modal>
    </div>
  );
}