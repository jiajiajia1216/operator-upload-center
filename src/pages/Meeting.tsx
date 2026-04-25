import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import ImageUploader from '../components/ui/ImageUploader';
import { addMeetingRecord, getMeetingRecords, fetchMeetingRecords } from '../utils/storage';
import { generateId, getCurrentMonthStr, formatDate } from '../utils/helpers';
import { generateFingerprint } from '../utils/device';
import type { GPSData } from '../types';

export default function Meeting() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [meetingLink, setMeetingLink] = useState('');
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().slice(0, 10));
  const [image, setImage] = useState<string | null>(null);
  const [imageGps, setImageGps] = useState<GPSData | null>(null);
  const [meetingSummary, setMeetingSummary] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch records from API on mount
  useEffect(() => {
    if (user) {
      setRefreshing(true);
      fetchMeetingRecords(user.id).finally(() => setRefreshing(false));
    }
  }, [user]);

  if (!user) return null;

  const monthStr = getCurrentMonthStr();
  const monthlyCount = getMeetingRecords().filter(
    (r) => r.operatorId === user.id && r.date.startsWith(monthStr)
  ).length;
  const isComplete = monthlyCount >= 12;

  const watermarkOptions = useMemo(() => ({
    operatorName: user.name,
    label: `会议-${formatDate(meetingDate)}`,
  }), [user.name, meetingDate]);

  const handleImageChange = (data: string | null, gps: GPSData | null) => {
    setImage(data);
    setImageGps(gps);
  };

  const handleSubmit = async () => {
    if (!meetingDate) {
      showToast('请选择会议日期', 'error');
      return;
    }
    if (!meetingLink.trim()) {
      showToast('请输入觅讯会议链接', 'error');
      return;
    }
    if (!meetingSummary.trim()) {
      showToast('请填写会议摘要', 'error');
      return;
    }
    if (!image) {
      showToast('请拍摄会议照片', 'error');
      return;
    }

    setLoading(true);

    const record = {
      id: generateId(),
      operatorId: user.id,
      operatorName: user.name,
      date: meetingDate,
      images: [image],
      meetingLink: meetingLink.trim(),
      summary: meetingSummary.trim(),
      gpsData: imageGps,
      gpsAnomaly: !imageGps,
      deviceFingerprint: generateFingerprint().id,
      createdAt: new Date().toISOString(),
    };

    try {
      await addMeetingRecord(record);
      if (!imageGps) {
        showToast('会议记录已提交（GPS未获取，已标记异常）', 'warning');
      } else {
        showToast('会议记录提交成功');
      }
      setMeetingLink('');
      setMeetingDate(new Date().toISOString().slice(0, 10));
      setMeetingSummary('');
      setImage(null);
      setImageGps(null);
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
          <h2 className="text-lg font-bold text-slate-800">会议记录上传</h2>
          <div className="flex items-center gap-2">
            {refreshing && (
              <span className="text-xs text-slate-400">同步中...</span>
            )}
          </div>
        </div>
        <p className="text-sm text-slate-500">上传会议照片和觅讯会议链接</p>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isComplete ? 'bg-emerald-500' : 'bg-primary'}`}
              style={{ width: `${Math.min((monthlyCount / 12) * 100, 100)}%` }}
            />
          </div>
          <span className={`text-xs font-medium ${isComplete ? 'text-emerald-600' : 'text-primary'}`}>
            本月 {monthlyCount}/12次 {isComplete && '(已完成)'}
          </span>
        </div>
      </div>

      {/* Requirements */}
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
        <h3 className="text-sm font-medium text-blue-800 mb-2">会议要求</h3>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>每月至少12次会议，全部字段必填</li>
          <li>照片必须实时拍摄（自动水印，含时间+GPS）</li>
          <li>照片需体现参会人员及会议内容</li>
          <li>推荐使用觅讯会议，上传会议链接</li>
        </ul>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
        {/* Meeting Date */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            会议日期 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={meetingDate}
            onChange={(e) => setMeetingDate(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Meeting Link */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            觅讯会议链接 <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            value={meetingLink}
            onChange={(e) => setMeetingLink(e.target.value)}
            placeholder="请输入觅讯会议链接"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-300"
          />
        </div>

        {/* Meeting Summary */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            会议摘要 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={meetingSummary}
            onChange={(e) => setMeetingSummary(e.target.value)}
            placeholder="请简要描述会议内容、参会人员、讨论要点等"
            rows={3}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-300 resize-none"
          />
        </div>

        {/* Meeting Photo - Force Camera */}
        <div>
          <ImageUploader
            label="会议照片"
            value={image}
            onChange={handleImageChange}
            required
            forceCamera
            hint="必须实时拍摄，需体现参会人员及会议内容"
            watermarkOptions={watermarkOptions}
          />
        </div>
      </div>

      {/* Submit */}
      <div className="px-4 pb-4">
        <Button block size="lg" loading={loading} onClick={handleSubmit}>
          提交会议记录
        </Button>
      </div>

      {/* Image Preview */}
      {previewOpen && image && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setPreviewOpen(false)}>
          <img src={image} alt="预览" className="max-w-full max-h-full object-contain" />
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center text-xl" onClick={() => setPreviewOpen(false)}>
            x
          </button>
        </div>
      )}
    </div>
  );
}