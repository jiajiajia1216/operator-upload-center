import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useStore } from '../store/useStore'
import Header from './Header'
import TabBar from './TabBar'

export default function AppLayout() {
  const { isLoggedIn, canAccessTab, activeTab } = useStore()
  const location = useLocation()
  
  // 如果未登录，重定向到登录页
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }
  
  // 根据当前路径确定活动标签页
  const currentPath = location.pathname
  let currentTab = activeTab
  
  if (currentPath === '/') currentTab = 'today'
  else if (currentPath === '/monthly') currentTab = 'monthly'
  else if (currentPath === '/ranking') currentTab = 'ranking'
  else if (currentPath === '/actions') currentTab = 'actions'
  else if (currentPath === '/admin') currentTab = 'admin'
  
  // 检查是否有权限访问当前页面
  if (!canAccessTab(currentTab)) {
    return <Navigate to="/" replace />
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 pb-20 overflow-auto">
        <Outlet />
      </main>
      <TabBar />
    </div>
  )
}