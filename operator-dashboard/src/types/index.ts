// 用户角色类型
export type UserRole = 'operator' | 'manager' | 'admin'

// 用户信息
export interface User {
  id: string
  name: string
  role: UserRole
  region?: string
  city?: string
  storeId?: string
  operatorName?: string // 操盘手姓名
}

// 今日数据指标
export interface TodayMetrics {
  patrolCount: number      // 巡店次数
  reportCount: number      // 通报次数
  meetingCount: number     // 会议次数
  trainingCount: number    // 培训次数
  wechatReply: number      // 企微回复率
  inquiryConversion: number // 询价转化率
  newUsers: number         // 拉新数量
  o2oEfficiency: number    // O2O效率
  unmannedDuration: number // 无人时长
}

// 今日数据
export interface TodayData {
  id: string
  operatorId: string
  operatorName: string
  region: string
  city: string
  date: string
  metrics: TodayMetrics
  score: number
  rank?: number
}

// 月度数据
export interface MonthlyData {
  id: string
  operatorId: string
  operatorName: string
  region: string
  city: string
  month: string
  totalMetrics: TodayMetrics
  avgMetrics: TodayMetrics
  score: number
  rank?: number
}

// 排名数据
export interface RankingData {
  id: string
  operatorId: string
  operatorName: string
  region: string
  city: string
  score: number
  rank: number
  metrics: TodayMetrics
  trend: 'up' | 'down' | 'stable'
}

// 飞书表单类型
export type FormCategory = 'patrol' | 'report' | 'meeting' | 'training'

// 飞书表单
export interface FeishuForm {
  id: string
  name: string
  url: string
  description: string
  category: FormCategory
  icon?: string
}

// 上传的数据源
export interface DataSource {
  id: string
  name: string
  type: 'today' | 'monthly' | 'ranking'
  fileName: string
  uploadTime: string
  recordCount: number
}

// 应用状态
export interface AppState {
  currentUser: User | null
  isLoggedIn: boolean
  todayData: TodayData[]
  monthlyData: MonthlyData[]
  rankingData: RankingData[]
  forms: FeishuForm[]
  dataSources: DataSource[]
  loading: boolean
  error: string | null
}

// 标签页类型
export type TabType = 'today' | 'monthly' | 'ranking' | 'actions' | 'admin'

// 角色权限配置
export interface RolePermissions {
  tabs: TabType[]
  canUpload: boolean
  canManageUsers: boolean
  canViewAll: boolean
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// 文件上传状态
export interface UploadStatus {
  uploading: boolean
  progress: number
  error: string | null
}

// 图表数据点
export interface ChartDataPoint {
  label: string
  value: number
  date?: string
}

// 筛选条件
export interface FilterOptions {
  region?: string
  city?: string
  dateRange?: {
    start: string
    end: string
  }
  keyword?: string
}

// 分页参数
export interface PaginationParams {
  page: number
  pageSize: number
  total: number
}

// 排序参数
export interface SortParams {
  field: string
  order: 'asc' | 'desc'
}