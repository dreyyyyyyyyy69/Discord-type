'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Users, Puzzle, Settings, LayoutGrid, MessageSquare, Bell, Calendar as CalendarIcon, Hash } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';

interface WorkspaceNotification {
  id: string;
  workspaceId: string;
  workspaceName: string;
  channelId: string;
  channelName: string;
  type: 'message' | 'event';
  content: string;
  timestamp: number;
  dateStr?: string;
}

export default function HomeTab() {
  const { setActiveTab, setActiveWorkspaceId, notifications, markNotificationAsRead, user, workspaces } = useStore();
  const [workspaceNotifications, setWorkspaceNotifications] = useState<WorkspaceNotification[]>([]);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(true);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    markNotificationAsRead(id);
    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid, "notifications", id), {
          read: true
        });
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }
  };

  useEffect(() => {
    const fetchWorkspaceNotifications = async () => {
      setIsLoadingNotifs(true);
      const notifs: WorkspaceNotification[] = [];
      const now = Date.now();
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      try {
        for (const workspace of workspaces) {
          for (const channel of workspace.channels) {
            if (channel.type === 'text') {
              const q = query(
                collection(db, "workspaces", workspace.id, "channels", channel.id, "messages"),
                orderBy("timestamp", "desc"),
                limit(1)
              );
              const snapshot = await getDocs(q);
              if (!snapshot.empty) {
                const msg = snapshot.docs[0].data();
                // Show messages from the last 24 hours
                if (now - msg.timestamp < 24 * 60 * 60 * 1000) {
                  notifs.push({
                    id: snapshot.docs[0].id,
                    workspaceId: workspace.id,
                    workspaceName: workspace.name,
                    channelId: channel.id,
                    channelName: channel.name,
                    type: 'message',
                    content: msg.text,
                    timestamp: msg.timestamp
                  });
                }
              }
            }

            if (channel.hasCalendar) {
              const q = query(
                collection(db, "workspaces", workspace.id, "channels", channel.id, "events"),
                where("date", ">=", todayStr)
              );
              const snapshot = await getDocs(q);
              snapshot.docs.forEach(docSnap => {
                const event = docSnap.data();
                notifs.push({
                  id: docSnap.id,
                  workspaceId: workspace.id,
                  workspaceName: workspace.name,
                  channelId: channel.id,
                  channelName: channel.name,
                  type: 'event',
                  content: event.note,
                  timestamp: event.timestamp || now,
                  dateStr: event.date
                });
              });
            }
          }
        }
        notifs.sort((a, b) => b.timestamp - a.timestamp);
        setWorkspaceNotifications(notifs);
      } catch (error) {
        console.error("Error fetching workspace notifications:", error);
      } finally {
        setIsLoadingNotifs(false);
      }
    };

    if (workspaces.length > 0) {
      fetchWorkspaceNotifications();
    } else {
      setIsLoadingNotifs(false);
    }
  }, [workspaces]);

  const groupedWorkspaceNotifs = workspaceNotifications.reduce((acc, notif) => {
    if (!acc[notif.workspaceId]) {
      acc[notif.workspaceId] = {
        workspaceName: notif.workspaceName,
        notifications: []
      };
    }
    acc[notif.workspaceId].notifications.push(notif);
    return acc;
  }, {} as Record<string, { workspaceName: string, notifications: WorkspaceNotification[] }>);

  const features = [
    { id: 'workspaces', name: 'Workspaces', icon: LayoutGrid, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    { id: 'friends', name: 'Friends', icon: Users, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    { id: 'private_chat', name: 'Private Chat', icon: MessageSquare, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    { id: 'addons', name: 'Add-ons', icon: Puzzle, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    { id: 'settings', name: 'Settings', icon: Settings, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-12 text-white/80 custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
            Welcome Home
          </h1>
          <p className="text-white/40 text-lg md:text-xl font-medium">
            Your central hub for everything.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <button
                key={feature.id}
                onClick={() => setActiveTab(feature.id as any)}
                className={`flex flex-col items-center justify-center gap-4 p-8 rounded-[2.5rem] border backdrop-blur-xl transition-all hover:scale-105 shadow-2xl ${feature.color}`}
              >
                <Icon className="w-16 h-16" />
                <span className="text-xl font-black tracking-tight">{feature.name}</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* General Notifications Section */}
          <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 p-8 shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">System Notifications</h2>
                <p className="text-white/40 font-medium">
                  {unreadCount > 0 ? `You have ${unreadCount} unread notifications.` : 'You are all caught up!'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {notifications.length === 0 ? (
                <div className="text-center p-8 border border-white/5 rounded-3xl bg-white/5">
                  <p className="text-white/30 font-medium">No notifications yet.</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 p-5 rounded-3xl border transition-all ${
                      notification.read
                        ? 'bg-white/5 border-white/5 opacity-60'
                        : 'bg-white/10 border-white/20 shadow-xl'
                    }`}
                  >
                    <div className="flex-1">
                      <p className={`font-medium ${notification.read ? 'text-white/60' : 'text-white'}`}>
                        {notification.content}
                      </p>
                      <span className="text-xs text-white/30 mt-2 block uppercase tracking-widest font-black">
                        {new Date(notification.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="text-xs bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-black uppercase tracking-widest transition-colors"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Workspace Notifications Section */}
          <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 p-8 shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                <LayoutGrid className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Workspace Activity</h2>
                <p className="text-white/40 font-medium">
                  Recent messages and upcoming events.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {isLoadingNotifs ? (
                <div className="text-center p-8 border border-white/5 rounded-3xl bg-white/5">
                  <p className="text-white/30 font-medium animate-pulse">Loading activity...</p>
                </div>
              ) : Object.keys(groupedWorkspaceNotifs).length === 0 ? (
                <div className="text-center p-8 border border-white/5 rounded-3xl bg-white/5">
                  <p className="text-white/30 font-medium">No recent activity in your workspaces.</p>
                </div>
              ) : (
                Object.entries(groupedWorkspaceNotifs).map(([workspaceId, data]) => (
                  <div key={workspaceId} className="space-y-3">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      {data.workspaceName}
                    </h3>
                    <div className="space-y-2 pl-4 border-l-2 border-white/5">
                      {data.notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                          onClick={() => {
                            setActiveWorkspaceId(workspaceId);
                            setActiveTab('workspaces');
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {notif.type === 'message' ? (
                              <Hash className="w-4 h-4 text-white/40" />
                            ) : (
                              <CalendarIcon className="w-4 h-4 text-orange-400" />
                            )}
                            <span className="text-sm font-bold text-white/60">{notif.channelName}</span>
                            {notif.type === 'event' && notif.dateStr && (
                              <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-md font-bold ml-auto">
                                {notif.dateStr}
                              </span>
                            )}
                          </div>
                          <p className="text-white/90 font-medium text-sm line-clamp-2">
                            {notif.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
