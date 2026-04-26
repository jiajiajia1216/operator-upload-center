import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  User,
  TodayData,
  MonthlyData,
  RankingData,
  FeishuForm,
  DataSource,
  TabType,
  RolePermissions
} from '../types'

// 角色权限配置
const rolePermissions: Record<User['role'], RolePermissions> = {
  operator: {
    tabs: ['today', 'monthly', 'ranking', 'actions'],
    canUpload: false,
    canManageUsers: false,
    canViewAll: false
  },
  manager: {
    tabs: ['today', 'monthly', 'ranking'],
    canUpload: false,
    canManageUsers: false,
    canViewAll: false
  },
  admin: {
    tabs: ['today', 'monthly', 'ranking', 'actions', 'admin'],
    canUpload: true,
    canManageUsers: true,
    canViewAll: true
  }
}

// 默认飞书表单
const defaultForms: FeishuForm[] = [
  {
    id: '1',
    name: '巡店记录',
    url: 'https://.feishu.cn/form/patrol',
    description: '提交巡店检查记录',
    category: 'patrol',
    icon: 'store'
  },
  {
    id: '2',
    name: '数据通报',
    url: 'https://feishu.cn/form/report',
    description: '提交数据通报',
    category: 'report',
    icon: 'chart'
  },
  {
    id: '3',
    name: '会议记录',
    url: 'https://feishu.cn/form/meeting',
    description: '提交会议记录',
    category: 'meeting',
    icon: 'meeting'
  },
  {
    id: '4',
    name: '培训记录',
    url: 'https://feishu.cn/form/training',
    description: '提交培训记录',
    category: 'training',
    icon: 'training'
  }
]

interface StoreState {
  // 用户状态
  currentUser: User | null
  isLoggedIn: boolean
  
  // 数据状态
  todayData: TodayData[]
  monthlyData: MonthlyData[]
  rankingData: RankingData[]
  forms: FeishuForm[]
  dataSources: DataSource[]
  
  // UI状态
  activeTab: TabType
  loading: boolean
  error: string | null
  
  // 用户操作
  login: (user: User) => void
  logout: () => void
  
  // 数据操作
  setTodayData: (data: TodayData[]) => void
  setMonthlyData: (data: MonthlyData[]) => void
  setRankingData: (data: RankingData[]) => void
  setForms: (forms: FeishuForm[]) => void
  addDataSource: (source: DataSource) => void
  removeDataSource: (id: string) => void
  
  // UI操作
  setActiveTab: (tab: TabType) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // 权限检查
  getPermissions: () => RolePermissions
  canAccessTab: (tab: TabType) => boolean
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // 初始状态
      currentUser: null,
      isLoggedIn: false,
      todayData: [],
      monthlyData: [],
      rankingData: [],
      forms: defaultForms,
      dataSources: [],
      activeTab: 'today',
      loading: false,
      error: null,
      
      // 用户操作
      login: (user) => set({
        currentUser: user,
        isLoggedIn: true,
        error: null
      }),
      
      logout: () => set({
        currentUser: null,
        isLoggedIn: false,
        activeTab: 'today'
      }),
      
      // 数据操作
      setTodayData: (data) => set({ todayData: data }),
      setMonthlyData: (data) => set({ monthlyData: data }),
      setRankingData: (data) => set({ rankingData: data }),
      setForms: (forms) => set({ forms }),
      
      addDataSource: (source) => set((state) => ({
        dataSources: [...state.dataSources, source]
      })),
      
      removeDataSource: (id) => set((state) => ({
        dataSources: state.dataSources.filter(s => s.id !== id)
      })),
      
      // UI操作
      setActiveTab: (tab) => set({ activeTab: tab }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      
      // 权限检查
      getPermissions: () => {
        const { currentUser } = get()
        if (!currentUser) {
          return {
            tabs: [],
            canUpload: false,
            canManageUsers: false,
            canViewAll: false
          }
        }
        return rolePermissions[currentUser.role]
      },
      
      canAccessTab: (tab) => {
        const permissions = get().getPermissions()
        return permissions.tabs.includes(tab)
      }
    }),
    {
      name: 'operator-dashboard-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isLoggedIn: state.isLoggedIn,
        todayData: state.todayData,
        monthlyData: state.monthlyData,
        rankingData: state.rankingData,
        forms: state.forms,
        dataSources: state.dataSources,
        activeTab: state.activeTab
      })
    }
  )
)

// 导出权限配置
export { rolePermissions }