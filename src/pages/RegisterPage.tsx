import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Mail, Lock, User, FileText, Eye, EyeOff, ArrowLeft, Sparkles, GraduationCap, Trophy, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', accountType: 'student' as 'student' | 'admin', bio: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { toast.error('Please fill required fields'); return; }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    
    setLoading(true);
    try {
      const { error } = await register(form);
      if (error) { 
        toast.error(error); 
        return; 
      }
      toast.success('Account created! Welcome to SkillBridge.');
    } catch (e: any) {
      toast.error(e.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      {/* Left Side: Animated Illustration (Hidden on mobile) */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex lg:w-1/2 relative bg-primary items-center justify-center p-12 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-blue-800" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]" />
        
        {/* Floating Decorative Icons */}
        <motion.div animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[25%] right-[20%] p-4 glass rounded-2xl">
          <GraduationCap className="w-8 h-8 text-white" />
        </motion.div>
        <motion.div animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} className="absolute bottom-[25%] left-[20%] p-4 glass rounded-2xl">
          <Trophy className="w-8 h-8 text-white" />
        </motion.div>
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute top-[50%] left-[15%] p-4 glass rounded-2xl">
          <Users className="w-8 h-8 text-white" />
        </motion.div>

        <div className="relative z-10 text-center max-w-lg">
          <Link to="/" className="inline-flex items-center gap-2 mb-12 group">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-2xl">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <span className="font-display font-bold text-3xl text-white tracking-tight">SkillBridge</span>
          </Link>
          <h2 className="text-4xl font-black text-white mb-6 leading-tight">Your Journey to Mastery Starts Here.</h2>
          <p className="text-white/70 text-lg font-medium">Join 10k+ students globally exchanging skills and building the future of peer learning.</p>
        </div>
      </motion.div>

      {/* Right Side: Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative overflow-y-auto">
        <div className="absolute top-8 left-8 lg:hidden">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">SkillBridge</span>
          </Link>
        </div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md py-12"
        >
          <div className="glass-card p-8 md:p-10 border-white/20 shadow-premium">
            <div className="mb-10">
              <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:translate-x-[-4px] transition-transform mb-6">
                <ArrowLeft className="w-4 h-4" /> Back to home
              </Link>
              <h1 className="text-3xl font-black text-foreground mb-2">Create Account</h1>
              <p className="text-muted-foreground font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Start your learning adventure
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest ml-1 text-muted-foreground">Full Name</Label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    id="name" 
                    placeholder="John Doe" 
                    value={form.name} 
                    onChange={e => update('name', e.target.value)} 
                    className="h-14 pl-12 rounded-xl bg-muted/30 border-white/10 focus:bg-white transition-all font-medium" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest ml-1 text-muted-foreground">Email Address</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@example.com" 
                    value={form.email} 
                    onChange={e => update('email', e.target.value)} 
                    className="h-14 pl-12 rounded-xl bg-muted/30 border-white/10 focus:bg-white transition-all font-medium" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest ml-1 text-muted-foreground">Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="••••••" 
                      value={form.password} 
                      onChange={e => update('password', e.target.value)} 
                      className="h-14 pl-12 rounded-xl bg-muted/30 border-white/10 focus:bg-white transition-all font-medium px-4" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest ml-1 text-muted-foreground">Confirm</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="••••••" 
                      value={form.confirmPassword} 
                      onChange={e => update('confirmPassword', e.target.value)} 
                      className="h-14 pl-12 rounded-xl bg-muted/30 border-white/10 focus:bg-white transition-all font-medium px-4" 
                    />
                  </div>
                </div>
              </div>

              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="text-xs font-bold text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />} {showPassword ? 'Hide' : 'Show'} Password
              </button>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest ml-1 text-muted-foreground">Account Type</Label>
                <div className="flex gap-3">
                  {(['student', 'admin'] as const).map(t => (
                    <button 
                      key={t} 
                      type="button" 
                      onClick={() => update('accountType', t)}
                      className={`flex-1 h-12 rounded-xl text-sm font-bold transition-all border ${form.accountType === t ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-[1.02]' : 'bg-muted/30 text-muted-foreground border-white/10 hover:bg-muted/50'}`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-xs font-black uppercase tracking-widest ml-1 text-muted-foreground">Brief Bio</Label>
                <div className="relative group">
                  <FileText className="absolute left-4 top-4 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Textarea 
                    id="bio" 
                    placeholder="Tell us about yourself..." 
                    value={form.bio} 
                    onChange={e => update('bio', e.target.value)} 
                    className="pl-12 min-h-[100px] rounded-xl bg-muted/30 border-white/10 focus:bg-white transition-all font-medium resize-none" 
                  />
                </div>
              </div>

              <Button type="submit" className="w-full gradient-primary h-14 rounded-xl text-lg font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all" disabled={loading}>
                {loading ? 'Creating Account...' : 'Get Started Free'}
              </Button>
            </form>

            <div className="mt-10 pt-8 border-t border-white/10 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                Already part of the network? <Link to="/login" className="text-primary font-black hover:underline underline-offset-4">Sign in here</Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
