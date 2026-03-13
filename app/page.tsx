'use client';

import { useStore } from '@/store/useStore';
import AuthGuard from '@/components/AuthGuard';
import Navigation from '@/components/Navigation';
import HomeTab from '@/components/HomeTab';
import FriendsTab from '@/components/FriendsTab';
import AddonsTab from '@/components/AddonsTab';
import SettingsTab from '@/components/SettingsTab';
import WorkspacesTab from '@/components/WorkspacesTab';
import PrivateChatTab from '@/components/PrivateChatTab';
import { useEffect, useState } from 'react';

export default function Home() {
  const { activeTab } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <AuthGuard>
      <main className="flex flex-col h-screen w-full overflow-hidden bg-transparent text-white font-sans relative z-10">
        {activeTab !== 'home' && <Navigation />}
        
        {activeTab === 'home' && <HomeTab />}
        {activeTab === 'friends' && <FriendsTab />}
        {activeTab === 'addons' && <AddonsTab />}
        {activeTab === 'settings' && <SettingsTab />}
        {activeTab === 'workspaces' && <WorkspacesTab />}
        {activeTab === 'private_chat' && <PrivateChatTab />}
      </main>
    </AuthGuard>
  );
}
