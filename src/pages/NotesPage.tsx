import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, Image, File, Upload, Download, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import AppLayout from '@/components/AppLayout';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Share2, Users } from 'lucide-react';

interface Note {
  id: string;
  owner_id: string;
  title: string;
  file_type: string;
  file_path: string | null;
  created_at: string;
  shared_with: string[];
  owner_name?: string;
}

const fileIcons: Record<string, typeof FileText> = { pdf: FileText, image: Image, doc: File };

function getFileType(file: File): string {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type === 'application/pdf') return 'pdf';
  return 'doc';
}

export default function NotesPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'my' | 'shared'>('my');
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [partners, setPartners] = useState<{id: string, name: string}[]>([]);
  const [sharingNote, setSharingNote] = useState<Note | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchNotes = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from('notes').select('*').or(`owner_id.eq.${user.id},shared_with.cs.{${user.id}}`).order('created_at', { ascending: false });
    if (data) {
      const userIds = [...new Set(data.map(n => n.owner_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', userIds);
      const nameMap: Record<string, string> = {};
      profiles?.forEach(p => { nameMap[p.id] = p.name; });
      setNotes(data.map(n => ({ ...n, owner_name: nameMap[n.owner_id] || 'Unknown' })));
    }
    setLoading(false);
  };

  const fetchPartners = async () => {
    if (!user) return;
    const { data: swaps } = await supabase
      .from('swap_requests')
      .select('sender_id, receiver_id')
      .eq('status', 'accepted')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
    
    if (swaps) {
      const partnerIds = swaps.map(s => s.sender_id === user.id ? s.receiver_id : s.sender_id);
      const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', partnerIds);
      if (profiles) setPartners(profiles);
    }
  };

  useEffect(() => { 
    fetchNotes(); 
    fetchPartners();
  }, [user]);

  const upload = async () => {
    if (!title.trim()) { toast.error('Enter a title'); return; }
    if (!user) return;
    setUploading(true);

    const file = fileRef.current?.files?.[0];
    let filePath: string | null = null;
    let fileType = 'doc';

    if (file) {
      fileType = getFileType(file);
      const ext = file.name.split('.').pop();
      filePath = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('notes').upload(filePath, file);
      if (uploadError) { toast.error('File upload failed'); setUploading(false); return; }
    }

    const { error } = await supabase.from('notes').insert({
      owner_id: user.id,
      title: title.trim(),
      file_type: fileType,
      file_path: filePath,
      shared_with: [],
    });
    if (error) { toast.error('Failed to save note'); setUploading(false); return; }
    setTitle('');
    if (fileRef.current) fileRef.current.value = '';
    toast.success('Note uploaded!');
    fetchNotes();
    setUploading(false);
  };

  const remove = async (note: Note) => {
    if (note.file_path) await supabase.storage.from('notes').remove([note.file_path]);
    await supabase.from('notes').delete().eq('id', note.id);
    toast.success('Note deleted');
    fetchNotes();
  };

  const download = async (note: Note) => {
    if (!note.file_path) { toast.info('No file attached'); return; }
    const { data } = supabase.storage.from('notes').getPublicUrl(note.file_path);
    window.open(data.publicUrl, '_blank');
  };

  const shareWith = async (partnerId: string) => {
    if (!sharingNote) return;
    
    const newSharedWith = [...new Set([...sharingNote.shared_with, partnerId])];
    const { error } = await supabase
      .from('notes')
      .update({ shared_with: newSharedWith })
      .eq('id', sharingNote.id);

    if (error) {
      toast.error('Failed to share note');
      return;
    }

    toast.success('Note shared successfully!');
    setSharingNote(null);
    fetchNotes();
  };

  const myNotes = notes.filter(n => n.owner_id === user?.id);
  const sharedNotes = notes.filter(n => n.owner_id !== user?.id);
  const current = tab === 'my' ? myNotes : sharedNotes;

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">Notes Exchange</h1>
        <p className="text-muted-foreground mb-6">Upload and share study materials</p>

        <div className="glass-card p-5 mb-6">
          <div className="flex flex-col gap-3">
            <Input placeholder="Note title..." value={title} onChange={e => setTitle(e.target.value)} />
            <div className="flex gap-3">
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" className="flex-1 text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:gradient-primary file:text-primary-foreground cursor-pointer" />
              <Button onClick={upload} disabled={uploading} className="gradient-primary border-0 text-primary-foreground gap-2">
                <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          {(['my', 'shared'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
              {t === 'my' ? 'My Notes' : 'Shared With Me'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="glass-card p-12 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : (
          <div className="space-y-3">
            {current.map((n, i) => {
              const Icon = fileIcons[n.file_type] || File;
              return (
                <motion.div key={n.id} className="glass-card p-4 flex items-center justify-between" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{n.owner_name} · {new Date(n.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" onClick={() => download(n)}>
                      <Download className="w-4 h-4" />
                    </button>
                    {n.owner_id === user?.id && (
                      <>
                        <Dialog open={sharingNote?.id === n.id} onOpenChange={(open) => !open && setSharingNote(null)}>
                          <DialogTrigger asChild>
                            <button 
                              className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                              onClick={() => setSharingNote(n)}
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                          </DialogTrigger>
                          <DialogContent className="glass-card border-white/10 sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" />
                                Share Note: {n.title}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <p className="text-sm text-muted-foreground">Select a partner to share this note with:</p>
                              <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                                {partners.map(p => (
                                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors group">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs text-primary-foreground font-bold">
                                        {p.name.charAt(0)}
                                      </div>
                                      <span className="text-sm font-medium">{p.name}</span>
                                    </div>
                                    <Button 
                                      size="sm" 
                                      variant={n.shared_with.includes(p.id) ? "outline" : "default"}
                                      className={n.shared_with.includes(p.id) ? "" : "gradient-primary border-0 text-primary-foreground"}
                                      disabled={n.shared_with.includes(p.id)}
                                      onClick={() => shareWith(p.id)}
                                    >
                                      {n.shared_with.includes(p.id) ? 'Shared' : 'Share'}
                                    </Button>
                                  </div>
                                ))}
                                {partners.length === 0 && (
                                  <div className="p-8 text-center bg-secondary/20 rounded-xl">
                                    <p className="text-sm text-muted-foreground">No active swap partners found to share with.</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <button className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" onClick={() => remove(n)}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
            {current.length === 0 && <div className="glass-card p-12 text-center"><p className="text-muted-foreground">No notes yet</p></div>}
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}
