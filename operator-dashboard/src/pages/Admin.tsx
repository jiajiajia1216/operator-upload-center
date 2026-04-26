import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'

export default function Admin() {
  const { currentUser, dataSources, addDataSource, removeDataSource, loading } = useStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'upload' | 'users' | 'permissions'>('upload')
  const [uploading, setUploading] = useState(false)
  
  // 检查权限
  const isAdmin = currentUser?.role === 'admin'
  
  if (!isAdmin) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-semibold text-red-800">权限不足</h3>
          <p className="text-red-600 mt-2">您没有访问管理后台的权限</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }
  
  // 模拟用户数据
  const mockUsers = [
    { id: '1', name: '管理员', role: 'admin', status: 'active' },
    { id: '2', name: '运营经理1', role: 'manager', region: '华东区', status: 'active' },
    { id: '3', name: '操盘手1', role: 'operator', region: '华东区', city: '上海', status: 'active' },
    { id: '4', name: '操盘手2', role: 'operator', region: '华南区', city: '深圳', status: 'active' }
  ]
  
  // 处理文件上传
  const handleFileUpload = async (type: 'today' | 'monthly' | 'ranking') => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.xlsx,.xls,.csv'
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      
      setUploading(true)
      
      try {
        // 模拟上传过程
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // 添加数据源记录
        addDataSource({
          id: Date.now().toString(),
          name: `${type === 'today' ? '今日' : type === 'monthly' ? '月度' : '排名'}数据`,
          type,
          fileName: file.name,
          uploadTime: new Date().toISOString(),
          recordCount: Math.floor(Math.random() * 50) + 10
        })
        
        alert('上传成功！数据已更新。')
      } catch (error) {
        alert('上传失败，请重试。')
      } finally {
        setUploading(false)
      }
    }
    
    input.click()
  }
  
  // 处理删除数据源
  const handleDeleteSource = (id: string) => {
    if (confirm('确定要删除此数据源吗？')) {
      removeDataSource(id)
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
      {/* 管理标题 */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">管理后台</h2>
        <p className="text-sm text-gray-500 mt-1">数据上传、用户管理、权限控制</p>
      </div>
      
      {/* 管理标签页 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200">
          {[
            { key: 'upload', label: '数据上传', icon: 'upload' },
            { key: 'users', label: '用户管理', icon: 'users' },
            { key: 'permissions', label: '权限控制', icon: 'permissions' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="p-4">
          {/* 数据上传 */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <h3 className="text-md font-semibold text-gray-900">上传数据源</h3>
              <p className="text-sm text-gray-500">支持Excel(.xlsx/.xls)和CSV格式</p>
              
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => handleFileUpload('today')}
                  disabled={uploading}
                  className="w-full py-4 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>上传今日数据</span>
                </button>
                
                <button
                  onClick={() => handleFileUpload('monthly')}
                  disabled={uploading}
                  className="w-full py-4 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>上传月度数据</span>
                </button>
                
                <button
                  onClick={() => handleFileUpload('ranking')}
                  disabled={uploading}
                  className="w-full py-4 px-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>上传排名数据</span>
                </button>
              </div>
              
              {/* 上传状态 */}
              {uploading && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mr-2"></div>
                  <span className="text-sm text-gray-600">上传中...</span>
                </div>
              )}
              
              {/* 已上传的数据源 */}
              {dataSources.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">已上传的数据源</h4>
                  <div className="space-y-2">
                    {dataSources.map(source => (
                      <div key={source.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{source.name}</p>
                          <p className="text-xs text-gray-500">{source.fileName} · {source.recordCount}条记录</p>
                        </div>
                        <button
                          onClick={() => handleDeleteSource(source.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* 用户管理 */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-semibold text-gray-900">用户列表</h3>
                <button className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors">
                  添加用户
                </button>
              </div>
              
              <div className="divide-y divide-gray-200">
                {mockUsers.map(user => (
                  <div key={user.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-600' :
                        user.role === 'manager' ? 'bg-green-100 text-green-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        <span className="text-sm font-medium">
                          {user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">
                          {user.role === 'admin' ? '管理员' :
                           user.role === 'manager' ? '运营经理' : '操盘手'}
                          {user.region && ` · ${user.region}`}
                          {user.city && ` · ${user.city}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.status === 'active' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {user.status === 'active' ? '启用' : '禁用'}
                      </span>
                      <button className="text-gray-400 hover:text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* 权限控制 */}
          {activeTab === 'permissions' && (
            <div className="space-y-4">
              <h3 className="text-md font-semibold text-gray-900">角色权限配置</h3>
              
              <div className="space-y-3">
                {[
                  { role: 'admin', label: '管理员', permissions: ['所有权限', '数据上传', '用户管理', '权限控制'] },
                  { role: 'manager', label: '运营经理', permissions: ['查看今日数据', '查看月度数据', '查看排名'] },
                  { role: 'operator', label: '操盘手', permissions: ['查看今日数据', '查看月度数据', '查看排名', '使用动作中心'] }
                ].map(role => (
                  <div key={role.role} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{role.label}</span>
                      <button className="text-purple-600 text-sm hover:text-purple-700">编辑</button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.map(perm => (
                        <span key={perm} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}