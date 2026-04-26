import { useNavigate, useLocation } from 'react-router-dom'
import { useStore } from '../store/useStore'
import type { TabType } from '../types'

interface TabItem {
  key: TabType
  label: string
  path: string
  icon: React.ReactNode
}

const tabs: TabItem[] = [
  {
    key: 'today',
    label: '今日',
    path: '/',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    key: 'monthly',
    label: '月度',
    path: '/monthly',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    key: 'ranking',
    label: '排名',
    path: '/ranking',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  {
    key: 'actions',
    label: '动作',
    path: '/actions',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  {
    key: 'admin',
    label: '管理',
    path: '/admin',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  }
]

export default function TabBar() {
  const { canAccessTab, setActiveTab } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  
  // 根据当前路径确定活动标签
  const currentPath = location.pathname
  let activeKey: TabType = 'today'
  
  if (currentPath === '/') activeKey = 'today'
  else if (currentPath === '/monthly') activeKey = 'monthly'
  else if (currentPath === '/ranking') activeKey = 'ranking'
  else if (currentPath === '/actions') activeKey = 'actions'
  else if (currentPath === '/admin') activeKey = 'admin'
  
  const handleTabClick = (tab: TabItem) => {
    if (canAccessTab(tab.key)) {
      setActiveTab(tab.key)
      navigate(tab.path)
    }
  }
  
  // 过滤出用户有权限访问的标签
  const accessibleTabs = tabs.filter(tab => canAccessTab(tab.key))
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex justify-around items-center h-16">
        {accessibleTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabClick(tab)}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
              activeKey === tab.key
                ? 'text-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className={`${activeKey === tab.key ? 'transform scale-110' : ''}`}>
              {tab.icon}
            </div>
            <span className="text-xs mt-1 font-medium">{tab.label}</span>
            {activeKey === tab.key && (
              <div className="absolute bottom-0 w-8 h-1 bg-purple-600 rounded-t-full" />
            )}
          </button>
        ))}
      </div>
    </nav>
  )
}