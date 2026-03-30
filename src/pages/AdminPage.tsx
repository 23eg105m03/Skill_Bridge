import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Users, Ban, Trash2, CheckCircle, AlertTriangle, ArrowLeftRight, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import AppLayout from '@/components/AppLayout';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  name: string;
  email?: string;
  account_type: string;
  status: 'active' | 'suspended';
  rating: number;
  created_at: string;
}

interface SwapReq {
  id: string;
  sender_id: string;
  receiver_id: string;
  skill_wanted: string;
  skill_offered: string;
  status: string;
  created_at: string;
  sender_name?: string;
  receiver_name?: string;
}

export default function AdminPage() {
  const location = useLocation();
  const isSwapsTab = location.pathname === '/admin/swaps';
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [swaps, setSwaps] = useState<SwapReq[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingSwaps, setLoadingSwaps] = useState(true);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers(data || []);
    setLoadingUsers(false);
  };

  const fetchSwaps = async () => {
    setLoadingSwaps(true);
    const { data } = await supabase.from('swap_requests').select('*').order('created_at', { ascending: false });
    if (!data) { setLoadingSwaps(false); return; }
    const ids = [...new Set([...data.map(r => r.sender_id), ...data.map(r => r.receiver_id)])];
    const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', ids);
    const nameMap: Record<string, string> = {};
    profiles?.forEach(p => { nameMap[p.id] = p.name; });
    setSwaps(data.map(r => ({ ...r, sender_name: nameMap[r.sender_id] || 'Unknown', receiver_name: nameMap[r.receiver_id] || 'Unknown' })));
    setLoadingSwaps(false);
  };

  useEffect(() => { fetchUsers(); fetchSwaps(); }, []);

  const toggleStatus = async (user: UserProfile) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', user.id);
    if (error) { toast.error('Failed to update status'); return; }
    toast.success(`User ${newStatus === 'active' ? 'activated' : 'suspended'}`);
    fetchUsers();
  };

  const deleteUser = async (id: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) { toast.error('Failed to delete user'); return; }
    toast.success('User removed');
    fetchUsers();
  };

  const updateSwapStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('swap_requests').update({ status }).eq('id', id);
    if (error) { toast.error('Failed to update swap'); return; }
    toast.success(`Swap marked as ${status}`);
    fetchSwaps();
  };

  const totalActive = users.filter(u => u.status === 'active').length;
  const totalSuspended = users.filter(u => u.status === 'suspended').length;
  const pendingSwaps = swaps.filter(s => s.status === 'pending').length;

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground text-sm">User management and platform oversight</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-5">
            <Users className="w-5 h-5 text-primary mb-2" />
            <p className="text-2xl font-bold text-foreground">{users.length}</p>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </div>
          <div className="glass-card p-5">
            <CheckCircle className="w-5 h-5 text-emerald-500 mb-2" />
            <p className="text-2xl font-bold text-foreground">{totalActive}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="glass-card p-5">
            <AlertTriangle className="w-5 h-5 text-amber-500 mb-2" />
            <p className="text-2xl font-bold text-foreground">{totalSuspended}</p>
            <p className="text-xs text-muted-foreground">Suspended</p>
          </div>
          <div className="glass-card p-5">
            <Clock className="w-5 h-5 text-purple-500 mb-2" />
            <p className="text-2xl font-bold text-foreground">{pendingSwaps}</p>
            <p className="text-xs text-muted-foreground">Pending Swaps</p>
          </div>
        </div>

        {/* Users Table (shown on /admin and /admin/users) */}
        {!isSwapsTab && (
          <div className="glass-card overflow-hidden mb-8">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-semibold text-foreground flex items-center gap-2"><Users className="w-4 h-4" /> Users</h2>
              <button onClick={fetchUsers} className="text-muted-foreground hover:text-foreground transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            {loadingUsers ? (
              <div className="p-12 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground">User</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground">Type</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground">Joined</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground">Status</th>
                      <th className="text-right p-4 text-xs font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">{u.name.charAt(0)}</div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{u.name}</p>
                              <p className="text-xs text-muted-foreground">{u.bio?.slice(0, 30) || 'No bio'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${u.account_type === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {u.account_type}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="p-4">
                          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${u.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => toggleStatus(u)} className="h-8 px-2" title={u.status === 'active' ? 'Suspend' : 'Activate'}>
                              <Ban className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteUser(u.id)} className="h-8 px-2 text-destructive hover:text-destructive">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">No users found</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Swap Requests Table (shown on /admin/swaps) */}
        {isSwapsTab && (
          <div className="glass-card overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-semibold text-foreground flex items-center gap-2"><ArrowLeftRight className="w-4 h-4" /> All Swap Requests</h2>
              <button onClick={fetchSwaps} className="text-muted-foreground hover:text-foreground transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            {loadingSwaps ? (
              <div className="p-12 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground">From</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground">To</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground">Skills</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground">Date</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground">Status</th>
                      <th className="text-right p-4 text-xs font-medium text-muted-foreground">Override</th>
                    </tr>
                  </thead>
                  <tbody>
                    {swaps.map(r => (
                      <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="p-4 text-sm text-foreground">{r.sender_name}</td>
                        <td className="p-4 text-sm text-foreground">{r.receiver_name}</td>
                        <td className="p-4 text-xs text-muted-foreground">{r.skill_offered} ↔ {r.skill_wanted}</td>
                        <td className="p-4 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                        <td className="p-4">
                          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${r.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : r.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-emerald-600" onClick={() => updateSwapStatus(r.id, 'accepted')}>Accept</Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-red-600" onClick={() => updateSwapStatus(r.id, 'rejected')}>Reject</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {swaps.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground text-sm">No swap requests</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Combined view for /admin (dashboard) */}
        {!isSwapsTab && swaps.length > 0 && (
          <div className="glass-card overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-semibold text-foreground flex items-center gap-2"><ArrowLeftRight className="w-4 h-4" /> Recent Swap Requests</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground">From → To</th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground">Skills</th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="text-right p-4 text-xs font-medium text-muted-foreground">Override</th>
                  </tr>
                </thead>
                <tbody>
                  {swaps.slice(0, 5).map(r => (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="p-4 text-sm text-foreground">{r.sender_name} → {r.receiver_name}</td>
                      <td className="p-4 text-xs text-muted-foreground">{r.skill_offered} ↔ {r.skill_wanted}</td>
                      <td className="p-4">
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${r.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : r.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-emerald-600" onClick={() => updateSwapStatus(r.id, 'accepted')}>Accept</Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-red-600" onClick={() => updateSwapStatus(r.id, 'rejected')}>Reject</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}
