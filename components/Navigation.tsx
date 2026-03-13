'use client';

import { useStore, TabType } from '@/store/useStore';
import { Users, Link as LinkIcon, Settings, LayoutGrid, MessageCircle, Home } from 'lucide-react';
import { motion } from 'motion/react';

export default function Navigation() {
  const { activeTab, setActiveTab } = useStore();

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-6 h-6" /> },
    { id: 'friends', label: 'Friends', icon: <Users className="w-6 h-6" /> },
    { id: 'addons', label: 'Addons', icon: <LinkIcon className="w-6 h-6" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-6 h-6" /> },
    { id: 'workspaces', label: 'Workspaces', icon: <LayoutGrid className="w-6 h-6" /> },
    { id: 'private_chat', label: 'Private Chat', icon: <MessageCircle className="w-6 h-6" /> },
  ];

  return (
    <div className="w-full flex justify-center py-6 px-4 shrink-0 z-20 relative">
      <div className="flex items-center gap-1 bg-white/5 backdrop-blur-2xl p-1.5 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.4)] border border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-white/10 blur-[60px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-white/5 blur-[60px] rounded-full pointer-events-none" />
        
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center w-14 h-10 sm:w-24 sm:h-14 rounded-[1.2rem] sm:rounded-[2rem] transition-all duration-700 group ${
                isActive ? 'text-white' : 'text-white/20 hover:text-white/60'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white/10 backdrop-blur-3xl rounded-[1.2rem] sm:rounded-[2rem] border border-white/20 shadow-[inset_0_0_30px_rgba(255,255,255,0.1),0_10px_30px_rgba(0,0,0,0.2)]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <div className="relative z-10 flex flex-col items-center gap-0 sm:gap-1">
                <div className={`transition-all duration-700 scale-[0.6] sm:scale-100 ${isActive ? 'scale-[0.7] sm:scale-110 drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]' : 'scale-[0.6] sm:scale-100 group-hover:scale-[0.7] sm:group-hover:scale-105'}`}>
                  {tab.icon}
                </div>
                <span className={`text-[6px] sm:text-[9px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] transition-all duration-700 ${isActive ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'}`}>
                  {tab.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
