import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import TabBar from './TabBar';
import AihuishouLogo from '../AihuishouLogo';

export default function AppLayout() {
  const { user, logout, isAdmin, isManager } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const roleLabel = isAdmin ? '管理员' : isManager ? '运营经理' : '操盘手';

  return (
    <div className="min-h-screen" style={{ background: '#F5F5F5' }}>
      {/* Top Header */}
      <div
        className="px-4 py-3 flex items-center justify-between sticky top-0 z-40"
        style={{ background: '#fff', borderBottom: '1px solid #E8E5E3' }}
      >
        <div className="flex items-center gap-2.5">
          <AihuishouLogo height={30} />
          <div>
            <p className="text-xs" style={{ color: '#8C8685' }}>
              {user.name} · {roleLabel}{user.region ? ` · ${user.region}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#22C55E' }} />
          <button
            onClick={handleLogout}
            className="text-xs transition-colors px-2 py-1 rounded-lg"
            style={{ color: '#8C8685' }}
            onTouchStart={e => (e.currentTarget.style.color = '#EF4444')}
            onTouchEnd={e => (e.currentTarget.style.color = '#8C8685')}
          >
            退出
          </button>
        </div>
      </div>

      {/* Page Content */}
      <main className="pb-20">
        <Outlet />
      </main>

      {/* Bottom Tab Bar */}
      <TabBar />
    </div>
  );
}