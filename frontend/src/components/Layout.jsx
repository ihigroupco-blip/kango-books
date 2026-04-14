import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ArrowLeftRight,
  FileText,
  BarChart3,
  LogOut,
  Menu,
  Users,
  Target,
  CalendarDays,
  Car,
} from 'lucide-react';
import { useState } from 'react';
import logoHorizontal from '../assets/logo-horizontal.png';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/invoices', label: 'Invoices', icon: FileText },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/logbook', label: 'FBT Logbook', icon: Car },
  { to: '/leads', label: 'Leads', icon: Target },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-4 py-5 border-b border-gray-200">
          <img src={logoHorizontal} alt="Kango" className="w-full object-contain" />
          <p className="text-xs text-gray-400 mt-2 truncate">{user?.businessName || user?.name}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-kango-navy/10 text-kango-navy'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon size={20} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 w-full"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] flex items-center gap-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
            <Menu size={24} />
          </button>
          <img src={logoHorizontal} alt="Kango" className="h-12 object-contain" />
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
