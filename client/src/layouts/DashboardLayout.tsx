import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { logout } from '@/redux/slices/authSlice';
import { Home, TrendingUp, BookOpen, Users, Settings, LogOut, BarChart3, Menu, X, Activity, Trophy } from 'lucide-react';

export default function DashboardLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const getNavItems = () => {
    if (user?.role === 'admin') {
      return [
        { to: '/admin', icon: <Home size={20} />, label: 'Dashboard' },
        { to: '/admin/users', icon: <Users size={20} />, label: 'Users' },
        { to: '/admin/courses', icon: <BookOpen size={20} />, label: 'Courses' },
        { to: '/admin/payments', icon: <BarChart3 size={20} />, label: 'Payments' },
      ];
    }

    if (user?.role === 'analyst') {
      return [
        { to: '/analyst', icon: <Home size={20} />, label: 'Dashboard' },
        { to: '/analyst/signals', icon: <TrendingUp size={20} />, label: 'My Signals' },
        { to: '/analyst/signals/create', icon: <TrendingUp size={20} />, label: 'Create Signal' },
        { to: '/analyst/bookings', icon: <Users size={20} />, label: 'Mentorship Bookings' },
      ];
    }

    return [
      { to: '/dashboard', icon: <Home size={20} />, label: 'Dashboard' },
      { to: '/dashboard/signals', icon: <TrendingUp size={20} />, label: 'Signals' },
      { to: '/dashboard/simulator', icon: <Activity size={20} />, label: 'Simulator' },
      { to: '/dashboard/performance', icon: <Trophy size={20} />, label: 'Performance' },
      { to: '/dashboard/courses', icon: <BookOpen size={20} />, label: 'Courses' },
      { to: '/dashboard/mentorship', icon: <Users size={20} />, label: 'Mentorship' },
      { to: '/dashboard/settings', icon: <Settings size={20} />, label: 'Settings' },
    ];
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-dark-navy text-white z-40 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary">VTfx</h1>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-primary/20 rounded-lg transition"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-dark-navy text-white transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">VTfx</h1>
              <p className="text-sm text-gray-400 mt-1">{user?.role?.toUpperCase()}</p>
            </div>
            <button
              onClick={closeSidebar}
              className="lg:hidden p-2 hover:bg-primary/20 rounded-lg transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <nav className="mt-6">
          {getNavItems().map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={closeSidebar}
              className="flex items-center gap-3 px-6 py-3 hover:bg-primary/20 transition"
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
          <button
            onClick={() => {
              handleLogout();
              closeSidebar();
            }}
            className="flex items-center gap-3 px-6 py-3 hover:bg-red-500/20 transition w-full text-left"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-16 lg:pt-0 p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
