import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import api from '../utils/api.ts';
import { Package, ClipboardCheck, MapPin, TrendingUp, Send, ShieldCheck } from 'lucide-react';

interface Stats {
  totalAssets: number;
  activeAssets: number;
  pendingApprovals: number;
  totalLocations: number;
  myRequests?: number;
  approvedRequests?: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalAssets: 0,
    activeAssets: 0,
    pendingApprovals: 0,
    totalLocations: 0,
    myRequests: 0,
    approvedRequests: 0,
  });
  const [recentChanges, setRecentChanges] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const requests: Promise<any>[] = [
          api.get('/assets'),
          api.get('/changes'),
          api.get('/locations'),
        ];

        if (user?.role === 'owner' || user?.role === 'admin') {
          requests.push(api.get('/changes/pending'));
        }

        const results = await Promise.all(requests);
        const [assetsRes, changesRes, locationsRes] = results;
        const pendingRes = results[3];

        const assets = assetsRes.data;
        const changes = changesRes.data;

        setStats({
          totalAssets: assets.length,
          activeAssets: assets.filter((a: any) => a.status === 'active').length,
          pendingApprovals: pendingRes ? pendingRes.data.length : 0,
          totalLocations: locationsRes.data.length,
          myRequests: changes.length,
          approvedRequests: changes.filter((c: any) => c.status === 'done' || c.status === 'approved').length,
        });

        setRecentChanges(changes.slice(0, 5));
        if (pendingRes) setPendingApprovals(pendingRes.data.slice(0, 5));
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-senary" />
      </div>
    );
  }

  const buildStatCards = () => {
    if (user?.role === 'user') {
      return [
        {
          label: 'Requested Assets',
          value: stats.myRequests || 0,
          icon: Send,
          color: 'bg-senary/10 text-senary',
        },
      ];
    }

    if (user?.role === 'owner') {
      return [
        {
          label: 'Requested Assets',
          value: stats.myRequests || 0,
          icon: Send,
          color: 'bg-septenary/10 text-septenary',
        },
        {
          label: 'Approved Assets',
          value: stats.approvedRequests || 0,
          icon: ClipboardCheck,
          color: 'bg-octonary/10 text-octonary',
        },
      ];
    }

    return [
      {
        label: 'All Assets',
        value: stats.totalAssets,
        icon: Package,
        color: 'bg-senary/10 text-senary',
      },
      {
        label: 'Active',
        value: stats.activeAssets,
        icon: TrendingUp,
        color: 'bg-octonary/10 text-octonary',
      },
      {
        label: 'Pending Approvals',
        value: stats.pendingApprovals,
        icon: ShieldCheck,
        color: 'bg-nonary/10 text-nonary',
      },
      {
        label: 'Locations',
        value: stats.totalLocations,
        icon: MapPin,
        color: 'bg-tertiary/10 text-tertiary',
      },
    ];
  };

  const statCards = buildStatCards();

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-nonary/10 text-nonary',
      approved: 'bg-senary/10 text-senary',
      rejected: 'bg-denary/10 text-denary',
      done: 'bg-octonary/10 text-octonary',
    };
    return map[status] || 'bg-tertiary text-quaternary';
  };

  const handleApproval = async (changeId: string, action: 'approve' | 'reject') => {
    try {
      await api.post(`/changes/${changeId}/${action}`);
      const res = await api.get('/changes/pending');
      setPendingApprovals(res.data.slice(0, 5));
      setStats((s) => ({ ...s, pendingApprovals: res.data.length }));
    } catch (err) {
      console.error(`Failed to ${action}:`, err);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
        <p className="text-tertiary mt-1">
          Welcome back, {user?.name}
          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-senary/10 text-senary capitalize">
            {user?.role}
          </span>
        </p>
      </div>

      <div className={`grid gap-6 mb-8 ${
        statCards.length === 1 ? 'grid-cols-1' :
        statCards.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
        'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
      }`}>
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

      <div className={`grid gap-6 ${user?.role === 'user' ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {/* Pending Approvals — owner/admin only */}
        {(user?.role === 'owner' || user?.role === 'admin') && (
          <div className="bg-white rounded-xl border border-quaternary/50">
            <div className="p-6 border-b border-quaternary/50 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary">Pending Approvals</h2>
              {pendingApprovals.length > 0 && (
                <Link to="/approvals" className="text-sm text-senary hover:underline">View all</Link>
              )}
            </div>
            {pendingApprovals.length === 0 ? (
              <div className="p-6 text-center text-tertiary">No pending approvals</div>
            ) : (
              <div className="divide-y divide-quaternary/50">
                {pendingApprovals.map((a: any) => (
                  <div key={a.id} className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <Link
                        to={`/assets/${a.asset_id}`}
                        className="font-medium text-primary hover:text-senary transition-colors min-w-0 truncate"
                      >
                        {a.asset_name}
                      </Link>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-nonary/10 text-nonary capitalize shrink-0">
                        {a.change_type}
                      </span>
                    </div>
                    <p className="text-xs text-tertiary mb-2">
                      by {a.requested_by_name} &middot; {a.approver_role.replace('_', ' ')}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproval(a.change_id, 'approve')}
                        className="px-3 py-1 rounded-lg bg-octonary text-white text-xs font-medium hover:bg-octonary/90"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApproval(a.change_id, 'reject')}
                        className="px-3 py-1 rounded-lg bg-denary text-white text-xs font-medium hover:bg-denary/90"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recent Changes */}
        <div className="bg-white rounded-xl border border-quaternary/50">
          <div className="p-6 border-b border-quaternary/50">
            <h2 className="text-lg font-semibold text-primary">
              {user?.role === 'user' ? 'My Requests' : 'Recent Changes'}
            </h2>
          </div>
          {recentChanges.length === 0 ? (
            <div className="p-6 text-center text-tertiary">
              {user?.role === 'user' ? 'No requests yet' : 'No recent changes'}
            </div>
          ) : (
            <div className="divide-y divide-quaternary/50">
              {recentChanges.map((change) => (
                <div key={change.id} className="p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <Link
                      to={`/assets/${change.asset_id}`}
                      className="font-medium text-primary hover:text-senary transition-colors"
                    >
                      {change.asset_name}
                    </Link>
                    <p className="text-sm text-tertiary mt-0.5 truncate">
                      {change.change_type} change
                      {user?.role !== 'user' && <> by {change.requested_by_name}</>}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 self-start sm:self-auto ${statusBadge(change.status)}`}>
                    {change.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
