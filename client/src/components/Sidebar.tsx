import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import {
  LayoutDashboard,
  Package,
  ClipboardCheck,
  Users,
  MapPin,
  LogOut,
} from 'lucide-react';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? 'bg-senary text-white'
      : 'text-quaternary hover:bg-tertiary hover:text-white'
  }`;

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-primary h-screen flex flex-col border-r border-tertiary">
      <div className="p-6 border-b border-tertiary">
        <h1 className="text-xl font-bold text-white">Asset Manager</h1>
        <p className="text-xs text-quaternary mt-1">{user?.name}</p>
        <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-senary/20 text-septenary capitalize">
          {user?.role}
        </span>
      </div>

      <nav className="flex-1 p-4 flex flex-col gap-1">
        <NavLink to="/" className={linkClass} end>
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>

        <NavLink to="/assets" className={linkClass}>
          <Package size={18} />
          Assets
        </NavLink>

        {(user?.role === 'owner' || user?.role === 'admin') && (
          <NavLink to="/approvals" className={linkClass}>
            <ClipboardCheck size={18} />
            Approvals
          </NavLink>
        )}

        <NavLink to="/locations" className={linkClass}>
          <MapPin size={18} />
          Locations
        </NavLink>

        {user?.role === 'admin' && (
          <NavLink to="/users" className={linkClass}>
            <Users size={18} />
            Users
          </NavLink>
        )}
      </nav>

      <div className="p-4 border-t border-tertiary">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-quaternary hover:bg-tertiary hover:text-white transition-colors w-full"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
