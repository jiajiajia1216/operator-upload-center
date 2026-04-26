import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import TodayData from './pages/TodayData'
import MonthlyData from './pages/MonthlyData'
import Ranking from './pages/Ranking'
import Actions from './pages/Actions'
import Admin from './pages/Admin'
import Login from './pages/Login'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<AppLayout />}>
          <Route index element={<TodayData />} />
          <Route path="monthly" element={<MonthlyData />} />
          <Route path="ranking" element={<Ranking />} />
          <Route path="actions" element={<Actions />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App