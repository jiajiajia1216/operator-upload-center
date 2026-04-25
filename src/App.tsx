import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Patrol from './pages/Patrol';
import Report from './pages/Report';
import Meeting from './pages/Meeting';
import Training from './pages/Training';
import Records from './pages/Records';
import Ranking from './pages/Ranking';
import TodayData from './pages/TodayData';
import MonthlyData from './pages/MonthlyData';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            {/* Admin路由：Admin组件内部自己判断isAdmin，非管理员重定向到/ */}
            <Route path="/admin" element={<Admin />} />
            <Route element={<AppLayout />}>
              {/* 操盘手页面 */}
              <Route path="/patrol" element={<Patrol />} />
              <Route path="/report" element={<Report />} />
              <Route path="/meeting" element={<Meeting />} />
              <Route path="/training" element={<Training />} />
              <Route path="/records" element={<Records />} />
              {/* 排名看板 & 数据页面 */}
              <Route path="/ranking" element={<Ranking />} />
              <Route path="/today" element={<TodayData />} />
              <Route path="/monthly" element={<MonthlyData />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
