import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import AppLayout from '@/components/AppLayout';
import { toast } from 'sonner';

interface SwapRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  skill_wanted: string;
  skill_offered: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  sender_name?: string;
  receiver_name?: string;
}

export default function SwapsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [requests, setRequests] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSwaps = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from('swap_requests').select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error || !data) { setLoading(false); return; }

    // Fetch names for all involved users
    const userIds = [...new Set([...data.map(r => r.sender_id), ...data.map(r => r.receiver_id)])];
    const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', userIds);
    const nameMap: Record<string, string> = {};
    profiles?.forEach(p => { nameMap[p.id] = p.name; });

    setRequests(data.map(r => ({
      ...r,
      sender_name: nameMap[r.sender_id] || 'Unknown',
      receiver_name: nameMap[r.receiver_id] || 'Unknown',
    })));
    setLoading(false);
  };

  useEffect(() => { fetchSwaps(); }, [user]);

  const incoming = requests.filter(r => r.receiver_id === user?.id);
  const outgoing = requests.filter(r => r.sender_id === user?.id);
  const current = tab === 'incoming' ? incoming : outgoing;

  const handleAction = async (id: string, action: 'accepted' | 'rejected') => {
    const { error } = await supabase.from('swap_requests').update({ status: action }).eq('id', id);
    if (error) { toast.error('Failed to update request'); return; }
    toast.success(action === 'accepted' ? 'Swap request accepted!' : 'Swap request rejected');
    fetchSwaps();
  };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">Swap Requests</h1>
        <p className="text-muted-foreground mb-6">Manage your skill exchange requests</p>

        <div className="flex gap-3 mb-6">
          {(['incoming', 'outgoing'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
              {t === 'incoming' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="glass-card p-12 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : (
          <div className="space-y-4">
            {current.map((r, i) => (
              <motion.div key={r.id} className="glass-card p-5" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                      {(tab === 'incoming' ? r.sender_name : r.receiver_name || '').charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{tab === 'incoming' ? r.sender_name : r.receiver_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Wants: <span className="text-foreground font-medium">{r.skill_wanted}</span> · Offers: <span className="text-foreground font-medium">{r.skill_offered}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.status === 'pending' && tab === 'incoming' ? (
                      <>
                        <Button size="sm" className="gradient-primary border-0 text-primary-foreground gap-1" onClick={() => handleAction(r.id, 'accepted')}>
                          <Check className="w-3.5 h-3.5" /> Accept
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => handleAction(r.id, 'rejected')}>
                          <X className="w-3.5 h-3.5" /> Reject
                        </Button>
                      </>
                    ) : (
                      <span className={`text-xs font-medium px-3 py-1 rounded-full ${r.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : r.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            {current.length === 0 && (
              <div className="glass-card p-12 text-center"><p className="text-muted-foreground">No {tab} requests yet</p></div>
            )}
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}
