import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, BookOpen, ArrowLeftRight, Clock, TrendingUp, Star } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import AppLayout from '@/components/AppLayout';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08 } }) };

interface Match {
  id: string;
  name: string;
  rating: number;
  bio: string;
  matchPercentage: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [pendingSwaps, setPendingSwaps] = useState(0);
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    if (!user) return;

    // Fetch pending incoming swaps
    supabase.from('swap_requests').select('id', { count: 'exact' })
      .eq('receiver_id', user.id).eq('status', 'pending')
      .then(({ count }) => setPendingSwaps(count || 0));

    // Fetch matches: other users whose skills overlap with ours
    const myOfferedNames = user.skillsOffered.map(s => s.name);
    const myWantedNames = user.skillsWanted.map(s => s.name);

    supabase.from('profiles').select('id, name, rating, bio').neq('id', user.id).eq('status', 'active')
      .then(async ({ data: profiles }) => {
        if (!profiles) return;
        const matchResults: Match[] = [];
        for (const profile of profiles) {
          const { data: skills } = await supabase.from('skills').select('name, type').eq('user_id', profile.id);
          if (!skills) continue;
          const theirOffered = skills.filter(s => s.type === 'offer').map(s => s.name);
          const theirWanted = skills.filter(s => s.type === 'want').map(s => s.name);
          const score = theirOffered.filter(s => myWantedNames.includes(s)).length +
                        theirWanted.filter(s => myOfferedNames.includes(s)).length;
          if (score > 0) {
            matchResults.push({
              id: profile.id,
              name: profile.name,
              rating: profile.rating || 0,
              bio: profile.bio || '',
              matchPercentage: Math.min(100, score * 25),
            });
          }
        }
        setMatches(matchResults.sort((a, b) => b.matchPercentage - a.matchPercentage));
      });
  }, [user]);

  const stats = [
    { label: 'Skills Offered', value: user?.skillsOffered.length || 0, icon: Lightbulb, color: 'text-primary' },
    { label: 'Skills Wanted', value: user?.skillsWanted.length || 0, icon: BookOpen, color: 'text-purple-500' },
    { label: 'Matches Found', value: matches.length, icon: ArrowLeftRight, color: 'text-emerald-500' },
    { label: 'Pending Swaps', value: pendingSwaps, icon: Clock, color: 'text-amber-500' },
  ];

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible">
        <motion.div variants={fadeUp} custom={0} className="mb-8">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-muted-foreground mt-1">Here's your learning overview</p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <motion.div key={s.label} variants={fadeUp} custom={i + 1} className="glass-card p-5 hover-lift">
              <div className="flex items-center justify-between mb-3">
                <s.icon className={`w-5 h-5 ${s.color}`} />
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div variants={fadeUp} custom={5} className="glass-card p-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-primary" /> My Skills</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-2">I can teach</p>
                <div className="flex flex-wrap gap-2">
                  {user?.skillsOffered.map(s => (
                    <span key={s.id} className="px-3 py-1 rounded-full gradient-primary text-primary-foreground text-xs font-medium">{s.name}</span>
                  ))}
                  {!user?.skillsOffered.length && <span className="text-xs text-muted-foreground">No skills added yet</span>}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">I want to learn</p>
                <div className="flex flex-wrap gap-2">
                  {user?.skillsWanted.map(s => (
                    <span key={s.id} className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">{s.name}</span>
                  ))}
                  {!user?.skillsWanted.length && <span className="text-xs text-muted-foreground">No skills added yet</span>}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} custom={6} className="glass-card p-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2"><ArrowLeftRight className="w-4 h-4 text-primary" /> Top Matches</h2>
            <div className="space-y-3">
              {matches.slice(0, 3).map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{m.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" /> {m.rating}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold gradient-text">{m.matchPercentage}%</span>
                </div>
              ))}
              {matches.length === 0 && <p className="text-sm text-muted-foreground">Add skills to find matches</p>}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AppLayout>
  );
}
