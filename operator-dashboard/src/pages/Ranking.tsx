import { useState } from 'react'
import { useStore } from '../store/useStore'

export default function Ranking() {
  const { currentUser, rankingData, loading } = useStore()
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  
  // 检查是否是管理员
  const isAdmin = currentUser?.role === 'admin'
  
  // 模拟数据
  const mockData = rankingData.length > 0 ? rankingData : [
    {
      id: '1',
      operatorId: '1',
      operatorName: '操盘手1',
      region: '华东区',
      city: '上海',
      score: 92,
      rank: 1,
      metrics: {
        patrolCount: 15,
        reportCount: 8,
        meetingCount: 5,
        trainingCount: 3,
        wechatReply: 98,
        inquiryConversion: 25,
        newUsers: 20,
        o2oEfficiency: 72,
        unmannedDuration: 65
      },
      trend: 'up' as const
    },
    {
      id: '2',
      operatorId: '2',
      operatorName: '操盘手2',
      region: '华南区',
      city: '深圳',
      score: 88,
      rank: 2,
      metrics: {
        patrolCount: 12,
        reportCount: 6,
        meetingCount: 4,
        trainingCount: 2,
        wechatReply: 95,
        inquiryConversion: 22,
        newUsers: 18,
        o2oEfficiency: 68,
        unmannedDuration: 70
      },
      trend: 'stable' as const
    },
    {
      id: '3',
      operatorId: '3',
      operatorName: '操盘手3',
      region: '华北区',
      city: '北京',
      score: 85,
      rank: 3,
      metrics: {
        patrolCount: 10,
        reportCount: 5,
        meetingCount: 3,
        trainingCount: 2,
        wechatReply: 92,
        inquiryConversion: 20,
        newUsers: 15,
        o2oEfficiency: 65,
        unmannedDuration: 75
      },
      trend: 'down' as const
    },
    {
      id: '4',
      operatorId: '4',
      operatorName: '操盘手4',
      region: '华东区',
      city: '杭州',
      score: 82,
      rank: 4,
      metrics: {
        patrolCount: 8,
        reportCount: 4,
        meetingCount: 2,
        trainingCount: 1,
        wechatReply: 88,
        inquiryConversion: 18,
        newUsers: 12,
        o2oEfficiency: 60,
        unmannedDuration: 80
      },
      trend: 'up' as const
    },
    {
      id: '5',
      operatorId: '5',
      operatorName: '操盘手5',
      region: '华南区',
      city: '广州',
      score: 78,
      rank: 5,
      metrics: {
        patrolCount: 6,
        reportCount: 3,
        meetingCount: 2,
        trainingCount: 1,
        wechatReply: 85,
        inquiryConversion: 16,
        newUsers: 10,
        o2oEfficiency: 55,
        unmannedDuration: 85
      },
      trend: 'stable' as const
    }
  ]
  
  // 筛选数据
  const filteredData = selectedRegion === 'all' 
    ? mockData 
    : mockData.filter(item => item.region === selectedRegion)
  
  // 获取所有区域
  const regions = ['all', ...new Set(mockData.map(item => item.region))]
  
  // 趋势图标
  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    if (trend === 'up') {
      return (
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      )
    } else if (trend === 'down') {
      return (
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      )
    } else {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
        </svg>
      )
    }
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
      {/* 筛选器 */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">排名看板</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-500 mb-1">区域筛选</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">全部区域</option>
              {regions.filter(r => r !== 'all').map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">时间范围</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="week">本周</option>
              <option value="month">本月</option>
              <option value="quarter">本季度</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* 前三名展示 */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-4 text-white">
        <h3 className="text-lg font-semibold mb-4">TOP 3</h3>
        <div className="flex justify-around items-end">
          {filteredData.slice(0, 3).map((item, index) => (
            <div key={item.id} className="text-center">
              <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                index === 0 ? 'bg-yellow-400' :
                index === 1 ? 'bg-gray-300' :
                'bg-orange-400'
              }`}>
                <span className={`text-lg font-bold ${
                  index === 0 ? 'text-yellow-800' :
                  index === 1 ? 'text-gray-600' :
                  'text-orange-800'
                }`}>
                  {item.operatorName.charAt(0)}
                </span>
              </div>
              <p className="text-sm font-medium">{item.operatorName}</p>
              <p className="text-2xl font-bold">{item.score}</p>
              <p className="text-xs opacity-80">{item.region}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* 排名列表 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">完整排名</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredData.map((item) => (
            <div key={item.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    item.rank === 1 ? 'bg-yellow-100' :
                    item.rank === 2 ? 'bg-gray-100' :
                    item.rank === 3 ? 'bg-orange-100' :
                    'bg-gray-50'
                  }`}>
                    <span className={`text-sm font-bold ${
                      item.rank === 1 ? 'text-yellow-600' :
                      item.rank === 2 ? 'text-gray-600' :
                      item.rank === 3 ? 'text-orange-600' :
                      'text-gray-500'
                    }`}>
                      {item.rank}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.operatorName}</p>
                    <p className="text-xs text-gray-500">{item.region} · {item.city}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{item.score}</p>
                    <p className="text-xs text-gray-500">分数</p>
                  </div>
                  <TrendIcon trend={item.trend} />
                </div>
              </div>
              
              {/* 详细指标 */}
              <div className="mt-3 grid grid-cols-4 gap-2">
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">巡店</p>
                  <p className="text-sm font-semibold">{item.metrics.patrolCount}</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">通报</p>
                  <p className="text-sm font-semibold">{item.metrics.reportCount}</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">企微</p>
                  <p className="text-sm font-semibold">{item.metrics.wechatReply}%</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">拉新</p>
                  <p className="text-sm font-semibold">{item.metrics.newUsers}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 管理员上传按钮 */}
      {isAdmin && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <button className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>上传排名数据</span>
          </button>
        </div>
      )}
    </div>
  )
}