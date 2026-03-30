import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Send, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import AppLayout from '@/components/AppLayout';
import { toast } from 'sonner';

interface Match {
  id: string;
  name: string;
  rating: number;
  bio: string;
  matchPercentage: number;
  matchedSkillsTheyOffer: string[];
  matchedSkillsTheyWant: string[];
}

export default function MatchesPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const myOfferedNames = user.skillsOffered.map(s => s.name);
    const myWantedNames = user.skillsWanted.map(s => s.name);

    async function loadMatches() {
      setLoading(true);
      const { data: profiles } = await supabase.from('profiles').select('id, name, rating, bio').neq('id', user!.id).eq('status', 'active');
      if (!profiles) { setLoading(false); return; }

      const results: Match[] = [];
      for (const profile of profiles) {
        const { data: skills } = await supabase.from('skills').select('name, type').eq('user_id', profile.id);
        if (!skills) continue;
        const theirOffered = skills.filter(s => s.type === 'offer').map(s => s.name);
        const theirWanted = skills.filter(s => s.type === 'want').map(s => s.name);
        const matchedWeWant = theirOffered.filter(s => myWantedNames.includes(s));
        const matchedTheyWant = theirWanted.filter(s => myOfferedNames.includes(s));
        const score = matchedWeWant.length + matchedTheyWant.length;
        if (score > 0) {
          results.push({
            id: profile.id,
            name: profile.name,
            rating: profile.rating || 0,
            bio: profile.bio || '',
            matchPercentage: Math.min(100, score * 25),
            matchedSkillsTheyOffer: matchedWeWant,
            matchedSkillsTheyWant: matchedTheyWant,
          });
        }
      }
      setMatches(results.sort((a, b) => b.matchPercentage - a.matchPercentage));
      setLoading(false);
    }
    loadMatches();
  }, [user]);

  const sendSwapRequest = async (match: Match) => {
    if (!user) return;
    setSending(match.id);
    const skillOffered = user.skillsOffered[0]?.name || 'Skill exchange';
    const skillWanted = match.matchedSkillsTheyOffer[0] || 'Skill exchange';
    const { error } = await supabase.from('swap_requests').insert({
      sender_id: user.id,
      receiver_id: match.id,
      skill_offered: skillOffered,
      skill_wanted: skillWanted,
      status: 'pending',
    });
    setSending(null);
    if (error) { toast.error('Failed to send request'); return; }
    toast.success(`Swap request sent to ${match.name}!`);
  };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">Skill Matches</h1>
        <p className="text-muted-foreground mb-8">People who match your skill exchange needs</p>

        {loading ? (
          <div className="glass-card p-12 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : matches.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <ArrowLeftRight className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground font-medium mb-2">No matches yet</p>
            <p className="text-sm text-muted-foreground">Add more skills to find matching partners</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {matches.map((m, i) => (
              <motion.div key={m.id} className="glass-card p-6 hover-lift" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{m.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" /> {m.rating}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold gradient-text">{m.matchPercentage}%</span>
                    <p className="text-xs text-muted-foreground">match</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{m.bio}</p>
                {m.matchedSkillsTheyOffer.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs text-muted-foreground mb-1">They can teach you:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {m.matchedSkillsTheyOffer.map(s => <span key={s} className="px-2 py-0.5 rounded-full gradient-primary text-primary-foreground text-xs">{s}</span>)}
                    </div>
                  </div>
                )}
                {m.matchedSkillsTheyWant.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-1">They want to learn:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {m.matchedSkillsTheyWant.map(s => <span key={s} className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">{s}</span>)}
                    </div>
                  </div>
                )}
                <Button size="sm" className="w-full gradient-primary border-0 text-primary-foreground gap-2"
                  onClick={() => sendSwapRequest(m)} disabled={sending === m.id}>
                  <Send className="w-3.5 h-3.5" /> {sending === m.id ? 'Sending...' : 'Send Swap Request'}
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}
