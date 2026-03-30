import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, LayoutDashboard, Lightbulb, ArrowLeftRight, FileText, Mic, Video, User, Shield, LogOut, Menu, X, Users, Bell, Sun, Moon, ChevronDown, Settings } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/components/ThemeProvider';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';

const studentNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/skills', icon: Lightbulb, label: 'Skills' },
  { to: '/matches', icon: ArrowLeftRight, label: 'Matches' },
  { to: '/swaps', icon: Bell, label: 'Swaps' },
  { to: '/notes', icon: FileText, label: 'Notes' },
  { to: '/voice', icon: Mic, label: 'Voice' },
  { to: '/video', icon: Video, label: 'Video Call' },
];

const adminNavItems = [
  { to: '/admin', icon: Shield, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/swaps', icon: Bell, label: 'Swap Requests' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingSwaps, setPendingSwaps] = useState(0);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  useEffect(() => {
    if (!user) return;
    
    const fetchPending = async () => {
      let query = supabase.from('swap_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending');
      if (user.accountType === 'student') {
        query = query.eq('receiver_id', user.id);
      }
      const { count } = await query;
      setPendingSwaps(count || 0);
    };

    fetchPending();

    const channel = supabase.channel('public:swap_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'swap_requests' }, () => {
        fetchPending();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isAdmin = user?.accountType === 'admin';
  const navItems = isAdmin ? adminNavItems : studentNavItems;

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === '/admin' && location.pathname === '/admin') return true;
    if (path !== '/admin' && location.pathname.startsWith(path) && path !== '/dashboard') return location.pathname === path;
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-white/5 bg-background/30 backdrop-blur-2xl p-4 fixed inset-y-0 left-0 z-40 transition-all duration-300">
        <Link to={isAdmin ? '/admin' : '/dashboard'} className="flex items-center gap-3 px-3 py-6 mb-10">
          <motion.div 
            whileHover={{ rotate: 15, scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-2xl shadow-primary/30"
          >
            <BookOpen className="w-6 h-6 text-primary-foreground" />
          </motion.div>
          <div className="flex flex-col">
            <span className="font-display font-black text-2xl tracking-tight leading-none gradient-text">SkillBridge</span>
            {isAdmin && <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-black mt-1">Admin Portal</span>}
          </div>
        </Link>
        <nav className="flex-1 space-y-3">
          {navItems.map((item, index) => (
            <motion.div
              key={item.to}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08, type: "spring", stiffness: 260, damping: 20 }}
            >
              <Link to={item.to}
                className={`flex items-center justify-between px-5 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 group relative ${isActive(item.to) ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/30 scale-[1.05]' : 'text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:translate-x-2'}`}>
                <div className="flex items-center gap-3 relative z-10">
                  <item.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-125 ${isActive(item.to) ? 'text-primary-foreground' : 'text-primary'}`} />
                  {item.label}
                </div>
                {(item.label === 'Swaps' || item.label === 'Swap Requests') && pendingSwaps > 0 && (
                  <span className="bg-destructive text-destructive-foreground text-[10px] font-black px-2 py-0.5 rounded-lg min-w-[22px] text-center shadow-lg relative z-10">
                    {pendingSwaps}
                  </span>
                )}
                {isActive(item.to) && (
                  <motion.div 
                    layoutId="activeNav"
                    className="absolute inset-0 bg-primary rounded-2xl -z-0"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            </motion.div>
          ))}
        </nav>
        <div className="pt-6 mt-auto border-t border-white/5">
          <Button variant="ghost" onClick={toggleTheme} className="w-full justify-start gap-3 rounded-2xl py-6 hover:bg-primary/10 hover:text-primary transition-all duration-300">
            {theme === "dark" ? <Sun className="w-5 h-5 text-amber-400 animate-pulse" /> : <Moon className="w-5 h-5 text-indigo-500" />}
            <span className="font-bold">{theme === "dark" ? "Switch to Light" : "Switch to Dark"}</span>
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Sticky Top Header */}
        <header className="glass-navbar px-4 md:px-10 h-20 flex items-center justify-between transition-all duration-500">
          <div className="lg:hidden">
            <Link to={isAdmin ? '/admin' : '/dashboard'} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-black text-xl tracking-tight gradient-text">SkillBridge</span>
            </Link>
          </div>
          
          <div className="hidden lg:block">
            <h2 className="text-base font-medium text-muted-foreground">
              Hello, <span className="text-foreground font-black text-lg gradient-text">{user?.fullName?.split(' ')[0]}</span> <motion.span animate={{ rotate: [0, 20, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="inline-block">👋</motion.span>
            </h2>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <Link to={isAdmin ? '/admin/swaps' : '/swaps'} className="relative group p-2.5 rounded-2xl hover:bg-primary/10 transition-all duration-300">
              <Bell className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-all duration-300 group-hover:rotate-12" />
              {pendingSwaps > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white text-[10px] font-black flex items-center justify-center rounded-lg shadow-lg border-2 border-background animate-bounce">
                  {pendingSwaps}
                </span>
              )}
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 p-1.5 pl-1.5 pr-4 rounded-2xl hover:bg-primary/10 transition-all duration-500 group border border-transparent hover:border-primary/20 shadow-none hover:shadow-xl hover:shadow-primary/5">
                  <Avatar className="w-10 h-10 border-2 border-primary/20 group-hover:border-primary group-hover:scale-105 transition-all duration-500 shadow-lg">
                    <AvatarImage src={user?.avatarUrl} />
                    <AvatarFallback className="gradient-primary text-primary-foreground font-black">{user?.fullName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-black leading-none group-hover:text-primary transition-colors">{user?.fullName}</p>
                    <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-bold mt-1 capitalize">{user?.accountType}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-all duration-300 group-hover:rotate-180" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass-card p-2">
                <DropdownMenuLabel className="font-normal p-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={() => navigate('/profile')} className="rounded-lg gap-2 cursor-pointer focus:bg-primary/10">
                  <User className="w-4 h-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')} className="rounded-lg gap-2 cursor-pointer focus:bg-primary/10">
                  <Settings className="w-4 h-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={handleLogout} className="rounded-lg gap-2 cursor-pointer text-destructive focus:bg-destructive/10">
                  <LogOut className="w-4 h-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-full hover:bg-white/5 transition-colors">
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden glass-navbar border-t border-white/5 overflow-hidden"
            >
              <nav className="p-4 space-y-1">
                {navItems.map(item => (
                  <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive(item.to) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-white/5'}`}>
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" /> {item.label}
                    </div>
                  </Link>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.98 }}
              transition={{ 
                duration: 0.5, 
                type: "spring", 
                stiffness: 260, 
                damping: 25 
              }}
              className="w-full h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
