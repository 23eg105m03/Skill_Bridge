import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Video, Mic, FileText, Zap, ArrowRight, Star, Users, BookOpen, Sparkles, Globe, Shield, Zap as ZapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRef } from 'react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.8, ease: "easeOut" as const } }),
};

const features = [
  { icon: Video, title: 'Video Calling', desc: 'Face-to-face learning with HD video calls and screen sharing', color: 'from-blue-500 to-cyan-400' },
  { icon: Mic, title: 'Voice Messaging', desc: 'Send quick voice notes to your learning partners anytime', color: 'from-purple-500 to-pink-500' },
  { icon: FileText, title: 'Notes Sharing', desc: 'Exchange study materials, PDFs, and documents seamlessly', color: 'from-orange-500 to-amber-400' },
  { icon: ZapIcon, title: 'Smart Matching', desc: 'AI-powered algorithm finds your perfect skill exchange partner', color: 'from-green-500 to-emerald-400' },
];

const stats = [
  { icon: Users, label: 'Students', value: '10k+' },
  { icon: Star, label: 'Rating', value: '4.9/5' },
  { icon: Zap, label: 'Swaps', value: '50k+' },
];

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div ref={containerRef} className="min-h-screen bg-background selection:bg-primary/30 selection:text-primary overflow-x-hidden">
      {/* Premium Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 glass-navbar lg:h-20 flex items-center">
        <div className="container mx-auto flex items-center justify-between px-4 md:px-8">
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div 
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/20"
            >
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </motion.div>
            <span className="font-display font-bold text-xl tracking-tight text-foreground group-hover:text-primary transition-colors">SkillBridge</span>
          </Link>
          <div className="hidden md:flex items-center gap-10">
            {['Features', 'How it Works', 'Testimonials'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} 
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-300 relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="font-medium hover:bg-primary/5">Log in</Button>
            </Link>
            <Link to="/register">
              <Button className="gradient-primary border-0 text-primary-foreground shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-52 lg:pb-40 flex items-center justify-center overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 z-0">
          <motion.div 
            style={{ y: y1, opacity }}
            className="absolute top-20 -left-20 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse-subtle" 
          />
          <motion.div 
            style={{ y: y1, opacity }}
            className="absolute bottom-10 -right-20 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] animate-pulse-subtle" 
            transition={{ delay: 1 }}
          />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div 
            initial="hidden" 
            animate="visible"
            className="max-w-4xl mx-auto"
          >
            <motion.div 
              variants={fadeUp} 
              custom={0} 
              className="inline-flex items-center gap-2 px-6 py-2 rounded-full glass border border-white/20 text-sm font-semibold text-primary mb-8 shadow-premium"
            >
              <Sparkles className="w-4 h-4" />
              <span className="animate-pulse-subtle">Transforming Collective Intelligence</span>
            </motion.div>
            
            <motion.h1 
              variants={fadeUp} 
              custom={1} 
              className="text-6xl md:text-8xl font-display font-black tracking-tight leading-[1.05] mb-8 text-foreground"
            >
              Master Any Skill.{' '}
              <span className="gradient-text drop-shadow-sm">Empower Everyone.</span>
            </motion.h1>
            
            <motion.p 
              variants={fadeUp} 
              custom={2} 
              className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 text-balance leading-relaxed"
            >
              The world's most advanced peer-to-peer learning ecosystem. Exchange knowledge, find mentors, and build your future.
            </motion.p>
            
            <motion.div 
              variants={fadeUp} 
              custom={3} 
              className="flex   flex-col sm:flex-row items-center justify-center gap-6"
            >
              <Link to="/register">
                <Button size="lg" className="gradient-primary h-16 px-10 rounded-2xl text-lg font-bold shadow-2xl shadow-primary/40 hover:scale-105 transition-transform group">
                  Join the Network 
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg" className="glass h-16 px-10 rounded-2xl text-lg font-bold border-white/20 hover:bg-white/10 transition-colors">
                  Explore Ecosystem
                </Button>
              </a>
            </motion.div>

            {/* Quick Stats */}
            <motion.div 
              variants={fadeUp} 
              custom={4} 
              className="grid grid-cols-3 gap-4 md:gap-12 mt-20 max-w-2xl mx-auto"
            >
              {stats.map((s) => (
                <div key={s.label} className="text-center group">
                  <p className="text-3xl md:text-4xl font-black text-foreground group-hover:scale-110 transition-transform">{s.value}</p>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Hero Decorative Floating Cards */}
        <div className="hidden xl:block absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div 
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[30%] left-[10%] w-64 glass-card p-6 shadow-2xl rotate-[-6deg] border-white/30"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Video className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold">Live Session</p>
                <p className="text-[10px] text-muted-foreground">React Architecture</p>
              </div>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full w-2/3 bg-blue-500 animate-pulse" />
            </div>
          </motion.div>

          <motion.div 
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-[20%] right-[10%] w-64 glass-card p-6 shadow-2xl rotate-[4deg] border-white/30"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-bold">Smart Match</p>
                <p className="text-[10px] text-muted-foreground">Perfect Partner Found!</p>
              </div>
            </div>
            <div className="flex -space-x-3 overflow-hidden">
              {[1, 2, 3].map(i => (
                <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-200" />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Adaptive Features Section */}
      <section id="features" className="py-24 lg:py-40 relative">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Built for Modern Learning</h2>
            <p className="text-xl text-muted-foreground leading-relaxed">Everything you need to connect, share, and evolve your skills in one unified ecosystem.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <motion.div 
                key={f.title} 
                className="group relative p-8 rounded-3xl glass transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10 overflow-hidden"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${f.color} opacity-[0.03] group-hover:opacity-10 transition-opacity rounded-bl-full`} />
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                  <f.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed font-medium">{f.desc}</p>
                <div className="mt-8 flex items-center gap-2 text-primary font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 text-sm">
                  Learn more <ArrowRight className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Split CTA Section */}
      <section className="py-24 lg:py-40">
        <div className="container mx-auto px-4">
          <motion.div 
            className="relative rounded-[40px] overflow-hidden bg-foreground p-12 lg:p-24"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_-20%,#3b82f6,transparent_70%)]" />
            
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="max-w-2xl text-center lg:text-left">
                <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight">Ready to join the intellectual revolution?</h2>
                <p className="text-xl text-white/60 font-medium mb-12">Start your journey today and connect with thousands of experts and learners worldwide.</p>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 font-bold text-white/80">
                  <span className="flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /> Global Reach</span>
                  <span className="flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /> Secure Exchange</span>
                  <span className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> Smart Matching</span>
                </div>
              </div>
              <div className="shrink-0">
                <Link to="/register">
                  <Button size="lg" className="h-24 px-16 rounded-[32px] bg-white text-black hover:bg-slate-100 text-2xl font-black shadow-2xl transition-all hover:scale-105 active:scale-95">
                    Sign Up Now
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">SkillBridge</span>
          </div>
          <div className="flex items-center gap-8 text-sm font-bold text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors uppercase tracking-widest">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors uppercase tracking-widest">Terms</a>
            <a href="#" className="hover:text-primary transition-colors uppercase tracking-widest">Twitter</a>
            <a href="#" className="hover:text-primary transition-colors uppercase tracking-widest">LinkedIn</a>
          </div>
          <p className="text-sm font-bold text-muted-foreground/50 italic capitalize">Made for curious minds © 2026</p>
        </div>
      </footer>
    </div>
  );
}
