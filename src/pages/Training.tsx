import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import ImageUploader from '../components/ui/ImageUploader';
import { addTrainingRecord, getTrainingRecords, fetchTrainingRecords } from '../utils/storage';
import { generateId, getCurrentMonthStr } from '../utils/helpers';
import { generateFingerprint } from '../utils/device';
import type { GPSData } from '../types';

export default function Training() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [theme, setTheme] = useState('');
  const [examInfo, setExamInfo] = useState('');
  const [trainingDate, setTrainingDate] = useState(new Date().toISOString().slice(0, 10));
  const [image, setImage] = useState<string | null>(null);
  const [imageGps, setImageGps] = useState<GPSData | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch records from API on mount
  useEffect(() => {
    if (user) {
      setRefreshing(true);
      fetchTrainingRecords(user.id).finally(() => setRefreshing(false));
    }
  }, [user]);

  if (!user) return null;

  const monthStr = getCurrentMonthStr();
  const monthlyCount = getTrainingRecords().filter(
    (r) => r.operatorId === user.id && r.date.startsWith(monthStr)
  ).length;
  const isComplete = monthlyCount >= 2;

  const watermarkOptions = useMemo(() => ({
    operatorName: user.name,
    label: `培训-${theme || '未填写主题'}`,
  }), [user.name, theme]);

  const handleImageChange = (data: string | null, gps: GPSData | null) => {
    setImage(data);
    setImageGps(gps);
  };

  const handleSubmit = async () => {
    if (!trainingDate) {
      showToast('请选择培训日期', 'error');
      return;
    }
    if (!theme.trim()) {
      showToast('请输入培训主题', 'error');
      return;
    }
    if (!examInfo.trim()) {
      showToast('请填写考试信息', 'error');
      return;
    }
    if (!image) {
      showToast('请拍摄培训照片', 'error');
      return;
    }

    setLoading(true);

    const record = {
      id: generateId(),
      operatorId: user.id,
      operatorName: user.name,
      date: trainingDate,
      theme: theme.trim(),
      examInfo: examInfo.trim(),
      images: [image],
      gpsData: imageGps,
      gpsAnomaly: !imageGps,
      deviceFingerprint: generateFingerprint().id,
      createdAt: new Date().toISOString(),
    };

    try {
      await addTrainingRecord(record);
      if (!imageGps) {
        showToast('培训记录已提交（GPS未获取，已标记异常）', 'warning');
      } else {
        showToast('培训记录提交成功');
      }
      setTheme('');
      setExamInfo('');
      setTrainingDate(new Date().toISOString().slice(0, 10));
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
          <h2 className="text-lg font-bold text-slate-800">培训记录上传</h2>
          <div className="flex items-center gap-2">
            {refreshing && (
              <span className="text-xs text-slate-400">同步中...</span>
            )}
          </div>
        </div>
        <p className="text-sm text-slate-500">上传线下培训记录（全部字段必填）</p>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isComplete ? 'bg-emerald-500' : 'bg-primary'}`}
              style={{ width: `${Math.min((monthlyCount / 2) * 100, 100)}%` }}
            />
          </div>
          <span className={`text-xs font-medium ${isComplete ? 'text-emerald-600' : 'text-primary'}`}>
            本月 {monthlyCount}/2次 {isComplete && '(已完成)'}
          </span>
        </div>
      </div>

      {/* Requirements */}
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
        <h3 className="text-sm font-medium text-blue-800 mb-2">培训要求</h3>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>每月至少2次线下培训，全部字段必填</li>
          <li>照片必须实时拍摄（自动水印，含时间+GPS）</li>
          <li>需填写培训主题和考试信息</li>
        </ul>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            培训日期 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={trainingDate}
            onChange={(e) => setTrainingDate(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Theme */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            培训主题 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="请输入本次培训主题"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-300"
          />
        </div>

        {/* Exam Info */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            考试信息 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={examInfo}
            onChange={(e) => setExamInfo(e.target.value)}
            placeholder="请填写考试相关信息（考试形式、成绩要求、通过率等）"
            rows={3}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-300 resize-none"
          />
        </div>

        {/* Training Photo - Force Camera */}
        <div>
          <ImageUploader
            label="培训照片"
            value={image}
            onChange={handleImageChange}
            required
            forceCamera
            hint="必须实时拍摄，上传培训现场照片"
            watermarkOptions={watermarkOptions}
          />
        </div>
      </div>

      {/* Submit */}
      <div className="px-4 pb-4">
        <Button block size="lg" loading={loading} onClick={handleSubmit}>
          提交培训记录
        </Button>
      </div>

      {/* Preview */}
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