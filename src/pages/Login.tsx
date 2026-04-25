import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { generateFingerprint, addLoginRecord } from '../utils/device';
import {
  checkDeviceStatus, bindDevice, submitDeviceApproval,
  operatorHasBinding, getFriendlyDeviceInfo,
} from '../utils/storage';
import AihuishouLogo from '../components/AihuishouLogo';

export default function Login() {
  const { user, operators, loading, loginWithStores } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [nameInput, setNameInput] = useState('');
  const [matchedOperators, setMatchedOperators] = useState<typeof operators>([]);
  const [selectedOperator, setSelectedOperator] = useState<typeof operators[0] | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<string>('');
  const [deviceStatus, setDeviceStatus] = useState<'bound' | 'pending' | 'new' | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const fingerprint = useMemo(() => generateFingerprint(), []);

  useEffect(() => {
    const friendly = getFriendlyDeviceInfo(fingerprint.userAgent, fingerprint.platform);
    setDeviceInfo(friendly);
  }, [fingerprint]);

  if (user) {
    return <Navigate to="/ranking" replace />;
  }

  const handleNameInput = (value: string) => {
    setNameInput(value);
    setShowDropdown(true);
    if (value.trim()) {
      const keyword = value.trim().toLowerCase();
      const matches = operators.filter((op) => op.name.toLowerCase().includes(keyword));
      setMatchedOperators(matches.slice(0, 10));
    } else {
      setMatchedOperators([]);
    }
    setSelectedOperator(null);
    setDeviceStatus(null);
  };

  const selectOperator = (op: typeof operators[0]) => {
    setNameInput(op.name);
    setSelectedOperator(op);
    setShowDropdown(false);
    const status = checkDeviceStatus(op.id, fingerprint.id);
    if (status === 'new' && !operatorHasBinding(op.id)) {
      setDeviceStatus('bound');
    } else {
      setDeviceStatus(status);
    }
  };

  const handleLogin = async () => {
    if (!selectedOperator) {
      showToast('请选择正确的姓名', 'error');
      return;
    }

    const fp = fingerprint;
    const friendly = getFriendlyDeviceInfo(fp.userAgent, fp.platform);
    const status = checkDeviceStatus(selectedOperator.id, fp.id);

    // 设备检查
    if (status === 'pending') {
      showToast('您的设备正在等待管理员审批，请耐心等待', 'warning');
      setDeviceStatus('pending');
      return;
    }

    if (status === 'new' && operatorHasBinding(selectedOperator.id)) {
      submitDeviceApproval(selectedOperator.id, selectedOperator.name, fp.id, friendly);
      showToast('新设备登录，请等待管理员审批', 'warning');
      setDeviceStatus('pending');
      return;
    }

    // 首次登录自动绑定设备
    if (status === 'bound' || (status === 'new' && !operatorHasBinding(selectedOperator.id))) {
      bindDevice(selectedOperator.id, selectedOperator.name, fp.id, friendly);
    }

    addLoginRecord({
      operatorId: selectedOperator.id,
      operatorName: selectedOperator.name,
      deviceFingerprint: fp.id,
      timestamp: new Date().toISOString(),
      flagged: false,
    });

    setLoggingIn(true);
    try {
      await loginWithStores(selectedOperator);
      showToast(`欢迎，${selectedOperator.name}`, 'success');
      if (selectedOperator.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/ranking', { replace: true });
      }
    } catch (e) {
      showToast('登录失败，请重试', 'error');
      setLoggingIn(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && selectedOperator) {
      handleLogin();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'linear-gradient(135deg, #F9E72C 0%, #FDF0A0 50%, #F9E72C 100%)' }}>
        <AihuishouLogo height={48} className="mx-auto mb-4 animate-pulse" />
        <p className="text-sm" style={{ color: '#8C8685' }}>加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 safe-top safe-bottom" style={{ background: 'linear-gradient(135deg, #F9E72C 0%, #FDF0A0 50%, #F9E72C 100%)' }}>
      <div className="mb-6 text-center">
        <AihuishouLogo height={48} className="mx-auto mb-3" />
        <h1 className="text-xl font-bold" style={{ color: '#3D3A39' }}>加盟回收运营</h1>
        <p className="text-sm mt-1" style={{ color: '#8C8685' }}>排名看板 / 今日数据 / 巡店管理</p>
      </div>

      <div className="w-full max-w-sm rounded-2xl shadow-lg p-6" style={{ background: '#fff' }}>
        <div className="mb-4 relative">
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#3D3A39' }}>输入姓名</label>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => handleNameInput(e.target.value)}
            onFocus={() => nameInput.trim() && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            placeholder="请输入您的姓名"
            className="w-full px-4 py-3 border rounded-xl text-sm transition-all"
            style={{ background: '#F9F9F9', borderColor: '#E8E5E3', color: '#3D3A39' }}
          />
          {showDropdown && matchedOperators.length > 0 && (
            <div className="absolute z-30 w-full mt-1 border rounded-xl shadow-lg max-h-48 overflow-y-auto" style={{ background: '#fff', borderColor: '#E8E5E3' }}>
              {matchedOperators.map((op) => (
                <button
                  key={op.id}
                  onMouseDown={() => selectOperator(op)}
                  className="w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between"
                  style={{
                    color: selectedOperator?.id === op.id ? '#D4C524' : '#3D3A39',
                    background: selectedOperator?.id === op.id ? '#FDF8D8' : 'transparent',
                    fontWeight: selectedOperator?.id === op.id ? 600 : 400,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span>{op.name}</span>
                    {op.role === 'admin' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: '#FEE2E2', color: '#DC2626' }}>管理员</span>
                    )}
                    {op.role === 'manager' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: '#FDF8D8', color: '#D4C524' }}>运营经理</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
          {nameInput.trim() && matchedOperators.length === 0 && !selectedOperator && (
            <div className="absolute z-30 w-full mt-1 border rounded-xl shadow-lg p-3" style={{ background: '#fff', borderColor: '#E8E5E3' }}>
              <p className="text-xs text-center" style={{ color: '#8C8685' }}>未找到匹配的用户</p>
            </div>
          )}
        </div>

        {selectedOperator && deviceStatus && (
          <div className="mb-4 p-3 rounded-xl border" style={deviceStatus === 'bound'
            ? { background: '#F0FDF4', borderColor: '#BBF7D0' }
            : { background: '#FFFBEB', borderColor: '#FDE68A' }
          }>
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke={deviceStatus === 'bound' ? '#22C55E' : '#F59E0B'} viewBox="0 0 24 24" strokeWidth={2}>
                {deviceStatus === 'bound'
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  : <><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></>
                }
              </svg>
              <div>
                {deviceStatus === 'bound' ? (
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#166534' }}>设备已确认</p>
                    <p className="text-xs mt-0.5" style={{ color: '#4ade80' }}>{deviceInfo}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#92400E' }}>新设备，需管理员审批</p>
                    <p className="text-xs mt-0.5" style={{ color: '#B45309' }}>点击登录后提交审批请求</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={!selectedOperator || loggingIn}
          className="w-full py-3 font-semibold rounded-xl transition-all shadow-sm"
          style={selectedOperator && !loggingIn
            ? { background: '#F9E72C', color: '#3D3A39', boxShadow: '0 2px 12px rgba(249,231,44,0.4)' }
            : { background: '#E8E5E3', color: '#8C8685', cursor: 'not-allowed' }
          }
        >
          {loggingIn ? '登录中...' : (selectedOperator && deviceStatus === 'pending' ? '等待管理员审批' : '登录')}
        </button>

        <div className="mt-4 flex items-center justify-center">
          <p className="text-xs" style={{ color: '#8C8685' }}>{deviceInfo}</p>
        </div>
      </div>

      <p className="text-xs mt-6" style={{ color: '#D4C524' }}>v{new Date().toISOString().slice(0, 10).replace(/-/g, '')}</p>
    </div>
  );
}