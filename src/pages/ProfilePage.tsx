import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, FileText, Star, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import AppLayout from '@/components/AppLayout';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, updateUser, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', bio: user?.bio || '' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ name: form.name, bio: form.bio }).eq('id', user.id);
    if (error) { toast.error('Failed to save profile'); setSaving(false); return; }
    updateUser({ name: form.name, bio: form.bio });
    await refreshUser();
    setEditing(false);
    toast.success('Profile updated!');
    setSaving(false);
  };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground mb-8">My Profile</h1>

        <div className="glass-card p-8 max-w-2xl">
          <div className="flex items-start gap-6 mb-8">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground text-3xl font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">{user?.name}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-medium text-foreground">{user?.rating || 0}</span>
              </div>
              <span className="inline-block mt-2 px-3 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {user?.accountType === 'admin' ? 'Admin' : 'Student'}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setForm({ name: user?.name || '', bio: user?.bio || '' }); setEditing(!editing); }}>
              {editing ? 'Cancel' : 'Edit'}
            </Button>
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1.5" />
              </div>
              <div>
                <Label>Bio</Label>
                <Textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} className="mt-1.5" />
              </div>
              <Button onClick={save} disabled={saving} className="gradient-primary border-0 text-primary-foreground gap-2">
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div><p className="text-xs text-muted-foreground">Name</p><p className="text-sm text-foreground">{user?.name}</p></div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div><p className="text-xs text-muted-foreground">Email</p><p className="text-sm text-foreground">{user?.email}</p></div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div><p className="text-xs text-muted-foreground">Bio</p><p className="text-sm text-foreground">{user?.bio || 'No bio yet'}</p></div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-border">
            <h3 className="font-semibold text-foreground mb-3">Skills Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Teaching</p>
                <div className="flex flex-wrap gap-1.5">
                  {user?.skillsOffered.map(s => <span key={s.id} className="px-2 py-0.5 rounded-full gradient-primary text-primary-foreground text-xs">{s.name}</span>)}
                  {!user?.skillsOffered.length && <span className="text-xs text-muted-foreground">None</span>}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Learning</p>
                <div className="flex flex-wrap gap-1.5">
                  {user?.skillsWanted.map(s => <span key={s.id} className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">{s.name}</span>)}
                  {!user?.skillsWanted.length && <span className="text-xs text-muted-foreground">None</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
}
