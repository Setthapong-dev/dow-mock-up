import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import api from '../utils/api.ts';
import { Package, ClipboardCheck, MapPin, TrendingUp } from 'lucide-react';

interface Stats {
  totalAssets: number;
  activeAssets: number;
  pendingApprovals: number;
  totalLocations: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalAssets: 0,
    activeAssets: 0,
    pendingApprovals: 0,
    totalLocations: 0,
  });
  const [recentChanges, setRecentChanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assetsRes, changesRes, locationsRes] = await Promise.all([
          api.get('/assets'),
          api.get('/changes'),
          api.get('/locations'),
        ]);

        const assets = assetsRes.data;
        setStats({
          totalAssets: assets.length,
          activeAssets: assets.filter((a: any) => a.status === 'active').length,
          pendingApprovals: changesRes.data.filter((c: any) => c.status === 'pending').length,
          totalLocations: locationsRes.data.length,
        });
        setRecentChanges(changesRes.data.slice(0, 5));
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-senary" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Assets', value: stats.totalAssets, icon: Package, color: 'bg-senary/10 text-senary' },
    { label: 'Active Assets', value: stats.activeAssets, icon: TrendingUp, color: 'bg-octonary/10 text-octonary' },
    { label: 'Pending Approvals', value: stats.pendingApprovals, icon: ClipboardCheck, color: 'bg-nonary/10 text-nonary' },
    { label: 'Locations', value: stats.totalLocations, icon: MapPin, color: 'bg-septenary/10 text-septenary' },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-nonary/10 text-nonary',
      approved: 'bg-senary/10 text-senary',
      rejected: 'bg-denary/10 text-denary',
      done: 'bg-octonary/10 text-octonary',
    };
    return map[status] || 'bg-tertiary text-quaternary';
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
        <p className="text-tertiary mt-1">Welcome back, {user?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-quaternary/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-tertiary">{card.label}</p>
                <p className="text-3xl font-bold text-primary mt-1">{card.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${card.color}`}>
                <card.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-quaternary/50">
        <div className="p-6 border-b border-quaternary/50">
          <h2 className="text-lg font-semibold text-primary">Recent Changes</h2>
        </div>
        {recentChanges.length === 0 ? (
          <div className="p-6 text-center text-tertiary">No recent changes</div>
        ) : (
          <div className="divide-y divide-quaternary/50">
            {recentChanges.map((change) => (
              <div key={change.id} className="p-4 flex items-center justify-between">
                <div>
                  <Link
                    to={`/assets/${change.asset_id}`}
                    className="font-medium text-primary hover:text-senary transition-colors"
                  >
                    {change.asset_name}
                  </Link>
                  <p className="text-sm text-tertiary mt-0.5">
                    {change.change_type} change by {change.requested_by_name}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge(change.status)}`}>
                  {change.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
