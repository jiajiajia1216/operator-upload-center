import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ImageUploader from '../components/ui/ImageUploader';
import Button from '../components/ui/Button';
import { addReportRecord, getReportRecords, fetchReportRecords } from '../utils/storage';
import { generateId, getTodayStr } from '../utils/helpers';
import { generateFingerprint } from '../utils/device';
import type { ReportSlot } from '../types';

function getReportSlots(): { label: string; timeHint: string; window: { start: number; end: number } }[] {
  return [
    {
      label: '上午通报',
      timeHint: '月度累计数据通报（上午时段 6:00-12:00）',
      window: { start: 6, end: 12 },
    },
    {
      label: '下午通报 1',
      timeHint: '实时数据通报（12:00-14:00）',
      window: { start: 12, end: 14 },
    },
    {
      label: '下午通报 2',
      timeHint: '实时数据通报（14:00-17:00）',
      window: { start: 14, end: 17 },
    },
    {
      label: '下午通报 3',
      timeHint: '实时数据通报（17:00-20:00）',
      window: { start: 17, end: 20 },
    },
  ];
}

function getTimeWindowStatus(slot: { start: number; end: number }): 'open' | 'closed' | 'upcoming' {
  const hour = new Date().getHours();
  if (hour >= slot.start && hour < slot.end) return 'open';
  if (hour < slot.start) return 'upcoming';
  return 'closed';
}

export default function Report() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const slotDefs = useMemo(() => getReportSlots(), []);

  const [slots, setSlots] = useState(() =>
    slotDefs.map((s) => ({
      label: s.label,
      timeHint: s.timeHint,
      image: null as string | null,
      uploadTime: null as string | null,
    }))
  );
  const [loading, setLoading] = useState(false);
  const [dismissedReminder, setDismissedReminder] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch records from API on mount
  useEffect(() => {
    if (user) {
      setRefreshing(true);
      fetchReportRecords(user.id).finally(() => setRefreshing(false));
    }
  }, [user]);

  if (!user) return null;

  const todayRecords = getReportRecords().filter(
    (r) => r.operatorId === user.id && r.date === getTodayStr()
  );
  const todayTotalSlots = todayRecords.reduce(
    (sum, r) => sum + r.slots.filter((s) => s.image).length,
    0
  );

  // 20:00前提醒：如果已关闭的时段有未上传的，提醒用户
  const missingSlots = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 20) return []; // 20点后不再提醒
    return slotDefs.filter((s) => getTimeWindowStatus(s.window) === 'closed');
  }, [slotDefs]);

  const hasMissingUploads = missingSlots.length > 0 && todayTotalSlots < 4 && !dismissedReminder;

  useEffect(() => {
    if (hasMissingUploads && missingSlots.length > 0) {
      const missingNames = missingSlots.map((s) => s.label).join('、');
      showToast(`${missingNames}已过上传时间，今日尚未完成所有通报上传（${todayTotalSlots}/4），请确认是否符合标准`, 'warning');
    }
  }, [hasMissingUploads, missingSlots.length, todayTotalSlots]);

  const handleSlotImageChange = (index: number, data: string | null) => {
    const status = getTimeWindowStatus(slotDefs[index].window);
    if (status === 'closed') {
      showToast(`${slotDefs[index].label}时间窗口已关闭，无法上传`, 'error');
      return;
    }
    if (status === 'upcoming') {
      showToast(`${slotDefs[index].label}尚未到时间，请在${slotDefs[index].window.start}:00-${slotDefs[index].window.end}:00期间上传`, 'warning');
      return;
    }

    setSlots((prev) =>
      prev.map((s, i) =>
        i === index
          ? { ...s, image: data, uploadTime: data ? new Date().toISOString() : null }
          : s
      )
    );
  };

  const handleSubmit = async () => {
    const filledCount = slots.filter((s) => s.image).length;
    if (filledCount === 0) {
      showToast('请至少上传一张通报截图', 'error');
      return;
    }

    for (let i = 0; i < slots.length; i++) {
      if (slots[i].image) {
        const status = getTimeWindowStatus(slotDefs[i].window);
        if (status === 'closed') {
          showToast(`${slots[i].label}已超出时间窗口，请移除后重新提交`, 'error');
          return;
        }
      }
    }

    setLoading(true);

    const record = {
      id: generateId(),
      operatorId: user.id,
      operatorName: user.name,
      date: getTodayStr(),
      slots: slots.map((s) => ({ ...s })),
      deviceFingerprint: generateFingerprint().id,
      createdAt: new Date().toISOString(),
    };

    try {
      await addReportRecord(record);
      showToast(`通报提交成功（${filledCount}/4次）`);
      setSlots((prev) =>
        prev.map((s, i) => {
          const status = getTimeWindowStatus(slotDefs[i].window);
          return status === 'closed' ? { ...s } : { ...s, image: null, uploadTime: null };
        })
      );
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
          <h2 className="text-lg font-bold text-slate-800">数据通报上传</h2>
          <div className="flex items-center gap-2">
            {refreshing && (
              <span className="text-xs text-slate-400">同步中...</span>
            )}
            <span className="text-xs text-slate-400">{getTodayStr()}</span>
          </div>
        </div>
        <p className="text-sm text-slate-500">
          请在工作群通报后立即截图上传（含数据+点评）
        </p>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min((todayTotalSlots / 4) * 100, 100)}%` }}
            />
          </div>
          <span className="text-xs text-primary font-medium">{todayTotalSlots}/4</span>
        </div>
      </div>

      {/* Missing Upload Reminder */}
      {hasMissingUploads && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800">通报未完成提醒</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  今日已完成 {todayTotalSlots}/4 次通报上传，请在 20:00 前完成所有通报，确保符合标准
                </p>
              </div>
            </div>
            <button
              onClick={() => setDismissedReminder(true)}
              className="text-amber-400 hover:text-amber-600 flex-shrink-0 p-0.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Requirements */}
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
        <h3 className="text-sm font-medium text-blue-800 mb-2">通报要求</h3>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>一天要求通报4次，全部必填</li>
          <li>上午：通报月度累计数据（6:00-12:00）</li>
          <li>下午：分时段通报实时数据</li>
          <li>截图需包含数据和点评内容</li>
          <li>需在对应时间段内上传，超时无法补传</li>
        </ul>
      </div>

      {/* Upload Slots */}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-5">
        {slots.map((slot, index) => {
          const status = getTimeWindowStatus(slotDefs[index].window);
          const statusLabel =
            status === 'open'
              ? '可上传'
              : status === 'upcoming'
              ? `未到时间（${slotDefs[index].window.start}:00开始）`
              : '已关闭';
          const statusColor =
            status === 'open'
              ? 'bg-emerald-50 text-emerald-600'
              : status === 'upcoming'
              ? 'bg-amber-50 text-amber-600'
              : 'bg-slate-100 text-slate-400';

          return (
            <div key={index}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${statusColor}`}>
                  {statusLabel}
                </span>
              </div>
              <ImageUploader
                label={slot.label}
                value={slot.image}
                onChange={(data) => handleSlotImageChange(index, data)}
                required={status === 'open'}
                hint={slot.timeHint}
                placeholder={status === 'closed' ? '时间窗口已关闭' : '点击上传截图'}
              />
            </div>
          );
        })}
      </div>

      {/* Submit */}
      <div className="px-4 pb-4">
        <Button
          block
          size="lg"
          loading={loading}
          onClick={handleSubmit}
        >
          提交通报记录
        </Button>
      </div>
    </div>
  );
}