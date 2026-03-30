import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, Square, Play, Pause, Trash2, Send, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import AppLayout from '@/components/AppLayout';
import { toast } from 'sonner';

interface VoiceMsg {
  id: string;
  sender_id: string;
  receiver_id: string | null;
  file_path: string;
  duration: number;
  created_at: string;
  sender_name?: string;
  public_url?: string;
}

interface Partner {
  id: string;
  name: string;
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function VoicePage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<VoiceMsg[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string>('');
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  const fetchMessages = async () => {
    if (!user) return;
    const { data } = await supabase.from('voice_messages').select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });
    if (!data) { setLoading(false); return; }

    const userIds = [...new Set(data.map(m => m.sender_id))];
    const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', userIds);
    const nameMap: Record<string, string> = {};
    profiles?.forEach(p => { nameMap[p.id] = p.name; });

    setMessages(data.map(m => ({
      ...m,
      sender_name: nameMap[m.sender_id] || 'Unknown',
      public_url: supabase.storage.from('voice').getPublicUrl(m.file_path).data.publicUrl,
    })));
    setLoading(false);
  };

  const fetchPartners = async () => {
    if (!user) return;
    const { data } = await supabase.from('swap_requests').select('sender_id, receiver_id').eq('status', 'accepted')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
    if (!data) return;
    const partnerIds = data.map(r => r.sender_id === user.id ? r.receiver_id : r.sender_id);
    const unique = [...new Set(partnerIds)];
    if (!unique.length) return;
    const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', unique);
    setPartners(profiles || []);
    if (profiles?.length) setSelectedPartner(profiles[0].id);
  };

  useEffect(() => {
    fetchMessages();
    fetchPartners();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [user]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.start();
      setRecording(true);
      setDuration(0);
      intervalRef.current = setInterval(() => setDuration(d => d + 1), 1000);
      toast.info('Recording started...');
    } catch {
      toast.error('Could not access microphone');
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current || !user) return;
    const recorder = mediaRecorderRef.current;

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const filePath = `${user.id}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage.from('voice').upload(filePath, blob);
      if (uploadError) { toast.error('Upload failed'); return; }

      const { error } = await supabase.from('voice_messages').insert({
        sender_id: user.id,
        receiver_id: selectedPartner || null,
        file_path: filePath,
        duration,
      });
      if (error) { toast.error('Failed to save message'); return; }
      toast.success('Voice message sent!');
      fetchMessages();
    };

    recorder.stop();
    recorder.stream.getTracks().forEach(t => t.stop());
    setRecording(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDuration(0);
  };

  const togglePlay = (msg: VoiceMsg) => {
    if (!msg.public_url) return;
    if (playing === msg.id) {
      audioRefs.current[msg.id]?.pause();
      setPlaying(null);
      return;
    }
    if (playing && audioRefs.current[playing]) {
      audioRefs.current[playing].pause();
    }
    if (!audioRefs.current[msg.id]) {
      audioRefs.current[msg.id] = new Audio(msg.public_url);
      audioRefs.current[msg.id].onended = () => setPlaying(null);
    }
    audioRefs.current[msg.id].play();
    setPlaying(msg.id);
  };

  const deleteMessage = async (msg: VoiceMsg) => {
    try {
      const { error: storageError } = await supabase.storage.from('voice').remove([msg.file_path]);
      if (storageError) {
        console.error('Storage deletion error:', storageError);
        // Continue to delete from DB even if storage removal fails (maybe it was already gone)
      }

      const { error: dbError } = await supabase.from('voice_messages').delete().eq('id', msg.id);
      if (dbError) {
        toast.error(`Failed to delete message: ${dbError.message}`);
        return;
      }

      toast.success('Message deleted');
      setMessages(prev => prev.filter(m => m.id !== msg.id));
    } catch (err: any) {
      console.error('Unexpected error during deletion:', err);
      toast.error('An unexpected error occurred during deletion');
    }
  };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">Voice Messages</h1>
        <p className="text-muted-foreground mb-8">Record and send voice messages to your swap partners</p>

        <div className="glass-card p-8 mb-8">
          {partners.length > 0 && (
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-2">Send to partner:</p>
              <div className="flex flex-wrap gap-2">
                {partners.map(p => (
                  <button key={p.id} onClick={() => setSelectedPartner(p.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${selectedPartner === p.id ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                    <UserIcon className="w-3.5 h-3.5" /> {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {partners.length === 0 && (
            <p className="text-sm text-muted-foreground mb-4 text-center">Accept a swap request first to unlock voice messaging</p>
          )}

          <div className="text-center">
            <div className={`w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center transition-all ${recording ? 'gradient-primary animate-pulse' : 'bg-secondary'}`}>
              <Mic className={`w-10 h-10 ${recording ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
            </div>
            {recording && <p className="text-2xl font-mono font-bold text-foreground mb-4">{formatDuration(duration)}</p>}
            <div className="flex items-center justify-center gap-3">
              {!recording ? (
                <Button onClick={startRecording} className="gradient-primary border-0 text-primary-foreground gap-2 h-12 px-8">
                  <Mic className="w-4 h-4" /> Start Recording
                </Button>
              ) : (
                <Button onClick={stopRecording} variant="destructive" className="gap-2 h-12 px-8">
                  <Square className="w-4 h-4" /> Stop & Send
                </Button>
              )}
            </div>
          </div>
        </div>

        <h2 className="font-semibold text-foreground mb-4">Messages</h2>
        {loading ? (
          <div className="glass-card p-12 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : (
          <div className="space-y-3">
            {messages.map((m, i) => (
              <motion.div key={m.id} className="glass-card p-4 flex items-center justify-between" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${m.sender_id === user?.id ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                    {m.sender_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.sender_id === user?.id ? 'You' : m.sender_name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleDateString()} · {formatDuration(m.duration)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" onClick={() => togglePlay(m)}>
                    {playing === m.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  {(m.sender_id === user?.id || m.receiver_id === user?.id) && (
                    <button className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" onClick={() => deleteMessage(m)} title="Delete message">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
            {messages.length === 0 && <div className="glass-card p-12 text-center"><p className="text-muted-foreground">No voice messages yet</p></div>}
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}
