import { useState } from 'react'
import { useStore } from '../store/useStore'
import type { FormCategory } from '../types'

export default function Actions() {
  const { forms, loading } = useStore()
  const [selectedCategory, setSelectedCategory] = useState<FormCategory | 'all'>('all')
  
  // 表单分类配置
  const categories: { key: FormCategory | 'all'; label: string; icon: React.ReactNode }[] = [
    {
      key: 'all',
      label: '全部',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      )
    },
    {
      key: 'patrol',
      label: '巡店',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      key: 'report',
      label: '通报',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      key: 'meeting',
      label: '会议',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      key: 'training',
      label: '培训',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    }
  ]
  
  // 筛选表单
  const filteredForms = selectedCategory === 'all' 
    ? forms 
    : forms.filter(form => form.category === selectedCategory)
  
    // 分类图标背景
  const categoryBgColors: Record<FormCategory, string> = {
    patrol: 'bg-blue-100 text-blue-600',
    report: 'bg-green-100 text-green-600',
    meeting: 'bg-purple-100 text-purple-600',
    training: 'bg-orange-100 text-orange-600'
  }
  
  // 处理表单点击
  const handleFormClick = (url: string) => {
    window.open(url, '_blank')
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }
  
  return (
    <div className="p-4 space-y-4">
      {/* 分类筛选 */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">动作中心</h2>
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {categories.map(category => (
            <button
              key={category.key}
              onClick={() => setSelectedCategory(category.key)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                selectedCategory === category.key
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category.icon}
              <span className="text-sm font-medium">{category.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* 表单卡片列表 */}
      <div className="space-y-3">
        {filteredForms.map(form => (
          <div
            key={form.id}
            onClick={() => handleFormClick(form.url)}
            className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-98"
          >
            <div className="flex items-start space-x-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${categoryBgColors[form.category]}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{form.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{form.description}</p>
                <div className="flex items-center mt-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryBgColors[form.category]}`}>
                    {categories.find(c => c.key === form.category)?.label}
                  </span>
                </div>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* 最近提交记录 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">最近提交</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {[
            { id: '1', name: '巡店记录', time: '10分钟前', status: 'success' },
            { id: '2', name: '数据通报', time: '1小时前', status: 'success' },
            { id: '3', name: '会议记录', time: '2小时前', status: 'pending' }
          ].map(record => (
            <div key={record.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  record.status === 'success' ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
                <div>
                  <p className="text-sm font-medium text-gray-900">{record.name}</p>
                  <p className="text-xs text-gray-500">{record.time}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                record.status === 'success' 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-yellow-100 text-yellow-600'
              }`}>
                {record.status === 'success' ? '已提交' : '待审核'}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* 快捷操作提示 */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">快捷操作</p>
            <p className="text-xs text-gray-500 mt-1">点击表单卡片即可跳转到飞书表单进行填写和提交</p>
          </div>
        </div>
      </div>
    </div>
  )
}