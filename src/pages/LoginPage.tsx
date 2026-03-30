import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Mail, Lock, Eye, EyeOff, ArrowLeft, Sparkles, Zap, Shield, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    
    try {
      const { error } = await login(email, password);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success('Welcome back!');
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
        <motion.div animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[20%] left-[20%] p-4 glass rounded-2xl">
          <Zap className="w-8 h-8 text-white" />
        </motion.div>
        <motion.div animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute bottom-[20%] right-[20%] p-4 glass rounded-2xl">
          <Video className="w-8 h-8 text-white" />
        </motion.div>
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[50%] right-[10%] p-4 glass rounded-2xl">
          <Shield className="w-8 h-8 text-white" />
        </motion.div>

        <div className="relative z-10 text-center max-w-lg">
          <Link to="/" className="inline-flex items-center gap-2 mb-12 group">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-2xl">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <span className="font-display font-bold text-3xl text-white tracking-tight">SkillBridge</span>
          </Link>
          <h2 className="text-4xl font-black text-white mb-6 leading-tight">Elevate Your Knowledge Through Collaboration.</h2>
          <p className="text-white/70 text-lg font-medium">Join the world's most advanced peer-to-peer learning network and start your intellectual revolution today.</p>
        </div>
      </motion.div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
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
          className="w-full max-w-md"
        >
          <div className="glass-card p-8 md:p-10 border-white/20 shadow-premium">
            <div className="mb-10">
              <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:translate-x-[-4px] transition-transform mb-6">
                <ArrowLeft className="w-4 h-4" /> Back to home
              </Link>
              <h1 className="text-3xl font-black text-foreground mb-2">Welcome Back</h1>
              <p className="text-muted-foreground font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Enter your credentials to continue
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest ml-1 text-muted-foreground">Email Address</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@company.com" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="h-14 pl-12 rounded-xl bg-muted/30 border-white/10 focus:bg-white transition-all font-medium" 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest ml-1 text-muted-foreground">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    id="password" 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="h-14 pl-12 pr-12 rounded-xl bg-muted/30 border-white/10 focus:bg-white transition-all font-medium" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Link to="/forgot-password" size="sm" className="text-xs font-bold text-primary hover:underline underline-offset-4">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full gradient-primary h-14 rounded-xl text-lg font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all" disabled={loading}>
                {loading ? 'Authenticating...' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-10 pt-8 border-t border-white/10 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                New to the platform? <Link to="/register" className="text-primary font-black hover:underline underline-offset-4">Create an account</Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
