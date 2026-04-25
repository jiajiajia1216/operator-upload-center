import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getOperators, getDeviceApprovals, getDeviceBindings, approveDevice, rejectDevice, getPendingApprovals } from '../utils/storage';
import { getLoginRecords, checkDeviceAnomaly } from '../utils/device';
import { getPatrolRecords, getReportRecords, getMeetingRecords, getTrainingRecords } from '../utils/storage';

type AdminTab = 'overview' | 'login-alerts' | 'gps-alerts' | 'records' | 'device-approval';

export default function Admin() {
  const { user } = useAuth();
  if (!user || !user.isAdmin) {
    return <Navigate to="/" replace />;
  }
  return <AdminPanel />;
}

function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const pendingCount = getPendingApprovals().length;

  return (
    <div className="px-3 pt-3 pb-4">
      <h1 className="text-lg font-bold mb-3" style={{ color: '#3D3A39' }}>管理面板</h1>

      {/* Tabs - 横向滚动 */}
      <div className="flex gap-1 mb-3 overflow-x-auto no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
        {([
          { key: 'overview' as AdminTab, label: '数据总览' },
          { key: 'device-approval' as AdminTab, label: `设备审批${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
          { key: 'login-alerts' as AdminTab, label: '登录异常' },
          { key: 'gps-alerts' as AdminTab, label: 'GPS异常' },
          { key: 'records' as AdminTab, label: '上传记录' },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-3 py-2 text-xs font-semibold rounded-xl whitespace-nowrap"
            style={{
              background: activeTab === tab.key ? '#F9E72C' : '#fff',
              color: activeTab === tab.key ? '#3D3A39' : '#8C8685',
              border: activeTab === tab.key ? 'none' : '1px solid #E8E5E3',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'device-approval' && <DeviceApprovalTab key={refreshKey} onApprove={() => setRefreshKey(k => k + 1)} />}
      {activeTab === 'login-alerts' && <LoginAlertsTab />}
      {activeTab === 'gps-alerts' && <GpsAlertsTab />}
      {activeTab === 'records' && <RecordsTab />}
    </div>
  );
}

function DeviceApprovalTab({ onApprove }: { onApprove: () => void }) {
  const [approvals, setApprovals] = useState(() => getDeviceApprovals());
  const [bindings, setBindings] = useState(() => getDeviceBindings());

  const refresh = () => {
    setApprovals(getDeviceApprovals());
    setBindings(getDeviceBindings());
    onApprove();
  };

  const pending = approvals.filter(a => a.status === 'pending');
  const reviewed = approvals.filter(a => a.status !== 'pending').slice(0, 20);

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-bold mb-2" style={{ color: '#3D3A39' }}>
          待审批
          {pending.length > 0 && <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ background: '#FEE2E2', color: '#DC2626' }}>{pending.length}</span>}
        </h3>
        {pending.length === 0 ? (
          <div className="rounded-2xl p-6 text-center" style={{ background: '#fff', border: '1px solid #E8E5E3' }}>
            <p className="text-sm" style={{ color: '#8C8685' }}>暂无待审批请求</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pending.map(approval => (
              <div key={approval.id} className="rounded-2xl p-3" style={{ background: '#fff', border: '1px solid #E8E5E3', borderLeft: '3px solid #F59E0B' }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: '#3D3A39' }}>{approval.operatorName}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: '#FEF3C7', color: '#D97706' }}>新设备</span>
                  </div>
                  <span className="text-[10px]" style={{ color: '#B8B4B2' }}>{new Date(approval.requestedAt).toLocaleString('zh-CN')}</span>
                </div>
                <div className="text-xs mb-2" style={{ color: '#8C8685' }}>
                  <p>{approval.deviceInfo}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#B8B4B2' }}>ID: {approval.deviceId.slice(0, 16)}...</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { approveDevice(approval.id); refresh(); }} className="flex-1 py-2 rounded-xl text-sm font-bold" style={{ background: '#22C55E', color: '#fff' }}>同意</button>
                  <button onClick={() => { rejectDevice(approval.id); refresh(); }} className="flex-1 py-2 rounded-xl text-sm font-bold" style={{ background: '#EF4444', color: '#fff' }}>拒绝</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {reviewed.length > 0 && (
        <div>
          <h3 className="text-sm font-bold mb-2" style={{ color: '#3D3A39' }}>审批记录</h3>
          <div className="space-y-1.5">
            {reviewed.map(approval => (
              <div key={approval.id} className="rounded-xl p-2.5 flex items-center justify-between" style={{ background: '#fff', border: '1px solid #E8E5E3' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#3D3A39' }}>{approval.operatorName}</p>
                  <p className="text-[10px]" style={{ color: '#B8B4B2' }}>{new Date(approval.requestedAt).toLocaleString('zh-CN')}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded font-medium" style={{ background: approval.status === 'approved' ? '#DCFCE7' : '#FEE2E2', color: approval.status === 'approved' ? '#16A34A' : '#DC2626' }}>
                  {approval.status === 'approved' ? '已同意' : '已拒绝'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-bold mb-2" style={{ color: '#3D3A39' }}>已绑定设备</h3>
        <div className="rounded-2xl p-3" style={{ background: '#fff', border: '1px solid #E8E5E3' }}>
          {bindings.length === 0 ? (
            <p className="text-sm text-center py-3" style={{ color: '#8C8685' }}>暂无</p>
          ) : (
            <div className="space-y-1.5">
              {bindings.map((b, idx) => (
                <div key={idx} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg" style={{ background: '#FAFAFA' }}>
                  <div>
                    <span className="text-xs font-medium" style={{ color: '#3D3A39' }}>{b.operatorName}</span>
                    <span className="text-[10px] ml-2" style={{ color: '#B8B4B2' }}>{b.deviceId.slice(0, 8)}</span>
                  </div>
                  <span className="text-[10px]" style={{ color: '#B8B4B2' }}>{new Date(b.boundAt).toLocaleDateString('zh-CN')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewTab() {
  const operators = getOperators();
  const loginRecords = getLoginRecords();
  const patrols = getPatrolRecords();
  const reports = getReportRecords();
  const meetings = getMeetingRecords();
  const trainings = getTrainingRecords();
  const today = new Date().toISOString().slice(0, 10);
  const monthStr = today.slice(0, 7);
  const flaggedLogins = loginRecords.filter(r => r.flagged);
  const gpsAnomalyPatrols = patrols.filter(r => r.gpsAnomaly);
  const todayRecords = {
    patrol: patrols.filter(r => r.date === today).length,
    report: reports.filter(r => r.date === today).length,
    meeting: meetings.filter(r => r.date.startsWith(monthStr)).length,
    training: trainings.filter(r => r.date.startsWith(monthStr)).length,
  };
  const pendingApprovals = getPendingApprovals().length;

  return (
    <div className="space-y-3">
      {(flaggedLogins.length > 0 || gpsAnomalyPatrols.length > 0 || pendingApprovals > 0) && (
        <div className="rounded-2xl p-3" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <h3 className="text-sm font-bold mb-1" style={{ color: '#991B1B' }}>异常告警</h3>
          <div className="space-y-0.5 text-xs" style={{ color: '#DC2626' }}>
            {pendingApprovals > 0 && <p>{pendingApprovals} 条设备审批待处理</p>}
            {flaggedLogins.length > 0 && <p>{flaggedLogins.length} 条异常登录记录</p>}
            {gpsAnomalyPatrols.length > 0 && <p>{gpsAnomalyPatrols.length} 条巡店GPS异常</p>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <StatCard label="操盘手总数" value={operators.length} />
        <StatCard label="今日巡店" value={todayRecords.patrol} />
        <StatCard label="今日通报" value={todayRecords.report} />
        <StatCard label="本月会议" value={`${todayRecords.meeting}/12`} />
        <StatCard label="本月培训" value={`${todayRecords.training}/2`} />
        <StatCard label="待审批" value={pendingApprovals} alert={pendingApprovals > 0} />
      </div>

      <div className="rounded-2xl p-3" style={{ background: '#fff', border: '1px solid #E8E5E3' }}>
        <h3 className="text-sm font-bold mb-2" style={{ color: '#3D3A39' }}>操盘手完成情况</h3>
        <div className="space-y-2">
          {operators.map(op => {
            const opPatrols = patrols.filter(r => r.operatorId === op.id && r.date === today).length;
            const opReports = reports.filter(r => r.operatorId === op.id && r.date === today).length;
            const opMeetings = meetings.filter(r => r.operatorId === op.id && r.date.startsWith(monthStr)).length;
            const opTrainings = trainings.filter(r => r.operatorId === op.id && r.date.startsWith(monthStr)).length;
            const anomaly = checkDeviceAnomaly(op.id);
            return (
              <div key={op.id} className="rounded-xl p-2.5" style={{ background: '#FAFAFA', border: anomaly.isAnomaly ? '1px solid #FECACA' : '1px solid #F0EEEC' }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium" style={{ color: '#3D3A39' }}>{op.name}</span>
                  {anomaly.isAnomaly && <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: '#FEE2E2', color: '#DC2626' }}>设备异常</span>}
                </div>
                <div className="grid grid-cols-4 gap-1 text-center">
                  {[
                    { v: opPatrols, l: '巡店', done: opPatrols > 0 },
                    { v: opReports, l: '通报', done: opReports > 0 },
                    { v: `${opMeetings}/12`, l: '会议', done: opMeetings >= 12 },
                    { v: `${opTrainings}/2`, l: '培训', done: opTrainings >= 2 },
                  ].map((d, i) => (
                    <div key={i}>
                      <div className="text-xs font-bold" style={{ color: d.done ? '#22C55E' : '#B8B4B2' }}>{d.v}</div>
                      <div className="text-[10px]" style={{ color: '#B8B4B2' }}>{d.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, alert }: { label: string; value: number | string; alert?: boolean }) {
  return (
    <div className="rounded-xl p-3" style={{ background: '#fff', border: alert ? '1px solid #FECACA' : '1px solid #E8E5E3' }}>
      <div className="text-[11px]" style={{ color: '#8C8685' }}>{label}</div>
      <div className="text-xl font-bold" style={{ color: alert ? '#DC2626' : '#3D3A39' }}>{value}</div>
    </div>
  );
}

function LoginAlertsTab() {
  const loginRecords = getLoginRecords();
  const flagged = loginRecords.filter(r => r.flagged);

  if (flagged.length === 0) {
    return (
      <div className="rounded-2xl p-6 text-center" style={{ background: '#fff', border: '1px solid #E8E5E3' }}>
        <p className="text-sm" style={{ color: '#8C8685' }}>暂无异常登录</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {flagged.map((record, idx) => (
        <div key={idx} className="rounded-2xl p-3" style={{ background: '#fff', border: '1px solid #E8E5E3', borderLeft: '3px solid #EF4444' }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-bold" style={{ color: '#3D3A39' }}>{record.operatorName}</span>
            <span className="text-[10px]" style={{ color: '#B8B4B2' }}>{new Date(record.timestamp).toLocaleString('zh-CN')}</span>
          </div>
          <p className="text-xs" style={{ color: '#8C8685' }}>
            {record.flagReason || '多设备登录异常'}
          </p>
        </div>
      ))}
    </div>
  );
}

function GpsAlertsTab() {
  const patrols = getPatrolRecords().filter(r => r.gpsAnomaly);
  const meetings = getMeetingRecords().filter(r => r.gpsAnomaly);
  const trainings = getTrainingRecords().filter(r => r.gpsAnomaly);
  const all = [
    ...patrols.map(r => ({ ...r, type: '巡店' as const })),
    ...meetings.map(r => ({ ...r, type: '会议' as const })),
    ...trainings.map(r => ({ ...r, type: '培训' as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (all.length === 0) {
    return (
      <div className="rounded-2xl p-6 text-center" style={{ background: '#fff', border: '1px solid #E8E5E3' }}>
        <p className="text-sm" style={{ color: '#8C8685' }}>暂无GPS异常</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {all.map((r, idx) => (
        <div key={idx} className="rounded-2xl p-3" style={{ background: '#fff', border: '1px solid #E8E5E3', borderLeft: '3px solid #F59E0B' }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold" style={{ color: '#3D3A39' }}>{r.operatorName}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: '#FEF3C7', color: '#D97706' }}>{r.type}</span>
            </div>
            <span className="text-[10px]" style={{ color: '#B8B4B2' }}>{new Date(r.createdAt).toLocaleString('zh-CN')}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecordsTab() {
  const patrols = getPatrolRecords();
  const reports = getReportRecords();
  const meetings = getMeetingRecords();
  const trainings = getTrainingRecords();
  const all = [
    ...patrols.map(r => ({ ...r, type: '巡店' as const, date: r.date })),
    ...reports.map(r => ({ ...r, type: '通报' as const, date: r.date })),
    ...meetings.map(r => ({ ...r, type: '会议' as const, date: r.date })),
    ...trainings.map(r => ({ ...r, type: '培训' as const, date: r.date })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 50);

  return (
    <div className="space-y-2">
      <p className="text-xs" style={{ color: '#8C8685' }}>最近 {all.length} 条记录</p>
      {all.map((r, idx) => (
        <div key={idx} className="rounded-xl p-2.5 flex items-center justify-between" style={{ background: '#fff', border: '1px solid #E8E5E3' }}>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: '#F5F3F1', color: '#6B6664' }}>{r.type}</span>
            <span className="text-sm font-medium" style={{ color: '#3D3A39' }}>{r.operatorName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: '#8C8685' }}>{r.date}</span>
            {r.gpsAnomaly && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#FEF3C7', color: '#D97706' }}>GPS</span>}
          </div>
        </div>
      ))}
    </div>
  );
}