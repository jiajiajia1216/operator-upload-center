import { useAuth } from '../context/AuthContext';

export default function MonthlyData() {
  const { isAdmin, isManager } = useAuth();

  if (!isAdmin && !isManager) {
    return (
      <div className="px-3 py-4 flex items-center justify-center">
        <p style={{ color: '#8C8685' }}>暂无权限查看</p>
      </div>
    );
  }

  return (
    <div className="px-3 pt-3 pb-4">
      <h1 className="text-lg font-bold mb-3" style={{ color: '#3D3A39' }}>月度数据</h1>
      <div className="rounded-2xl p-8 text-center" style={{ background: '#fff', border: '1px solid #E8E5E3' }}>
        <div className="text-4xl mb-3 opacity-15">&#128200;</div>
        <p className="text-sm font-medium mb-1" style={{ color: '#8C8685' }}>月度数据模块</p>
        <p className="text-xs" style={{ color: '#B8B4B2' }}>该功能正在开发中，敬请期待</p>
      </div>
    </div>
  );
}