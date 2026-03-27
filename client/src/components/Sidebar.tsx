import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import {
  LayoutDashboard,
  Package,
  ClipboardCheck,
  Users,
  MapPin,
  LogOut,
  X,
} from 'lucide-react';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? 'bg-senary text-white'
      : 'text-quaternary hover:bg-tertiary hover:text-white'
  }`;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-primary flex flex-col border-r border-tertiary
        transition-transform duration-300 ease-in-out
        lg:static lg:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <div className="p-6 border-b border-tertiary flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Asset Manager</h1>
          <p className="text-xs text-quaternary mt-1">{user?.name}</p>
          <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-senary/20 text-septenary capitalize">
            {user?.role}
          </span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-quaternary hover:bg-tertiary hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 p-4 flex flex-col gap-1">
        <NavLink to="/" className={linkClass} end onClick={onClose}>
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>

        <NavLink to="/assets" className={linkClass} onClick={onClose}>
          <Package size={18} />
          Manage Status
        </NavLink>

        {(user?.role === 'owner' || user?.role === 'admin') && (
          <NavLink to="/approvals" className={linkClass} onClick={onClose}>
            <ClipboardCheck size={18} />
            Approvals
          </NavLink>
        )}

        {user?.role === 'admin' && (
          <>
            <NavLink to="/locations" className={linkClass} onClick={onClose}>
              <MapPin size={18} />
              Locations
            </NavLink>
            <NavLink to="/users" className={linkClass} onClick={onClose}>
              <Users size={18} />
              Users
            </NavLink>
          </>
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
