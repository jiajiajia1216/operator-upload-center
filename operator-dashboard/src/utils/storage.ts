import type { TodayData, MonthlyData, RankingData, User } from '../types'

// 存储键名
const STORAGE_KEYS = {
  TODAY_DATA: 'operator_today_data',
  MONTHLY_DATA: 'operator_monthly_data',
  RANKING_DATA: 'operator_ranking_data',
  USERS: 'operator_users',
  CURRENT_USER: 'operator_current_user'
}

// 通用存储函数
function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Error saving to localStorage: ${key}`, error)
  }
}

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Error reading from localStorage: ${key}`, error)
    return defaultValue
  }
}

// 今日数据存储
export function saveTodayData(data: TodayData[]): void {
  setItem(STORAGE_KEYS.TODAY_DATA, data)
}

export function loadTodayData(): TodayData[] {
  return getItem<TodayData[]>(STORAGE_KEYS.TODAY_DATA, [])
}

// 月度数据存储
export function saveMonthlyData(data: MonthlyData[]): void {
  setItem(STORAGE_KEYS.MONTHLY_DATA, data)
}

export function loadMonthlyData(): MonthlyData[] {
  return getItem<MonthlyData[]>(STORAGE_KEYS.MONTHLY_DATA, [])
}

// 排名数据存储
export function saveRankingData(data: RankingData[]): void {
  setItem(STORAGE_KEYS.RANKING_DATA, data)
}

export function loadRankingData(): RankingData[] {
  return getItem<RankingData[]>(STORAGE_KEYS.RANKING_DATA, [])
}

// 用户数据存储
export function saveUsers(users: User[]): void {
  setItem(STORAGE_KEYS.USERS, users)
}

export function loadUsers(): User[] {
  return getItem<User[]>(STORAGE_KEYS.USERS, [
    { id: '1', name: '管理员', role: 'admin' },
    { id: '2', name: '运营经理', role: 'manager', region: '华东区' },
    { id: '3', name: '操盘手1', role: 'operator', region: '华东区', city: '上海' },
    { id: '4', name: '操盘手2', role: 'operator', region: '华南区', city: '深圳' }
  ])
}

// 当前用户存储
export function saveCurrentUser(user: User | null): void {
  if (user) {
    setItem(STORAGE_KEYS.CURRENT_USER, user)
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
  }
}

export function loadCurrentUser(): User | null {
  return getItem<User | null>(STORAGE_KEYS.CURRENT_USER, null)
}

// 清除所有数据
export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key)
  })
}

// 解析Excel/CSV文件
export async function parseDataFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (file.name.endsWith('.csv')) {
          // 解析CSV
          const text = data as string
          const lines = text.split('\n').filter(line => line.trim())
          if (lines.length < 2) {
            resolve([])
            return
          }
          
          const headers = lines[0].split(',').map(h => h.trim())
          const rows = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim())
            const obj: any = {}
            headers.forEach((header, index) => {
              obj[header] = values[index] || ''
            })
            return obj
          })
          resolve(rows)
        } else {
          // Excel文件需要xlsx库处理
          reject(new Error('Excel文件解析需要xlsx库支持'))
        }
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => reject(new Error('文件读取失败'))
    
    if (file.name.endsWith('.csv')) {
      reader.readAsText(file)
    } else {
      reader.readAsArrayBuffer(file)
    }
  })
}

// 生成唯一ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 格式化日期
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().split('T')[0]
}

// 格式化月份
export function formatMonth(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// 计算分数
export function calculateScore(metrics: any, weights: Record<string, number>): number {
  let totalScore = 0
  let totalWeight = 0
  
  Object.entries(weights).forEach(([key, weight]) => {
    if (metrics[key] !== undefined) {
      totalScore += metrics[key] * weight
      totalWeight += weight
    }
  })
  
  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0
}

// 排序函数
export function sortByField<T>(data: T[], field: keyof T, order: 'asc' | 'desc' = 'desc'): T[] {
  return [...data].sort((a, b) => {
    const aVal = a[field]
    const bVal = b[field]
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return order === 'asc' ? aVal - bVal : bVal - aVal
    }
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return order === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }
    
    return 0
  })
}

// 筛选函数
export function filterByField<T>(data: T[], field: keyof T, value: any): T[] {
  return data.filter(item => item[field] === value)
}

// 分页函数
export function paginate<T>(data: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize
  return data.slice(start, start + pageSize)
}