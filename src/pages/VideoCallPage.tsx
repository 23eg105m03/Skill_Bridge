import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Video, VideoOff, Mic, MicOff, Monitor, PhoneOff, MessageSquare, X, Users, Edit3, Eraser } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import AppLayout from '@/components/AppLayout';
import { toast } from 'sonner';

interface Partner { id: string; name: string; }
interface ChatMsg { text: string; self: boolean; name: string; }
interface Signal { type: string; data: unknown; from: string; to: string; }

export default function VideoCallPage() {
  const { user } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [inCall, setInCall] = useState(false);
  const [calling, setCalling] = useState(false);
  const [camera, setCamera] = useState(true);
  const [mic, setMic] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [msg, setMsg] = useState('');
  const [notepadOpen, setNotepadOpen] = useState(false);
  const [notepadContent, setNotepadContent] = useState('');
  const [incomingOffer, setIncomingOffer] = useState<{ from: string; name: string; offer: RTCSessionDescriptionInit } | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch accepted swap partners
  useEffect(() => {
    if (!user) return;
    async function load() {
      const { data } = await supabase.from('swap_requests').select('sender_id,receiver_id').eq('status', 'accepted')
        .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`);
      if (!data) return;
      const ids = [...new Set(data.map(r => r.sender_id === user!.id ? r.receiver_id : r.sender_id))];
      if (!ids.length) return;
      const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', ids);
      setPartners(profiles || []);
      if (profiles?.length) setSelectedPartner(profiles[0]);
    }
    load();
  }, [user]);

  // Subscribe to incoming WebRTC signals
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`webrtc:${user.id}`)
      .on('broadcast', { event: 'signal' }, async ({ payload }: { payload: Signal }) => {
        if (payload.to !== user.id) return;
        
        if (payload.type === 'offer') {
          if (inCall || calling) {
            // Busy or already in call, maybe handle multiple calls later
            return;
          }
          // Find partner name
          const sender = partners.find(p => p.id === payload.from);
          setIncomingOffer({ 
            from: payload.from, 
            name: sender?.name || 'Unknown Partner', 
            offer: payload.data as RTCSessionDescriptionInit 
          });
          toast.info(`Incoming call from ${sender?.name || 'Unknown'}`);
        } else if (payload.type === 'answer') {
          if (!pcRef.current) return;
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.data as RTCSessionDescriptionInit));
          setInCall(true);
          setCalling(false);
          toast.success('Call connected!');
          
          // Process queued ICE candidates
          while (iceCandidatesQueue.current.length > 0) {
            const cand = iceCandidatesQueue.current.shift();
            if (cand) await pcRef.current.addIceCandidate(new RTCIceCandidate(cand));
          }
        } else if (payload.type === 'ice') {
          if (pcRef.current && pcRef.current.remoteDescription) {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.data as RTCIceCandidateInit));
          } else {
            iceCandidatesQueue.current.push(payload.data as RTCIceCandidateInit);
          }
        } else if (payload.type === 'hang-up') {
          endCall();
        } else if (payload.type === 'chat') {
          setMessages(prev => [...prev, { text: payload.data as string, self: false, name: payload.from }]);
        } else if (payload.type === 'notepad') {
          setNotepadContent(payload.data as string);
        }
      })
      .subscribe();
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [user, partners, inCall, calling]);

  // Handle local video attachment
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Handle remote video attachment
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      console.log("Attaching remote stream to video element", remoteStream.id);
      remoteVideoRef.current.srcObject = remoteStream;
      
      // Explicitly call play for mobile browsers
      remoteVideoRef.current.play().catch(e => {
        console.warn("Auto-play blocked or failed", e);
      });
    }
  }, [remoteStream, inCall]);

  const sendSignal = (signal: Signal) => {
    if (!selectedPartner) return;
    supabase.channel(`webrtc:${selectedPartner.id}`).send({ type: 'broadcast', event: 'signal', payload: signal });
  };

  const createPC = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }],
    });
    pc.onicecandidate = e => {
      if (e.candidate && selectedPartner && user) {
        sendSignal({ type: 'ice', data: e.candidate.toJSON(), from: user.id, to: selectedPartner.id });
      }
    };
    pc.ontrack = e => {
      console.log("Track received:", e.track.kind, e.streams[0]?.id);
      if (e.streams && e.streams[0]) {
        setRemoteStream(e.streams[0]);
      }
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') { setInCall(true); setCalling(false); }
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') endCall();
    };
    return pc;
  };

  const startCall = async () => {
    if (!selectedPartner || !user) { toast.error('Select a partner first'); return; }
    setCalling(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      setLocalStream(stream);
      const pc = createPC();
      pcRef.current = pc;
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal({ type: 'offer', data: offer, from: user.id, to: selectedPartner.id });
      toast.info(`Calling ${selectedPartner.name}...`);
    } catch {
      toast.error('Could not access camera/mic');
      setCalling(false);
    }
  };

  const acceptCall = async () => {
    if (!incomingOffer || !user) return;
    const { from, offer } = incomingOffer;
    setIncomingOffer(null);
    setInCall(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      setLocalStream(stream);
      
      const pc = createPC();
      pcRef.current = pc;
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
      
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      // Update selected partner to the one calling
      const caller = partners.find(p => p.id === from);
      if (caller) setSelectedPartner(caller);
      
      // We need to send signal back to the specific user
      supabase.channel(`webrtc:${from}`).send({ 
        type: 'broadcast', 
        event: 'signal', 
        payload: { type: 'answer', data: answer, from: user.id, to: from } 
      });

      // Process queued ICE candidates
      while (iceCandidatesQueue.current.length > 0) {
        const cand = iceCandidatesQueue.current.shift();
        if (cand) await pc.addIceCandidate(new RTCIceCandidate(cand));
      }
      
      toast.success('Call accepted');
    } catch (err) {
      console.error(err);
      toast.error('Could not access camera/mic');
      setInCall(false);
    }
  };

  const rejectCall = () => {
    if (!incomingOffer || !user) return;
    supabase.channel(`webrtc:${incomingOffer.from}`).send({ 
      type: 'broadcast', 
      event: 'signal', 
      payload: { type: 'hang-up', from: user.id, to: incomingOffer.from } 
    });
    setIncomingOffer(null);
    toast.info('Call rejected');
  };

  const joinCall = async () => {
    if (!user) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      const pc = createPC();
      pcRef.current = pc;
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
    } catch {
      toast.error('Could not access camera/mic');
    }
  };

  const endCall = () => {
    if (selectedPartner && user) sendSignal({ type: 'hang-up', data: null, from: user.id, to: selectedPartner.id });
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current = null;
    screenStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setInCall(false);
    setCalling(false);
    setSharing(false);
    setChatOpen(false);
    setLocalStream(null);
    setRemoteStream(null);
    iceCandidatesQueue.current = [];
    toast.info('Call ended');
  };

  const toggleCamera = () => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setCamera(p => !p);
  };

  const toggleMic = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setMic(p => !p);
  };

  const toggleScreenShare = async () => {
    try {
      if (sharing) {
        // Stop screen sharing
        screenStreamRef.current?.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
        
        // Revert to camera stream
        const videoTrack = localStreamRef.current?.getVideoTracks()[0];
        if (videoTrack && pcRef.current) {
          const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video');
          if (sender) await sender.replaceTrack(videoTrack);
        }
        if (localVideoRef.current && localStreamRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
        setSharing(false);
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        
        const screenTrack = screenStream.getVideoTracks()[0];
        
        // Listen for user stopping from browser's native UI
        screenTrack.onended = () => {
          toggleScreenShare();
        };
        
        if (pcRef.current) {
          const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video');
          if (sender) await sender.replaceTrack(screenTrack);
        }
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setSharing(true);
      }
    } catch (err) {
      console.error("Screen share error", err);
      toast.error('Could not share screen');
      setSharing(false);
    }
  };

  const sendChat = () => {
    if (!msg.trim() || !selectedPartner || !user) return;
    setMessages(prev => [...prev, { text: msg, self: true, name: 'You' }]);
    sendSignal({ type: 'chat', data: msg, from: user.id, to: selectedPartner.id });
    setMsg('');
  };
  
  const handleNotepadChange = (val: string) => {
    setNotepadContent(val);
    if (!selectedPartner || !user) return;
    
    // Send signal with notepad content
    sendSignal({ 
      type: 'notepad', 
      data: val, 
      from: user.id, 
      to: selectedPartner.id 
    });
  };

  const clearNotepad = () => {
    if (window.confirm('Clear notepad for both users?')) {
      handleNotepadChange('');
    }
  };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">Video Call</h1>
        <p className="text-muted-foreground mb-8">Connect face-to-face with your learning partner</p>

        {partners.length > 0 && !inCall && (
          <div className="glass-card p-4 mb-6">
            <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> Select partner to call:</p>
            <div className="flex flex-wrap gap-2">
              {partners.map(p => (
                <button key={p.id} onClick={() => setSelectedPartner(p)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${selectedPartner?.id === p.id ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {!inCall ? (
          <div className="glass-card p-12 text-center">
            <div className="w-24 h-24 rounded-full bg-secondary mx-auto mb-6 flex items-center justify-center">
              <Video className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {selectedPartner ? `Call ${selectedPartner.name}` : 'Ready to call?'}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {partners.length === 0 ? 'Accept a swap request to unlock video calls' : 'Start a real peer-to-peer video call with your matched partner'}
            </p>
            {partners.length > 0 && (
              <Button onClick={startCall} disabled={calling || !selectedPartner} className="gradient-primary border-0 text-primary-foreground gap-2 h-12 px-8">
                <Video className="w-4 h-4" /> {calling ? 'Calling...' : 'Start Video Call'}
              </Button>
            )}
          </div>
        ) : (
          <div className="relative">
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="relative aspect-video bg-foreground/5 flex items-center justify-center">
                <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
                {!inCall && (
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full gradient-primary mx-auto mb-3 flex items-center justify-center text-primary-foreground text-2xl font-bold">
                      {selectedPartner?.name.charAt(0)}
                    </div>
                    <p className="text-sm text-muted-foreground">{selectedPartner?.name}</p>
                  </div>
                )}
                <div className="absolute bottom-4 right-4 w-32 h-24 rounded-xl overflow-hidden bg-foreground/10 border border-border">
                  <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                </div>
                {sharing && (
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1">
                    <Monitor className="w-3 h-3" /> Screen sharing
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center gap-3 p-4 bg-card z-10 relative">
                <button onClick={toggleMic} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${!mic ? 'bg-destructive text-destructive-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
                  {mic ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                <button onClick={toggleCamera} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${!camera ? 'bg-destructive text-destructive-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
                  {camera ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
                <button onClick={toggleScreenShare} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${sharing ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
                  <Monitor className="w-5 h-5" />
                </button>
                <button onClick={() => setChatOpen(!chatOpen)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${chatOpen ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
                  <MessageSquare className="w-5 h-5" />
                </button>
                <button onClick={() => { setNotepadOpen(!notepadOpen); setChatOpen(false); }} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${notepadOpen ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
                  <Edit3 className="w-5 h-5" />
                </button>
                <button onClick={endCall} className="w-12 h-12 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                  <PhoneOff className="w-5 h-5" />
                </button>
              </div>
            </div>
            {chatOpen && (
              <motion.div className="absolute top-0 right-0 w-80 h-full glass-card rounded-2xl flex flex-col" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <p className="font-semibold text-sm text-foreground">Chat</p>
                  <button onClick={() => setChatOpen(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
                </div>
                <div className="flex-1 p-4 space-y-2 overflow-y-auto">
                  {messages.map((m, i) => (
                    <div key={i} className={`text-sm p-2 rounded-xl max-w-[80%] ${m.self ? 'ml-auto gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                      {m.text}
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-border flex gap-2">
                  <Input value={msg} onChange={e => setMsg(e.target.value)} placeholder="Message..." className="text-sm" onKeyDown={e => e.key === 'Enter' && sendChat()} />
                  <Button size="sm" onClick={sendChat} className="gradient-primary border-0 text-primary-foreground">Send</Button>
                </div>
              </motion.div>
            )}
            {notepadOpen && (
              <motion.div className="absolute top-0 right-0 w-96 h-full glass-card rounded-2xl flex flex-col z-20" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-primary" />
                    <p className="font-semibold text-sm text-foreground">Shared Notepad</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={clearNotepad} title="Clear board" className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-destructive transition-colors">
                      <Eraser className="w-4 h-4" />
                    </button>
                    <button onClick={() => setNotepadOpen(false)} className="p-1 rounded hover:bg-secondary text-muted-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 p-0 overflow-hidden">
                  <Textarea 
                    value={notepadContent} 
                    onChange={e => handleNotepadChange(e.target.value)} 
                    placeholder="Start typing notes together..." 
                    className="w-full h-full border-0 focus-visible:ring-0 resize-none bg-transparent p-4 text-sm font-sans"
                  />
                </div>
                <div className="p-3 border-t border-border bg-secondary/20">
                  <p className="text-[10px] text-muted-foreground text-center italic">Collaborative real-time board</p>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Incoming Call Overlay */}
        {incomingOffer && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-card p-8 max-w-sm w-full text-center"
            >
              <div className="w-20 h-20 rounded-full gradient-primary mx-auto mb-6 flex items-center justify-center text-primary-foreground text-3xl font-bold animate-pulse">
                {incomingOffer.name.charAt(0)}
              </div>
              <h3 className="text-xl font-bold mb-1">{incomingOffer.name}</h3>
              <p className="text-muted-foreground mb-8 text-sm">Incoming video call...</p>
              
              <div className="flex gap-4">
                <Button 
                  onClick={rejectCall} 
                  variant="destructive" 
                  className="flex-1 rounded-xl h-12"
                >
                  <PhoneOff className="w-4 h-4 mr-2" /> Reject
                </Button>
                <Button 
                  onClick={acceptCall} 
                  className="flex-1 rounded-xl h-12 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Video className="w-4 h-4 mr-2" /> Accept
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}
