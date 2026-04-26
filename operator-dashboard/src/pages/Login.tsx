import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { loadUsers } from '../utils/storage'
import type { User, UserRole } from '../types'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState<UserRole>('operator')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { login } = useStore()
  const navigate = useNavigate()
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      // 模拟登录验证
      const users = loadUsers()
      const user = users.find(u => 
        u.name === username && u.role === selectedRole
      )
      
      if (user || (username && password)) {
        // 登录成功
        const loginUser: User = user || {
          id: Date.now().toString(),
          name: username,
          role: selectedRole,
          region: '默认区域',
          city: '默认城市'
        }
        
        login(loginUser)
        navigate('/')
      } else {
        setError('用户名或密码错误')
      }
    } catch (err) {
      setError('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }
  
  // 快速登录（演示用）
  const handleQuickLogin = (role: UserRole) => {
    const users = loadUsers()
    const user = users.find(u => u.role === role)
    if (user) {
      login(user)
      navigate('/')
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">数据看板</h1>
            <p className="text-gray-500 mt-2">操盘手管理系统</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="请输入用户名"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="请输入密码"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                角色选择
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'operator', label: '操盘手' },
                  { value: 'manager', label: '运营经理' },
                  { value: 'admin', label: '管理员' }
                ].map(role => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setSelectedRole(role.value as UserRole)}
                    className={`py-2 px-4 rounded-lg border-2 transition-all ${
                      selectedRole === role.value
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>
            
            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 focus:ring-4 focus:ring-purple-200 transition-all disabled:opacity-50"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center mb-4">快速登录（演示）</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleQuickLogin('operator')}
                className="py-2 px-3 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                操盘手
              </button>
              <button
                onClick={() => handleQuickLogin('manager')}
                className="py-2 px-3 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
              >
                运营经理
              </button>
              <button
                onClick={() => handleQuickLogin('admin')}
                className="py-2 px-3 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
              >
                管理员
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}