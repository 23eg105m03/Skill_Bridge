import { motion } from 'framer-motion';
import { Settings, Bell, Lock, User, Moon, Sun, Shield, HelpCircle } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/components/ThemeProvider';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const handleToggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
    toast.success(`Theme switched to ${theme === 'dark' ? 'light' : 'dark'} mode`);
  };

  const settingsSections = [
    {
      title: 'Appearance',
      icon: theme === 'dark' ? Sun : Moon,
      description: 'Customize how SkillBridge looks on your device.',
      action: (
        <div className="flex items-center gap-4">
          <Label htmlFor="theme-mode" className="text-sm font-medium">
            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </Label>
          <Switch 
            id="theme-mode" 
            checked={theme === 'dark'} 
            onCheckedChange={handleToggleTheme}
          />
        </div>
      )
    },
    {
      title: 'Notifications',
      icon: Bell,
      description: 'Receive alerts for new swap requests and messages.',
      action: <Switch defaultChecked />
    },
    {
      title: 'Privacy & Security',
      icon: Shield,
      description: 'Manage your account security and data privacy.',
      action: <Button variant="outline" size="sm">Manage</Button>
    },
    {
      title: 'Account Settings',
      icon: User,
      description: 'Update your email and password.',
      action: <Button variant="outline" size="sm">Edit</Button>
    },
    {
      title: 'Help & Support',
      icon: HelpCircle,
      description: 'Get help with your account or report an issue.',
      action: <Button variant="outline" size="sm">Get Help</Button>
    }
  ];

  return (
    <AppLayout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Settings className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Settings</h1>
        </div>

        <div className="grid gap-6">
          {settingsSections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-primary/20 transition-colors"
            >
              <div className="flex gap-4">
                <div className="mt-1 p-2 rounded-lg bg-secondary text-secondary-foreground h-fit">
                  <section.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">{section.title}</h3>
                  <p className="text-sm text-muted-foreground max-w-md">{section.description}</p>
                </div>
              </div>
              <div className="flex items-center self-end md:self-center">
                {section.action}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 p-6 rounded-2xl bg-destructive/5 border border-destructive/10">
          <h3 className="text-destructive font-bold mb-2 flex items-center gap-2">
            <Lock className="w-4 h-4" /> Danger Zone
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <Button variant="destructive" className="rounded-xl shadow-lg shadow-destructive/20">
            Delete Account
          </Button>
        </div>
      </motion.div>
    </AppLayout>
  );
}
