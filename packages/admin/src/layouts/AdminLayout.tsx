import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Users, Calendar, Award, Swords, LogOut } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/members', icon: Users, label: 'Members' },
  { to: '/classes', icon: Calendar, label: 'Classes' },
  { to: '/badges', icon: Award, label: 'Badges' },
  { to: '/quests', icon: Swords, label: 'Quests' },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-charcoal">
      {/* Sidebar */}
      <aside className="w-64 bg-dark-grey border-r border-white/5 flex flex-col">
        <div className="p-6 border-b border-white/5">
          <h1 className="font-heading text-2xl text-warm-accent tracking-wider">TRAINING GROUNDS</h1>
          <p className="text-xs text-steel mt-1">Admin Dashboard</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-warm-accent/10 text-warm-accent'
                    : 'text-steel hover:text-off-white hover:bg-white/5'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-warm-accent/20 flex items-center justify-center text-warm-accent text-sm font-bold">
              {user?.name?.[0] ?? 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-off-white truncate">{user?.name}</p>
              <p className="text-xs text-steel capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 w-full text-sm text-steel hover:text-red-400 transition-colors rounded-lg hover:bg-white/5"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
