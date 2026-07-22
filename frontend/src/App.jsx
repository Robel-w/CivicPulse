import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MapPage from './pages/MapPage';
import ReportIssue from './pages/ReportIssue';
import NotificationsPage from './pages/NotificationsPage';
import IssueDetail from './pages/IssueDetail';
import Profile from './pages/Profile';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/report" element={<ReportIssue />} />
          <Route path="/admin/notifications" element={<NotificationsPage />} />
          <Route path="/issue/:id" element={<IssueDetail />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
