import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  uid: string;
  username: string;
  avatarUrl: string;
  friendCode: string;
}

export interface Addon {
  id: string;
  name: string;
  url: string;
  iconUrl: string;
  type: 'tool' | 'video' | 'website';
  screenshotUrl?: string;
  showInWorkspaces?: boolean;
}

export interface Friend {
  id: string;
  username: string;
  avatarUrl: string;
  friendCode: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'tool';
  bio?: string;
  categoryId?: string;
  hasCalendar?: boolean;
  enabledTools?: string[];
  enabledAddons?: string[];
}

export interface WorkspaceMember extends Friend {
  role: string;
  isAdmin?: boolean;
  isAssistantAdmin?: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  imageUrl: string;
  roomType?: 'home' | 'office' | 'creative' | 'other';
  members: WorkspaceMember[];
  memberIds: string[];
  bots: string[];
  tools: string[]; // Addon IDs
  videos: string[]; // Addon IDs
  websites: string[]; // Addon IDs
  categories?: Category[];
  channels: Channel[];
  ownerId: string;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: number;
}

export type TabType = 'home' | 'friends' | 'addons' | 'settings' | 'workspaces' | 'private_chat';

export interface AppNotification {
  id: string;
  type: 'workspace_invite' | 'message' | 'system';
  content: string;
  read: boolean;
  timestamp: number;
  relatedId?: string;
}

export interface AppState {
  user: any | null;
  setUser: (user: any | null) => void;
  profile: UserProfile | null;
  setProfile: (profile: UserProfile | null) => void;
  
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  
  notifications: AppNotification[];
  setNotifications: (notifications: AppNotification[]) => void;
  addNotification: (notification: AppNotification) => void;
  markNotificationAsRead: (id: string) => void;
  
  friends: Friend[];
  setFriends: (friends: Friend[]) => void;
  addFriend: (friend: Friend) => void;
  
  incomingRequests: Friend[];
  setIncomingRequests: (requests: Friend[]) => void;
  
  outgoingRequests: string[];
  setOutgoingRequests: (requests: string[]) => void;
  
  addons: Addon[];
  setAddons: (addons: Addon[]) => void;
  addAddon: (addon: Addon) => void;
  
  workspaces: Workspace[];
  setWorkspaces: (workspaces: Workspace[]) => void;
  addWorkspace: (workspace: Workspace) => void;
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (id: string | null) => void;
  
  activePrivateChatId: string | null;
  setActivePrivateChatId: (id: string | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      profile: null,
      setProfile: (profile) => set({ profile }),
      
      activeTab: 'home',
      setActiveTab: (tab) => set({ activeTab: tab }),
      
      notifications: [],
      setNotifications: (notifications) => set({ notifications }),
      addNotification: (notification) => set((state) => ({ notifications: [notification, ...state.notifications] })),
      markNotificationAsRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
      })),
      
      friends: [],
      setFriends: (friends) => set({ friends }),
      addFriend: (friend) => set((state) => ({ friends: [...state.friends, friend] })),
      
      incomingRequests: [],
      setIncomingRequests: (requests) => set({ incomingRequests: requests }),
      
      outgoingRequests: [],
      setOutgoingRequests: (requests) => set({ outgoingRequests: requests }),
      
      addons: [],
      setAddons: (addons) => set({ addons }),
      addAddon: (addon) => set((state) => ({ addons: [...state.addons, addon] })),
      
      workspaces: [],
      setWorkspaces: (workspaces) => set({ workspaces }),
      addWorkspace: (workspace) => set((state) => ({ workspaces: [...state.workspaces, workspace] })),
      activeWorkspaceId: null,
      setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
      
      activePrivateChatId: null,
      setActivePrivateChatId: (id) => set({ activePrivateChatId: id }),
    }),
    {
      name: 'ai-hub-storage',
      partialize: (state) => ({ 
        activeTab: state.activeTab,
      }),
    }
  )
);
