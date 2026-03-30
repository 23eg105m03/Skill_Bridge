import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Lightbulb, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth, Skill } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import AppLayout from '@/components/AppLayout';
import { toast } from 'sonner';

export default function SkillsPage() {
  const { user, refreshUser } = useAuth();
  const [newSkill, setNewSkill] = useState('');
  const [skillType, setSkillType] = useState<'offer' | 'want'>('offer');
  const [loading, setLoading] = useState(false);

  const addSkill = async () => {
    if (!newSkill.trim()) { toast.error('Enter a skill name'); return; }
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from('skills').insert({
      user_id: user.id,
      name: newSkill.trim(),
      type: skillType,
    });
    if (error) { toast.error('Failed to add skill'); setLoading(false); return; }
    await refreshUser();
    setNewSkill('');
    toast.success('Skill added!');
    setLoading(false);
  };

  const removeSkill = async (skill: Skill) => {
    const { error } = await supabase.from('skills').delete().eq('id', skill.id);
    if (error) { toast.error('Failed to remove skill'); return; }
    await refreshUser();
    toast.success('Skill removed');
  };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">Manage Skills</h1>
        <p className="text-muted-foreground mb-8">Add skills you can teach or want to learn</p>

        <div className="glass-card p-6 mb-8">
          <div className="flex gap-3 mb-4">
            {(['offer', 'want'] as const).map(t => (
              <button key={t} onClick={() => setSkillType(t)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${skillType === t ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                {t === 'offer' ? '🎓 I can teach' : '📚 I want to learn'}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <Input placeholder="e.g. React.js, Python, UI Design..." value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSkill()} className="flex-1" />
            <Button onClick={addSkill} disabled={loading} className="gradient-primary border-0 text-primary-foreground gap-2">
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-primary" /> Skills I Offer</h2>
            <div className="space-y-2">
              {user?.skillsOffered.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 group">
                  <span className="text-sm text-foreground">{s.name}</span>
                  <button onClick={() => removeSkill(s)} className="opacity-0 group-hover:opacity-100 text-destructive transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {!user?.skillsOffered.length && <p className="text-sm text-muted-foreground py-4 text-center">No skills offered yet</p>}
            </div>
          </div>
          <div className="glass-card p-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4 text-purple-500" /> Skills I Want</h2>
            <div className="space-y-2">
              {user?.skillsWanted.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 group">
                  <span className="text-sm text-foreground">{s.name}</span>
                  <button onClick={() => removeSkill(s)} className="opacity-0 group-hover:opacity-100 text-destructive transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {!user?.skillsWanted.length && <p className="text-sm text-muted-foreground py-4 text-center">No skills wanted yet</p>}
            </div>
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
}
