import { useState } from 'react'
import { useStore } from '../store/useStore'

export default function MonthlyData() {
  const { currentUser, monthlyData, loading } = useStore()
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  
  // 检查是否是管理员
  const isAdmin = currentUser?.role === 'admin'
  
  // 模拟数据
  const mockData = monthlyData.length > 0 ? monthlyData : [
    {
      id: '1',
      operatorId: '1',
      operatorName: '操盘手1',
      region: '华东区',
      city: '上海',
      month: selectedMonth,
      totalMetrics: {
        patrolCount: 120,
        reportCount: 45,
        meetingCount: 30,
        trainingCount: 15,
        wechatReply: 92,
        inquiryConversion: 21,
        newUsers: 180,
        o2oEfficiency: 62,
        unmannedDuration: 78
      },
      avgMetrics: {
        patrolCount: 4,
        reportCount: 1.5,
        meetingCount: 1,
        trainingCount: 0.5,
        wechatReply: 92,
        inquiryConversion: 21,
        newUsers: 6,
        o2oEfficiency: 62,
        unmannedDuration: 78
      },
      score: 82,
      rank: 1
    },
    {
      id: '2',
      operatorId: '2',
      operatorName: '操盘手2',
      region: '华南区',
      city: '深圳',
      month: selectedMonth,
      totalMetrics: {
        patrolCount: 100,
        reportCount: 38,
        meetingCount: 25,
        trainingCount: 12,
        wechatReply: 85,
        inquiryConversion: 18,
        newUsers: 150,
        o2oEfficiency: 55,
        unmannedDuration: 85
      },
      avgMetrics: {
        patrolCount: 3.3,
        reportCount: 1.3,
        meetingCount: 0.8,
        trainingCount: 0.4,
        wechatReply: 85,
        inquiryConversion: 18,
        newUsers: 5,
        o2oEfficiency: 55,
        unmannedDuration: 85
      },
      score: 75,
      rank: 2
    }
  ]
  
  // 计算概览数据
  const totalPatrol = mockData.reduce((sum, item) => sum + item.totalMetrics.patrolCount, 0)
  const totalReport = mockData.reduce((sum, item) => sum + item.totalMetrics.reportCount, 0)
  const totalMeeting = mockData.reduce((sum, item) => sum + item.totalMetrics.meetingCount, 0)
  const totalTraining = mockData.reduce((sum, item) => sum + item.totalMetrics.trainingCount, 0)
  const avgScore = Math.round(mockData.reduce((sum, item) => sum + item.score, 0) / mockData.length)
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }
  
  return (
    <div className="p-4 space-y-4">
      {/* 月份选择器 */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">月度数据</h2>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>
      
      {/* 数据概览卡片 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">总巡店</p>
              <p className="text-2xl font-bold">{totalPatrol}</p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">总通报</p>
              <p className="text-2xl font-bold">{totalReport}</p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">总会议</p>
              <p className="text-2xl font-bold">{totalMeeting}</p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">总培训</p>
              <p className="text-2xl font-bold">{totalTraining}</p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* 平均分数 */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">平均分数</p>
            <p className="text-3xl font-bold text-gray-900">{avgScore}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-sm">数据操盘手</p>
            <p className="text-xl font-semibold text-gray-900">{mockData.length}人</p>
          </div>
        </div>
      </div>
      
      {/* 管理员上传按钮 */}
      {isAdmin && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <button className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>上传月度数据</span>
          </button>
        </div>
      )}
      
      {/* 数据表格 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">月度明细</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操盘手</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">区域</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">巡店</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分数</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mockData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-medium text-sm">
                          {item.operatorName.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{item.operatorName}</p>
                        <p className="text-xs text-gray-500">{item.city}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.region}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.totalMetrics.patrolCount}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">{item.score}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}