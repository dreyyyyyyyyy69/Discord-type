'use client';

import { useState, useRef, useEffect } from 'react';
import { useStore, Workspace, Channel, Category, WorkspaceMember } from '@/store/useStore';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, doc, setDoc, updateDoc, limit, Timestamp, where, deleteDoc } from 'firebase/firestore';
import { LayoutGrid, Plus, Hash, Mic, Bot, Link as LinkIcon, Users, Video, Phone, Upload, Sparkles, Loader2, Image as ImageIcon, X, Settings2, Send, User, Calendar, Check, Calculator, FileText, Newspaper, Grid, ExternalLink, Shield, ShieldAlert, UserMinus, Trash2, Youtube, Globe } from 'lucide-react';
import Image from 'next/image';
import { GoogleGenAI } from "@google/genai";
import { compressImage } from '@/lib/utils';
import { evaluate } from 'mathjs';

const BASIC_TOOLS = [
  { id: 'calendar', name: 'Calendar', icon: Calendar, description: 'Schedule and view upcoming events.' },
  { id: 'calculator', name: 'Calculator', icon: Calculator, description: 'Quick calculations.' },
  { id: 'notes', name: 'Notes', icon: FileText, description: 'Keep track of information.' },
  { id: 'news', name: 'Daily News', icon: Newspaper, description: 'Stay updated with news.' },
  { id: 'bot', name: 'Helping Bot', icon: Bot, description: 'An AI assistant.' },
];

const DEFAULT_ROLES = [
  'Graphic Designer',
  'Writer',
  'Creative',
  'Head',
  'Producer',
  'Editor',
  'Member'
];

const ROOM_TYPES = [
  { id: 'home', name: 'Home', icon: Hash },
  { id: 'office', name: 'Office', icon: LayoutGrid },
  { id: 'creative', name: 'Creative Studio', icon: Sparkles },
  { id: 'other', name: 'Other', icon: Grid },
];

const CalculatorTool = () => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  
  const handleNumber = (num: string) => {
    setDisplay(prev => prev === '0' ? num : prev + num);
  };
  
  const handleOp = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };
  
  const calculate = () => {
    try {
      const result = evaluate(equation + display);
      setDisplay(String(result));
      setEquation('');
    } catch (e) {
      setDisplay('Error');
    }
  };
  
  const clear = () => {
    setDisplay('0');
    setEquation('');
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/10 shadow-2xl w-full max-w-sm mx-auto mt-12">
      <div className="mb-8 text-right">
        <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] h-4 mb-1">{equation}</div>
        <div className="text-5xl font-black text-white tracking-tighter truncate">{display}</div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {['7', '8', '9', '/'].map(btn => (
          <button key={btn} onClick={() => isNaN(Number(btn)) ? handleOp(btn) : handleNumber(btn)} className="p-6 bg-white/5 hover:bg-white/10 rounded-2xl font-black text-white transition-all text-xl border border-white/5">{btn}</button>
        ))}
        {['4', '5', '6', '*'].map(btn => (
          <button key={btn} onClick={() => isNaN(Number(btn)) ? handleOp(btn) : handleNumber(btn)} className="p-6 bg-white/5 hover:bg-white/10 rounded-2xl font-black text-white transition-all text-xl border border-white/5">{btn}</button>
        ))}
        {['1', '2', '3', '-'].map(btn => (
          <button key={btn} onClick={() => isNaN(Number(btn)) ? handleOp(btn) : handleNumber(btn)} className="p-6 bg-white/5 hover:bg-white/10 rounded-2xl font-black text-white transition-all text-xl border border-white/5">{btn}</button>
        ))}
        {['C', '0', '=', '+'].map(btn => (
          <button key={btn} onClick={() => btn === 'C' ? clear() : btn === '=' ? calculate() : isNaN(Number(btn)) ? handleOp(btn) : handleNumber(btn)} className={`p-6 rounded-2xl font-black text-white transition-all text-xl border ${btn === '=' ? 'bg-white/20 hover:bg-white/30 border-white/20 shadow-xl' : 'bg-white/5 hover:bg-white/10 border-white/5'}`}>{btn}</button>
        ))}
      </div>
    </div>
  );
};

const NotesTool = ({ workspaceId, channelId }: { workspaceId: string, channelId: string }) => {
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "workspaces", workspaceId, "channels", channelId, "tools", "notes"), (doc) => {
      if (doc.exists()) {
        setNote(doc.data().content || '');
      }
    });
    return () => unsubscribe();
  }, [workspaceId, channelId]);

  const saveNote = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, "workspaces", workspaceId, "channels", channelId, "tools", "notes"), {
        content: note,
        updatedAt: Timestamp.now()
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/5 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10">
            <FileText className="w-6 h-6 text-white/40" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white tracking-tight">Channel Notes</h3>
            <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Collaborative workspace notes</p>
          </div>
        </div>
        <button 
          onClick={saveNote}
          disabled={isSaving}
          className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/20 disabled:opacity-50 shadow-xl"
        >
          {isSaving ? 'Saving...' : 'Save Notes'}
        </button>
      </div>
      <textarea 
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="flex-1 bg-white/5 rounded-[2.5rem] p-10 text-white/80 font-medium leading-relaxed focus:outline-none border border-white/10 resize-none custom-scrollbar text-lg shadow-2xl"
        placeholder="Start writing notes for this channel..."
      />
    </div>
  );
};

const NewsTool = () => {
  const [news, setNews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      const mockNews = [
        { id: 1, title: 'AI Breakthrough in Quantum Computing', summary: 'Researchers have achieved a new milestone in quantum error correction, paving the way for more stable quantum computers.', category: 'Tech', time: '2h ago' },
        { id: 2, title: 'Global Markets Rally on Economic Data', summary: 'Stock indices reached record highs today after positive inflation reports and strong consumer spending data.', category: 'Finance', time: '4h ago' },
        { id: 3, title: 'New Sustainable Energy Record', summary: 'Solar and wind power contributed to a record 40% of global electricity in 2025, according to a new report.', category: 'Environment', time: '6h ago' },
        { id: 4, title: 'SpaceX Successfully Launches Mars Probe', summary: 'The latest mission to the Red Planet has successfully entered orbit and begun its scientific observations.', category: 'Science', time: '8h ago' },
      ];
      setNews(mockNews);
      setIsLoading(false);
    };
    fetchNews();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4 mb-12">
        <div className="w-16 h-16 bg-white/5 backdrop-blur-xl rounded-[2rem] flex items-center justify-center border border-white/10 rotate-3 shadow-2xl">
          <Newspaper className="w-8 h-8 text-white/40" />
        </div>
        <div>
          <h3 className="text-3xl font-black text-white tracking-tight">Daily News Feed</h3>
          <p className="text-white/40 font-medium">Stay updated with the latest global headlines.</p>
        </div>
      </div>
      <div className="grid gap-6">
        {news.map(item => (
          <div key={item.id} className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 hover:bg-white/10 transition-all group cursor-pointer shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">{item.category}</span>
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">{item.time}</span>
            </div>
            <h4 className="text-2xl font-black text-white mb-3 group-hover:text-white transition-colors tracking-tight leading-tight">{item.title}</h4>
            <p className="text-white/40 font-medium leading-relaxed text-lg">{item.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function WorkspacesTab() {
  const { workspaces, setWorkspaces, activeWorkspaceId, setActiveWorkspaceId, friends, addons, user, profile } = useStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [wsImageUrl, setWsImageUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [selectedRoomType, setSelectedRoomType] = useState<string>('office');
  const [isEditingWorkspaceSettings, setIsEditingWorkspaceSettings] = useState(false);
  const [isAddonHubModalOpen, setIsAddonHubModalOpen] = useState(false);
  const [isPickingAddons, setIsPickingAddons] = useState(false);
  const [addonPickerType, setAddonPickerType] = useState<'tool' | 'video' | 'website'>('tool');
  const [activeWorkspaceAddonId, setActiveWorkspaceAddonId] = useState<string | null>(null);
  const [customChannels, setCustomChannels] = useState<{name: string, type: Channel['type']}[]>([]);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState<Channel['type']>('text');
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showMobileMembers, setShowMobileMembers] = useState(false);
  
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isEditingChannelSettings, setIsEditingChannelSettings] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newEventNote, setNewEventNote] = useState('');
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const wsAddons = activeWorkspace ? addons.filter(a => activeWorkspace.tools.includes(a.id)) : [];
  const currentUser = activeWorkspace?.members.find(m => m.id === user?.uid);
  const isCurrentUserAdmin = currentUser?.isAdmin;
  const isCurrentUserAssistant = currentUser?.isAssistantAdmin;
  const activeChannel = activeWorkspaceAddonId ? null : (activeWorkspace?.channels.find(c => c.id === activeChannelId) || activeWorkspace?.channels[0]);
  const activeWorkspaceAddon = addons.find(a => a.id === activeWorkspaceAddonId);

  // Fetch channel messages real-time
  useEffect(() => {
    if (!activeWorkspaceId || !activeChannel) return;

    const q = query(
      collection(db, "workspaces", activeWorkspaceId, "channels", activeChannel.id, "messages"),
      orderBy("timestamp", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse();
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [activeWorkspaceId, activeChannel]);

  // Bot Response Logic
  const lastProcessedMessageId = useRef<string | null>(null);

  useEffect(() => {
    if (!activeChannel?.enabledTools?.includes('bot')) return;
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.senderId !== user?.uid) return;
    if (lastProcessedMessageId.current === lastMessage.id) return;

    lastProcessedMessageId.current = lastMessage.id;

    const handleBotResponse = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{ parts: [{ text: `You are a helpful assistant in a channel named #${activeChannel.name}. The user said: ${lastMessage.text}. Provide a helpful, concise response.` }] }],
        });

        const botText = response.text || "I'm not sure how to help with that.";

        await addDoc(collection(db, "workspaces", activeWorkspaceId!, "channels", activeChannel.id, "messages"), {
          text: botText,
          senderId: 'helper-bot',
          senderName: 'HelperBot',
          senderAvatar: null,
          timestamp: Timestamp.now()
        });
      } catch (error) {
        console.error("Bot response error:", error);
      }
    };

    const timer = setTimeout(handleBotResponse, 1000);
    return () => clearTimeout(timer);
  }, [messages, activeChannel, activeWorkspaceId, user]);

  // Fetch calendar events real-time
  useEffect(() => {
    if (!activeWorkspaceId || !activeChannel || !activeChannel.hasCalendar) return;

    const q = query(collection(db, "workspaces", activeWorkspaceId, "channels", activeChannel.id, "events"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const evts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCalendarEvents(evts);
    });

    return () => unsubscribe();
  }, [activeWorkspaceId, activeChannel]);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventNote.trim() || !selectedDate || !user || !activeWorkspaceId || !activeChannel) return;

    setIsAddingEvent(true);
    try {
      await addDoc(collection(db, "workspaces", activeWorkspaceId, "channels", activeChannel.id, "events"), {
        date: selectedDate,
        note: newEventNote.trim(),
        createdBy: user.uid,
        creatorName: profile?.username || 'Unknown',
        timestamp: Timestamp.now(),
      });
      setNewEventNote('');
      setSelectedDate(null);
    } catch (error) {
      console.error("Error adding event:", error);
    } finally {
      setIsAddingEvent(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !activeWorkspaceId || !activeChannel || isSending) return;

    setIsSending(true);
    try {
      await addDoc(collection(db, "workspaces", activeWorkspaceId, "channels", activeChannel.id, "messages"), {
        text: newMessage.trim(),
        senderId: user.uid,
        senderName: profile?.username || 'Unknown',
        senderAvatar: profile?.avatarUrl || '',
        timestamp: Timestamp.now(),
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleChatImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !activeWorkspaceId || !activeChannel || isSending) return;

    setIsSending(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const compressed = await compressImage(base64, 800, 800, 0.6);

        await addDoc(collection(db, "workspaces", activeWorkspaceId, "channels", activeChannel.id, "messages"), {
          image: compressed,
          senderId: user.uid,
          senderName: profile?.username || 'Unknown',
          senderAvatar: profile?.avatarUrl || '',
          timestamp: Timestamp.now(),
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error sending chat image:", error);
    } finally {
      setIsSending(false);
      if (chatFileInputRef.current) chatFileInputRef.current.value = '';
    }
  };

  const generateAIWorkspaceImage = async () => {
    if (!newWsName.trim()) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: `A professional, high-quality workspace banner or logo for a community named ${newWsName}. Abstract, modern, collaborative theme.`,
            },
          ],
        },
      });
      
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64 = `data:image/png;base64,${part.inlineData.data}`;
          const compressed = await compressImage(base64, 800, 400, 0.6);
          setWsImageUrl(compressed);
          break;
        }
      }
    } catch (error) {
      console.error('Error generating image:', error);
      setWsImageUrl(`https://picsum.photos/seed/${newWsName}/400/200`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const compressed = await compressImage(base64, 800, 400, 0.6);
        setWsImageUrl(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const addCustomChannel = () => {
    if (!newChannelName.trim()) return;
    setCustomChannels([...customChannels, { name: newChannelName.trim().toLowerCase().replace(/\s+/g, '-'), type: newChannelType }]);
    setNewChannelName('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim() || !user) return;

    const wsMembers: WorkspaceMember[] = friends
      .filter(f => selectedFriends.includes(f.id))
      .map(f => ({ ...f, role: 'Member' }));
    
    // Add creator as Admin
    wsMembers.push({
      id: user.uid,
      username: profile?.username || user.displayName || 'Me',
      avatarUrl: profile?.avatarUrl || user.photoURL || '',
      friendCode: profile?.friendCode || '',
      role: 'Admin',
      isAdmin: true
    });

    const wsAddons = addons.filter(a => selectedAddons.includes(a.id));
    const tools = wsAddons.filter(a => a.type === 'tool').map(a => a.id);
    const videos = wsAddons.filter(a => a.type === 'video').map(a => a.id);
    const websites = wsAddons.filter(a => a.type === 'website').map(a => a.id);

    const defaultCategories: Category[] = [
      { id: 'cat-general', name: 'General' },
      { id: 'cat-voice', name: 'Voice Channels' }
    ];

    const defaultChannels: Channel[] = [
      { id: 'general', name: 'general', type: 'text', categoryId: 'cat-general' },
      { id: 'voice-lounge', name: 'Voice Lounge', type: 'voice', categoryId: 'cat-voice' },
    ];

    const newWs: Workspace = {
      id: Date.now().toString(),
      name: newWsName.trim(),
      imageUrl: wsImageUrl || `https://picsum.photos/seed/${newWsName}/400/200`,
      roomType: selectedRoomType as any,
      members: wsMembers,
      memberIds: wsMembers.map(m => m.id),
      bots: ['HelperBot', 'MusicBot'],
      tools,
      videos,
      websites,
      categories: defaultCategories,
      channels: [...defaultChannels, ...customChannels.map((c, idx) => ({ id: `custom-${idx}-${Date.now()}`, name: c.name, type: c.type, categoryId: 'cat-general' }))],
      ownerId: user.uid
    };

    try {
      await setDoc(doc(db, "workspaces", newWs.id), newWs);
      
      // Send notifications to friends
      const wsFriends = friends.filter(f => selectedFriends.includes(f.id));
      for (const friend of wsFriends) {
        await addDoc(collection(db, "users", friend.id, "notifications"), {
          type: 'workspace_invite',
          content: `${profile?.username || 'A friend'} added you to the workspace "${newWs.name}".`,
          read: false,
          timestamp: Date.now(),
          relatedId: newWs.id
        });
      }

      setIsCreating(false);
      setNewWsName('');
      setWsImageUrl('');
      setSelectedFriends([]);
      setSelectedAddons([]);
      setCustomChannels([]);
      setActiveWorkspaceId(newWs.id);
    } catch (error) {
      console.error("Error creating workspace:", error);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !activeWorkspaceId || !activeWorkspace) return;

    const currentUser = activeWorkspace.members.find(m => m.id === user?.uid);
    if (!currentUser?.isAdmin && !currentUser?.isAssistantAdmin) {
      alert("You don't have permission to create categories.");
      return;
    }

    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: newCategoryName.trim()
    };

    try {
      await updateDoc(doc(db, "workspaces", activeWorkspaceId), {
        categories: [...(activeWorkspace.categories || []), newCategory]
      });
      setIsCreatingCategory(false);
      setNewCategoryName('');
    } catch (error) {
      console.error("Error creating category:", error);
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim() || !activeWorkspaceId || !activeWorkspace) return;

    const currentUser = activeWorkspace.members.find(m => m.id === user?.uid);
    if (!currentUser?.isAdmin && !currentUser?.isAssistantAdmin) {
      alert("You don't have permission to create channels.");
      return;
    }

    const newChannel: Channel = {
      id: `ch-${Date.now()}`,
      name: newChannelName.trim().toLowerCase().replace(/\s+/g, '-'),
      type: newChannelType as any,
      categoryId: selectedCategoryId || undefined,
      hasCalendar: false
    };

    try {
      await updateDoc(doc(db, "workspaces", activeWorkspaceId), {
        channels: [...activeWorkspace.channels, newChannel]
      });
      setIsCreatingChannel(false);
      setNewChannelName('');
      setNewChannelType('text');
      setSelectedCategoryId(null);
    } catch (error) {
      console.error("Error creating channel:", error);
    }
  };

  const handleUpdateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChannel || !activeWorkspaceId || !activeWorkspace) {
      console.error("Missing data:", { editingChannel, activeWorkspaceId, activeWorkspace });
      return;
    }

    const updatedChannels = activeWorkspace.channels.map(c => 
      c.id === editingChannel.id ? editingChannel : c
    );

    console.log("Updating channel:", { activeWorkspaceId, editingChannel, activeWorkspaceChannels: activeWorkspace.channels });

    try {
      await updateDoc(doc(db, "workspaces", activeWorkspaceId), {
        channels: updatedChannels
      });
      console.log("Channel updated successfully");
      setIsEditingChannelSettings(false);
      setEditingChannel(null);
    } catch (error) {
      console.error("Error updating channel:", error);
    }
  };

  if (isCreating) {
    return (
      <div className="flex-1 bg-transparent p-4 sm:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-2xl p-6 sm:p-10 rounded-2xl sm:rounded-[2.5rem] border border-white/10 shadow-2xl">
          <h2 className="text-xl sm:text-3xl font-black text-white mb-6 sm:mb-10 flex items-center gap-2 sm:gap-3 tracking-tight">
            <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-white/60" /> Create Workspace
          </h2>
          
          <form onSubmit={handleCreate} className="space-y-6 sm:space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
              {/* Left Column: Identity */}
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <label className="block text-[9px] sm:text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 sm:mb-3">Workspace Name</label>
                  <input
                    type="text"
                    value={newWsName}
                    onChange={(e) => setNewWsName(e.target.value)}
                    className="w-full bg-white/5 text-white placeholder:text-white/20 rounded-xl sm:rounded-2xl p-3 sm:p-5 focus:outline-none focus:ring-2 focus:ring-white/20 border border-white/10 backdrop-blur-md text-base sm:text-xl font-black tracking-tight"
                    placeholder="Enter name..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-[9px] sm:text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 sm:mb-3">Room Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {ROOM_TYPES.map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setSelectedRoomType(type.id)}
                        className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${selectedRoomType === type.id ? 'bg-white/10 border-white/20 shadow-xl' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${selectedRoomType === type.id ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40'}`}>
                          <type.icon className="w-5 h-5" />
                        </div>
                        <div className="text-xs font-black text-white tracking-tight">{type.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] sm:text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 sm:mb-3">Workspace Image</label>
                  <div className="relative h-32 sm:h-48 bg-white/5 rounded-xl sm:rounded-[2rem] border-2 border-dashed border-white/10 overflow-hidden group backdrop-blur-md">
                    {wsImageUrl ? (
                      <Image src={wsImageUrl} alt="Workspace" fill className="object-cover" unoptimized referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white/20">
                        <ImageIcon className="w-8 h-8 sm:w-12 sm:h-12 mb-2 sm:mb-3" />
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Upload or Generate</span>
                      </div>
                    )}
                    {isGenerating && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-white animate-spin" />
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 flex gap-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 sm:p-3 bg-white/10 hover:bg-white/20 text-white rounded-lg sm:rounded-xl backdrop-blur-xl border border-white/20 transition-all shadow-xl"
                      >
                        <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                      </button>
                      <button
                        type="button"
                        onClick={generateAIWorkspaceImage}
                        disabled={isGenerating || !newWsName.trim()}
                        className="p-2 sm:p-3 bg-white/20 hover:bg-white/30 text-white rounded-lg sm:rounded-xl backdrop-blur-xl border border-white/30 transition-all disabled:opacity-50 shadow-xl"
                      >
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] sm:text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 sm:mb-3">Add Friends</label>
                  <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-[2rem] p-3 sm:p-4 max-h-40 sm:max-h-56 overflow-y-auto space-y-1 sm:space-y-2 custom-scrollbar backdrop-blur-md">
                    {friends.length === 0 ? <p className="text-white/20 p-2 sm:p-4 text-xs italic font-medium">No friends.</p> : friends.map(f => (
                      <label key={f.id} className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 hover:bg-white/5 rounded-xl sm:rounded-2xl cursor-pointer transition-all group">
                        <input 
                          type="checkbox" 
                          checked={selectedFriends.includes(f.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedFriends([...selectedFriends, f.id]);
                            else setSelectedFriends(selectedFriends.filter(id => id !== f.id));
                          }}
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg sm:rounded-xl border-white/10 text-white focus:ring-white/20 bg-white/5"
                        />
                        {f.avatarUrl && (
                          <Image src={f.avatarUrl} alt="" width={24} height={24} className="rounded-lg border border-white/10" unoptimized referrerPolicy="no-referrer" />
                        )}
                        <span className="text-white font-black text-xs sm:text-sm tracking-tight group-hover:translate-x-1 transition-transform">{f.username}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Channels & Tools */}
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <label className="block text-[9px] sm:text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 sm:mb-3">Custom Channels</label>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex gap-2 sm:gap-3">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={newChannelName}
                          onChange={(e) => setNewChannelName(e.target.value)}
                          placeholder="new-channel"
                          className="w-full bg-white/5 text-white placeholder:text-white/20 rounded-xl sm:rounded-2xl pl-10 sm:pl-12 pr-4 sm:pr-5 py-3 sm:py-3.5 focus:outline-none border border-white/10 backdrop-blur-md font-black tracking-tight text-sm"
                        />
                        <Hash className="w-4 h-4 sm:w-5 sm:h-5 text-white/20 absolute left-3 sm:left-4 top-3.5 sm:top-4" />
                      </div>
                      <select 
                        value={newChannelType}
                        onChange={(e) => setNewChannelType(e.target.value as any)}
                        className="bg-white/5 text-white rounded-xl sm:rounded-2xl px-2 sm:px-4 border border-white/10 text-[9px] sm:text-xs font-black uppercase tracking-widest backdrop-blur-md"
                      >
                        <option value="text">Text</option>
                        <option value="voice">Voice</option>
                        <option value="calendar">Calendar</option>
                      </select>
                      <button 
                        type="button"
                        onClick={addCustomChannel}
                        className="bg-white/10 text-white p-3 sm:p-3.5 rounded-xl sm:rounded-2xl hover:bg-white/20 border border-white/20 shadow-xl transition-all"
                      >
                        <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      <span className="bg-white/10 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 sm:gap-2 border border-white/10 shadow-xl">
                        <Hash className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> general
                      </span>
                      <span className="bg-white/10 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 sm:gap-2 border border-white/10 shadow-xl">
                        <Mic className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Voice Lounge
                      </span>
                      <span className="bg-white/10 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 sm:gap-2 border border-white/10 shadow-xl">
                        <Bot className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> AI Tools
                      </span>
                      {customChannels.map((c, i) => (
                        <span key={i} className="bg-white/20 text-white border border-white/30 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 sm:gap-2 shadow-2xl animate-in zoom-in-90">
                          {c.type === 'text' ? <Hash className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Mic className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                          {c.name}
                          <button onClick={() => setCustomChannels(customChannels.filter((_, idx) => idx !== i))} className="hover:text-white/60 transition-colors">
                            <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] sm:text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 sm:mb-3">Share AI Tools</label>
                  <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-[2rem] p-3 sm:p-4 max-h-40 sm:max-h-56 overflow-y-auto space-y-1 sm:space-y-2 custom-scrollbar backdrop-blur-md">
                    {addons.length === 0 ? <p className="text-white/20 p-2 sm:p-4 text-xs italic font-medium">No tools.</p> : addons.map(a => (
                      <label key={a.id} className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 hover:bg-white/5 rounded-xl sm:rounded-2xl cursor-pointer transition-all group">
                        <input 
                          type="checkbox" 
                          checked={selectedAddons.includes(a.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedAddons([...selectedAddons, a.id]);
                            else setSelectedAddons(selectedAddons.filter(id => id !== a.id));
                          }}
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg sm:rounded-xl border-white/10 text-white focus:ring-white/20 bg-white/5"
                        />
                        {a.iconUrl && (
                          <Image src={a.iconUrl} alt="" width={24} height={24} className="rounded-lg border border-white/10" unoptimized referrerPolicy="no-referrer" />
                        )}
                        <span className="text-white font-black text-xs sm:text-sm tracking-tight group-hover:translate-x-1 transition-transform">{a.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 sm:gap-6 pt-6 sm:pt-10 border-t border-white/10">
              <button type="button" onClick={() => setIsCreating(false)} className="flex-1 py-3 sm:py-5 text-white/40 font-black uppercase tracking-widest text-[10px] sm:text-xs hover:text-white transition-colors">Cancel</button>
            <button 
              type="submit" 
              disabled={!newWsName.trim() || !user}
              className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-black py-3 sm:py-5 rounded-xl sm:rounded-2xl border border-white/20 transition-all shadow-2xl disabled:opacity-50 uppercase tracking-widest text-[10px] sm:text-xs"
            >
              Create Workspace
            </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (!activeWorkspaceId || !activeWorkspace) {
    return (
      <div className="flex-1 flex bg-transparent overflow-hidden">
        {/* Sidebar - visible on mobile if workspaces exist, otherwise hidden */}
        <div className={`flex w-full md:w-64 bg-white/5 backdrop-blur-2xl border-r border-white/10 p-6 flex-col gap-4 ${workspaces.length === 0 ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Workspaces</h3>
            <button 
              onClick={() => setIsCreating(true)}
              className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 backdrop-blur-md border border-white/10 transition-all shadow-xl"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2 overflow-y-auto custom-scrollbar pr-2">
            {workspaces.map(ws => (
              <button 
                key={ws.id}
                onClick={() => setActiveWorkspaceId(ws.id)}
                className="w-full flex items-center gap-3 p-2 rounded-xl text-white/40 hover:bg-white/5 hover:text-white transition-all group border border-transparent hover:border-white/10"
              >
                <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-xl group-hover:scale-110 transition-transform">
                  {ws.imageUrl && (
                    <Image src={ws.imageUrl} alt="" fill className="object-cover" unoptimized referrerPolicy="no-referrer" />
                  )}
                </div>
                <span className="font-black truncate text-xs tracking-tight">{ws.name}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Main Content - hidden on mobile if workspaces exist */}
        <div className={`flex-1 flex-col items-center justify-center text-white/40 p-4 sm:p-6 ${workspaces.length > 0 ? 'hidden md:flex' : 'flex'}`}>
          <div className="max-w-sm text-center">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-2xl border border-white/10 rotate-6">
              <LayoutGrid className="w-10 h-10 sm:w-16 sm:h-16 text-white/10" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 sm:mb-3 tracking-tight">Workspace Hub</h2>
            <p className="mb-6 sm:mb-10 font-medium text-white/30 leading-relaxed text-sm sm:text-base">Create collaborative spaces for your friends and AI tools.</p>
            <button 
              onClick={() => setIsCreating(true)}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-black px-6 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-white/20 transition-all flex items-center gap-2 sm:gap-3 mx-auto shadow-2xl uppercase tracking-widest text-[10px] sm:text-xs"
            >
              <Plus className="w-4 h-4 sm:w-6 sm:h-6" /> Create Workspace
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex bg-transparent overflow-hidden relative w-full h-full">
      {/* Workspace Sidebar */}
      <div className={`
        ${showMobileSidebar ? 'flex' : 'hidden'} 
        md:flex w-72 bg-white/5 backdrop-blur-3xl border-r border-white/10 flex-col shrink-0 z-20
        absolute md:relative inset-y-0 left-0 h-full
      `}>
        <div className="relative h-40 shrink-0">
          {activeWorkspace.imageUrl && (
            <Image src={activeWorkspace.imageUrl} alt="" fill className="object-cover opacity-60" unoptimized referrerPolicy="no-referrer" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between">
            <h2 className="font-black text-white truncate text-xl tracking-tight drop-shadow-2xl">{activeWorkspace.name}</h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsEditingWorkspaceSettings(true)} 
                className="text-white/40 hover:text-white transition-colors"
                title="Workspace Settings"
              >
                <Settings2 className="w-5 h-5" />
              </button>
              <button onClick={() => setActiveWorkspaceId(null)} className="text-white/40 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
          <div>
            <div className="flex items-center justify-between px-2 mb-4 group">
              <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Categories</h3>
              {(activeWorkspace.members.find(m => m.id === user?.uid)?.isAdmin || activeWorkspace.members.find(m => m.id === user?.uid)?.isAssistantAdmin) && (
                <Plus 
                  className="w-4 h-4 text-white/40 hover:text-white cursor-pointer transition-colors opacity-0 group-hover:opacity-100" 
                  onClick={() => setIsCreatingCategory(true)}
                />
              )}
            </div>
            
            {isCreatingCategory && (
              <form onSubmit={handleCreateCategory} className="px-2 mb-4 flex gap-2">
                <input
                  type="text"
                  autoFocus
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category name..."
                  className="flex-1 bg-white/5 text-white placeholder:text-white/20 rounded-lg px-3 py-1.5 text-xs focus:outline-none border border-white/10"
                />
                <button 
                  type="submit"
                  className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/10 transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button 
                  type="button"
                  onClick={() => setIsCreatingCategory(false)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-lg border border-white/10 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

            <div className="space-y-4">
              {activeWorkspace.categories?.map(category => (
                <div key={category.id}>
                  <div className="flex items-center justify-between px-2 mb-1.5 group">
                    <h4 className="text-[9px] font-black text-white/30 uppercase tracking-widest">{category.name}</h4>
                    {(activeWorkspace.members.find(m => m.id === user?.uid)?.isAdmin || activeWorkspace.members.find(m => m.id === user?.uid)?.isAssistantAdmin) && (
                      <Plus 
                        className="w-3 h-3 text-white/30 hover:text-white cursor-pointer transition-colors opacity-0 group-hover:opacity-100" 
                        onClick={() => {
                          setSelectedCategoryId(category.id);
                          setIsCreatingChannel(true);
                        }}
                      />
                    )}
                  </div>
                  <div className="space-y-1">
                    {activeWorkspace.channels.filter(c => c.categoryId === category.id).map(c => (
                      <button 
                        key={c.id} 
                        onClick={() => {
                          setActiveChannelId(c.id);
                          setShowMobileSidebar(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all group border border-transparent ${
                          (activeChannelId === c.id || (!activeChannelId && c.id === activeWorkspace.channels[0].id))
                            ? 'bg-white/10 text-white border-white/10 shadow-xl' 
                            : 'text-white/40 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {c.type === 'text' ? <Hash className="w-4 h-4 text-white/40 group-hover:text-white" /> : c.type === 'voice' ? <Mic className="w-4 h-4 text-white/40 group-hover:text-white" /> : <Bot className="w-4 h-4 text-white/60" />}
                        <span className="truncate font-black text-sm tracking-tight">{c.name}</span>
                        <Settings2 
                          className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity hover:text-white" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingChannel(c);
                            setIsEditingChannelSettings(true);
                          }}
                        />
                      </button>
                    ))}
                    {isCreatingChannel && selectedCategoryId === category.id && (
                      <form onSubmit={handleCreateChannel} className="px-2 mt-2 space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            autoFocus
                            value={newChannelName}
                            onChange={(e) => setNewChannelName(e.target.value)}
                            placeholder="channel-name"
                            className="flex-1 bg-white/5 text-white placeholder:text-white/20 rounded-lg px-2 py-1.5 text-xs focus:outline-none border border-white/10"
                          />
                          <select 
                            value={newChannelType}
                            onChange={(e) => setNewChannelType(e.target.value as any)}
                            className="bg-white/5 text-white rounded-lg px-1 border border-white/10 text-[9px] font-black uppercase"
                          >
                            <option value="text">Tx</option>
                            <option value="voice">Vc</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            type="submit"
                            className="flex-1 bg-white/10 hover:bg-white/20 text-white py-1.5 rounded-lg border border-white/10 text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            Add Channel
                          </button>
                          <button 
                            type="button"
                            onClick={() => setIsCreatingChannel(false)}
                            className="p-1.5 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-lg border border-white/10 transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              ))}

              {/* Uncategorized channels */}
              {activeWorkspace.channels.filter(c => !c.categoryId).length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-2 mb-1.5 group">
                    <h4 className="text-[9px] font-black text-white/30 uppercase tracking-widest">Uncategorized</h4>
                    {(activeWorkspace.members.find(m => m.id === user?.uid)?.isAdmin || activeWorkspace.members.find(m => m.id === user?.uid)?.isAssistantAdmin) && (
                      <Plus 
                        className="w-3 h-3 text-white/30 hover:text-white cursor-pointer transition-colors opacity-0 group-hover:opacity-100" 
                        onClick={() => {
                          setSelectedCategoryId(null);
                          setIsCreatingChannel(true);
                        }}
                      />
                    )}
                  </div>
                  <div className="space-y-1">
                    {activeWorkspace.channels.filter(c => !c.categoryId).map(c => (
                      <button 
                        key={c.id} 
                        onClick={() => {
                          setActiveChannelId(c.id);
                          setShowMobileSidebar(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all group border border-transparent ${
                          (activeChannelId === c.id || (!activeChannelId && c.id === activeWorkspace.channels[0].id))
                            ? 'bg-white/10 text-white border-white/10 shadow-xl' 
                            : 'text-white/40 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {c.type === 'text' ? <Hash className="w-4 h-4 text-white/40 group-hover:text-white" /> : c.type === 'voice' ? <Mic className="w-4 h-4 text-white/40 group-hover:text-white" /> : <Bot className="w-4 h-4 text-white/60" />}
                        <span className="truncate font-black text-sm tracking-tight">{c.name}</span>
                        <Settings2 
                          className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity hover:text-white" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingChannel(c);
                            setIsEditingChannelSettings(true);
                          }}
                        />
                      </button>
                    ))}
                    {isCreatingChannel && selectedCategoryId === null && (
                      <form onSubmit={handleCreateChannel} className="px-2 mt-2 space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            autoFocus
                            value={newChannelName}
                            onChange={(e) => setNewChannelName(e.target.value)}
                            placeholder="channel-name"
                            className="flex-1 bg-white/5 text-white placeholder:text-white/20 rounded-lg px-2 py-1.5 text-xs focus:outline-none border border-white/10"
                          />
                          <select 
                            value={newChannelType}
                            onChange={(e) => setNewChannelType(e.target.value as any)}
                            className="bg-white/5 text-white rounded-lg px-1 border border-white/10 text-[9px] font-black uppercase"
                          >
                            <option value="text">Tx</option>
                            <option value="voice">Vc</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            type="submit"
                            className="flex-1 bg-white/10 hover:bg-white/20 text-white py-1.5 rounded-lg border border-white/10 text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            Add Channel
                          </button>
                          <button 
                            type="button"
                            onClick={() => setIsCreatingChannel(false)}
                            className="p-1.5 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-lg border border-white/10 transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Addon Hub Button */}
            {(activeWorkspace.members.find(m => m.id === user?.uid)?.isAdmin || activeWorkspace.members.find(m => m.id === user?.uid)?.isAssistantAdmin) && (
              <div className="px-2 mb-6">
                <button 
                  onClick={() => setIsAddonHubModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white py-3 rounded-xl border border-white/10 transition-all group shadow-xl"
                >
                  <LinkIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Addon Hub</span>
                </button>
              </div>
            )}

            {/* Tools Section */}
            <div>
              <div className="flex items-center justify-between px-2 mb-4 group">
                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Tools</h3>
                {(activeWorkspace.members.find(m => m.id === user?.uid)?.isAdmin || activeWorkspace.members.find(m => m.id === user?.uid)?.isAssistantAdmin) && (
                  <Plus 
                    className="w-4 h-4 text-white/40 hover:text-white cursor-pointer transition-colors opacity-0 group-hover:opacity-100" 
                    onClick={() => {
                      setAddonPickerType('tool');
                      setIsPickingAddons(true);
                    }}
                  />
                )}
              </div>
              <div className="space-y-1">
                {activeWorkspace.tools?.map(toolId => {
                  const addon = addons.find(a => a.id === toolId);
                  if (!addon) return null;
                  return (
                    <div 
                      key={addon.id}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all border border-transparent group ${
                        activeWorkspaceAddonId === addon.id
                          ? 'bg-white/10 text-white border-white/10 shadow-xl' 
                          : 'text-white/40 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <button 
                        onClick={() => {
                          setActiveWorkspaceAddonId(addon.id);
                          setActiveChannelId(null);
                          setShowMobileSidebar(false);
                        }}
                        className="flex-1 flex items-center gap-3 min-w-0"
                      >
                        <div className="w-4 h-4 rounded overflow-hidden shrink-0">
                          <Image src={addon.iconUrl} alt="" width={16} height={16} className="object-cover" unoptimized referrerPolicy="no-referrer" />
                        </div>
                        <span className="truncate font-black text-sm tracking-tight text-left">{addon.name}</span>
                      </button>
                      {(isCurrentUserAdmin || isCurrentUserAssistant) && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            setConfirmAction({
                              message: `Remove ${addon.name} from workspace?`,
                              onConfirm: async () => {
                                const updatedTools = activeWorkspace.tools?.filter(id => id !== addon.id) || [];
                                await updateDoc(doc(db, "workspaces", activeWorkspaceId!), { tools: updatedTools });
                                if (activeWorkspaceAddonId === addon.id) setActiveWorkspaceAddonId(null);
                              }
                            });
                          }}
                          className="p-1 rounded-lg hover:bg-red-500/20 text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                          title="Remove Tool"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Videos Section */}
            <div>
              <div className="flex items-center justify-between px-2 mb-4 group">
                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Videos</h3>
                {(activeWorkspace.members.find(m => m.id === user?.uid)?.isAdmin || activeWorkspace.members.find(m => m.id === user?.uid)?.isAssistantAdmin) && (
                  <Plus 
                    className="w-4 h-4 text-white/40 hover:text-white cursor-pointer transition-colors opacity-0 group-hover:opacity-100" 
                    onClick={() => {
                      setAddonPickerType('video');
                      setIsPickingAddons(true);
                    }}
                  />
                )}
              </div>
              <div className="space-y-1">
                {activeWorkspace.videos?.map(videoId => {
                  const addon = addons.find(a => a.id === videoId);
                  if (!addon) return null;
                  return (
                    <div 
                      key={addon.id}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all border border-transparent group ${
                        activeWorkspaceAddonId === addon.id
                          ? 'bg-white/10 text-white border-white/10 shadow-xl' 
                          : 'text-white/40 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <button 
                        onClick={() => {
                          setActiveWorkspaceAddonId(addon.id);
                          setActiveChannelId(null);
                          setShowMobileSidebar(false);
                        }}
                        className="flex-1 flex items-center gap-3 min-w-0"
                      >
                        <div className="w-4 h-4 rounded overflow-hidden shrink-0">
                          <Image src={addon.iconUrl} alt="" width={16} height={16} className="object-cover" unoptimized referrerPolicy="no-referrer" />
                        </div>
                        <span className="truncate font-black text-sm tracking-tight text-left">{addon.name}</span>
                      </button>
                      {(isCurrentUserAdmin || isCurrentUserAssistant) && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            setConfirmAction({
                              message: `Remove ${addon.name} from workspace?`,
                              onConfirm: async () => {
                                const updatedVideos = activeWorkspace.videos?.filter(id => id !== addon.id) || [];
                                await updateDoc(doc(db, "workspaces", activeWorkspaceId!), { videos: updatedVideos });
                                if (activeWorkspaceAddonId === addon.id) setActiveWorkspaceAddonId(null);
                              }
                            });
                          }}
                          className="p-1 rounded-lg hover:bg-red-500/20 text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                          title="Remove Video"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Websites Section */}
            <div>
              <div className="flex items-center justify-between px-2 mb-4 group">
                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Websites</h3>
                {(activeWorkspace.members.find(m => m.id === user?.uid)?.isAdmin || activeWorkspace.members.find(m => m.id === user?.uid)?.isAssistantAdmin) && (
                  <Plus 
                    className="w-4 h-4 text-white/40 hover:text-white cursor-pointer transition-colors opacity-0 group-hover:opacity-100" 
                    onClick={() => {
                      setAddonPickerType('website');
                      setIsPickingAddons(true);
                    }}
                  />
                )}
              </div>
              <div className="space-y-1">
                {activeWorkspace.websites?.map(websiteId => {
                  const addon = addons.find(a => a.id === websiteId);
                  if (!addon) return null;
                  return (
                    <div 
                      key={addon.id}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all border border-transparent group ${
                        activeWorkspaceAddonId === addon.id
                          ? 'bg-white/10 text-white border-white/10 shadow-xl' 
                          : 'text-white/40 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <button 
                        onClick={() => {
                          setActiveWorkspaceAddonId(addon.id);
                          setActiveChannelId(null);
                          setShowMobileSidebar(false);
                        }}
                        className="flex-1 flex items-center gap-3 min-w-0"
                      >
                        <div className="w-4 h-4 rounded overflow-hidden shrink-0">
                          <Image src={addon.iconUrl} alt="" width={16} height={16} className="object-cover" unoptimized referrerPolicy="no-referrer" />
                        </div>
                        <span className="truncate font-black text-sm tracking-tight text-left">{addon.name}</span>
                      </button>
                      {(isCurrentUserAdmin || isCurrentUserAssistant) && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            setConfirmAction({
                              message: `Remove ${addon.name} from workspace?`,
                              onConfirm: async () => {
                                const updatedWebsites = activeWorkspace.websites?.filter(id => id !== addon.id) || [];
                                await updateDoc(doc(db, "workspaces", activeWorkspaceId!), { websites: updatedWebsites });
                                if (activeWorkspaceAddonId === addon.id) setActiveWorkspaceAddonId(null);
                              }
                            });
                          }}
                          className="p-1 rounded-lg hover:bg-red-500/20 text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                          title="Remove Website"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-black text-white/40 uppercase px-2 mb-4 tracking-[0.2em]">AI Tools</h3>
            <div className="space-y-2">
              {wsAddons.length === 0 ? <p className="text-[10px] text-white/20 px-2 italic font-medium">No tools shared.</p> : wsAddons.map(a => (
                <button 
                  key={a.id} 
                  onClick={() => {
                    setActiveWorkspaceAddonId(a.id);
                    setActiveChannelId(null);
                    setShowMobileSidebar(false);
                  }}
                  className={`w-full flex items-center gap-4 px-3 py-3 rounded-2xl transition-all border border-transparent group ${
                    activeWorkspaceAddonId === a.id
                      ? 'bg-white/10 text-white border-white/10 shadow-xl' 
                      : 'text-white/40 hover:bg-white/5 hover:text-white hover:border-white/10'
                  }`}
                >
                  {a.iconUrl && (
                    <Image src={a.iconUrl} alt="" width={24} height={24} className="rounded-lg shadow-xl group-hover:scale-110 transition-transform" unoptimized referrerPolicy="no-referrer" />
                  )}
                  <span className="truncate text-sm font-black tracking-tight flex-1 text-left">{a.name}</span>
                  {(isCurrentUserAdmin || isCurrentUserAssistant) && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        setConfirmAction({
                          message: `Remove ${a.name} from workspace?`,
                          onConfirm: async () => {
                            const updatedAddons = wsAddons.filter(addon => addon.id !== a.id);
                            await updateDoc(doc(db, "workspaces", activeWorkspaceId!), { tools: updatedAddons.map(a => a.id) });
                            if (activeWorkspaceAddonId === a.id) setActiveWorkspaceAddonId(null);
                          }
                        });
                      }}
                      className="p-1 rounded-lg hover:bg-red-500/20 text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                      title="Remove AI Tool"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {showMobileSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-10 md:hidden" 
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      {/* Workspace Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-16 border-b border-white/10 flex items-center px-6 shadow-xl shrink-0 justify-between bg-white/5 backdrop-blur-2xl">
          <div className="flex items-center gap-3 overflow-hidden">
            <button 
              onClick={() => setActiveWorkspaceId(null)}
              className="p-2 text-white/40 hover:text-white transition-colors bg-white/5 rounded-xl border border-white/10"
              title="Back to Workspaces"
            >
              <X className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowMobileSidebar(true)}
              className="md:hidden p-2 text-white/40 hover:text-white transition-colors"
            >
              <LayoutGrid className="w-6 h-6" />
            </button>
            {activeWorkspaceAddon ? (
              <div className="w-6 h-6 rounded overflow-hidden shrink-0">
                <Image src={activeWorkspaceAddon.iconUrl} alt="" width={24} height={24} className="object-cover" unoptimized referrerPolicy="no-referrer" />
              </div>
            ) : activeChannel?.type === 'text' ? <Hash className="w-6 h-6 text-white/40" /> : activeChannel?.type === 'voice' ? <Mic className="w-6 h-6 text-white/40" /> : <Bot className="w-6 h-6 text-white/60" />}
            <h3 className="font-black text-white truncate text-lg tracking-tight">{activeWorkspaceAddon ? activeWorkspaceAddon.name : activeChannel?.name || 'general'}</h3>
            
            {!activeWorkspaceAddon && (
              <div className="flex bg-white/5 rounded-xl p-1 border border-white/10 ml-4 overflow-x-auto no-scrollbar">
                <button 
                  onClick={() => setActiveTool(null)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${!activeTool ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                >
                  Chat
                </button>
                {activeChannel?.enabledTools?.map(toolId => {
                  const tool = BASIC_TOOLS.find(t => t.id === toolId);
                  if (!tool) return null;
                  const Icon = tool.icon;
                  return (
                    <button 
                      key={toolId}
                      onClick={() => setActiveTool(toolId)}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTool === toolId ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                    >
                      <Icon className="w-3 h-3" />
                      {tool.name}
                    </button>
                  );
                })}
                {activeChannel?.enabledAddons?.map(addonId => {
                  const addon = addons.find(a => a.id === addonId);
                  if (!addon) return null;
                  return (
                    <button 
                      key={addonId}
                      onClick={() => setActiveTool(addonId)}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTool === addonId ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                    >
                      <Grid className="w-3 h-3" />
                      {addon.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex gap-3 items-center">
            {!activeWorkspaceAddon && (
              <div className="hidden sm:flex gap-3">
                <button 
                  onClick={() => {
                    if (activeChannel) {
                      setEditingChannel(activeChannel);
                      setIsEditingChannelSettings(true);
                    }
                  }}
                  className="text-white hover:bg-white/10 flex items-center gap-2 bg-white/5 px-5 py-2 rounded-xl border border-white/10 text-xs font-black uppercase tracking-widest backdrop-blur-md transition-all shadow-xl"
                >
                  <Settings2 className="w-4 h-4" /> Edit
                </button>
                <button className="text-white hover:bg-white/10 flex items-center gap-2 bg-white/5 px-5 py-2 rounded-xl border border-white/10 text-xs font-black uppercase tracking-widest backdrop-blur-md transition-all shadow-xl">
                  <Phone className="w-4 h-4" /> Call
                </button>
                <button className="text-white flex items-center gap-2 bg-white/10 hover:bg-white/20 px-5 py-2 rounded-xl border border-white/20 text-xs font-black uppercase tracking-widest backdrop-blur-md transition-all shadow-2xl">
                  <Video className="w-4 h-4" /> Screen
                </button>
              </div>
            )}
            <button 
              onClick={() => setShowMobileMembers(!showMobileMembers)}
              className="lg:hidden p-2 text-white/40 hover:text-white transition-colors"
            >
              <Users className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 p-6 md:p-12 overflow-y-auto text-white/80 custom-scrollbar">
          {activeWorkspaceAddon ? (
            <div className="w-full h-full rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl bg-white/5">
              <iframe 
                src={activeWorkspaceAddon.url} 
                className="w-full h-full border-none" 
                title="Addon Content"
              />
            </div>
          ) : activeTool === 'calendar' ? (
            <div className="max-w-6xl mx-auto h-full flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/5 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-2xl border border-white/10 rotate-3">
                    <Calendar className="w-8 h-8 text-white/40" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">{activeChannel?.name} Events</h1>
                    <p className="text-white/40 font-medium">Schedule and view upcoming events.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10">
                  <button 
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/60 hover:text-white"
                  >
                    Prev
                  </button>
                  <span className="font-black text-white min-w-[120px] text-center">
                    {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </span>
                  <button 
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/60 hover:text-white"
                  >
                    Next
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-4 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-[10px] font-black text-white/40 uppercase tracking-widest">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-4 flex-1">
                {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() }).map((_, i) => (
                  <div key={`blank-${i}`} className="bg-white/5 rounded-2xl opacity-50" />
                ))}
                {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate() }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayEvents = calendarEvents.filter(e => e.date === dateStr);
                  const isToday = new Date().toDateString() === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString();
                  
                  return (
                    <div 
                      key={day} 
                      onClick={() => {
                        setSelectedDate(dateStr);
                        setIsAddingEvent(true);
                      }}
                      className={`bg-white/5 border rounded-2xl p-3 min-h-[120px] hover:bg-white/10 transition-colors cursor-pointer group flex flex-col ${isToday ? 'border-white/40 bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'border-white/10'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`font-black transition-colors ${isToday ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>{day}</span>
                        {isToday && <span className="text-[8px] font-black bg-white/20 text-white px-1.5 py-0.5 rounded uppercase tracking-widest">Today</span>}
                        <Plus className="w-4 h-4 text-white/0 group-hover:text-white/40 transition-colors" />
                      </div>
                      <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
                        {dayEvents.map(evt => (
                          <div key={evt.id} className="bg-white/10 rounded-xl p-2 text-xs border border-white/10 shadow-xl">
                            <div className="font-black text-white truncate">{evt.note}</div>
                            <div className="text-[9px] text-white/40 uppercase tracking-widest mt-1 truncate">By {evt.creatorName}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {isAddingEvent && selectedDate && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                  <div className="bg-[#1a1a1a] border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl">
                    <h3 className="text-2xl font-black text-white mb-2">Add Event</h3>
                    <p className="text-white/40 mb-6 font-medium">Schedule an event for {selectedDate}</p>
                    <form onSubmit={handleAddEvent}>
                      <textarea
                        value={newEventNote}
                        onChange={(e) => setNewEventNote(e.target.value)}
                        placeholder="Event details..."
                        className="w-full bg-white/5 text-white placeholder:text-white/20 rounded-2xl p-4 focus:outline-none border border-white/10 min-h-[120px] resize-none mb-6 font-medium"
                        autoFocus
                      />
                      <div className="flex gap-4">
                        <button 
                          type="button" 
                          onClick={() => {
                            setIsAddingEvent(false);
                            setNewEventNote('');
                          }}
                          className="flex-1 py-4 text-white/40 font-black uppercase tracking-widest text-xs hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          disabled={!newEventNote.trim()}
                          className="flex-1 bg-white/10 hover:bg-white/20 text-white font-black py-4 rounded-2xl border border-white/20 transition-all disabled:opacity-50 uppercase tracking-widest text-xs"
                        >
                          Save Event
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          ) : activeTool === 'calculator' ? (
            <CalculatorTool />
          ) : activeTool === 'notes' ? (
            <NotesTool workspaceId={activeWorkspaceId!} channelId={activeChannel!.id} />
          ) : activeTool === 'news' ? (
            <NewsTool />
          ) : activeChannel?.enabledAddons?.includes(activeTool!) ? (
            <div className="w-full h-full rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl bg-white/5">
              <iframe 
                src={addons.find(a => a.id === activeTool)?.url} 
                className="w-full h-full border-none" 
                title="Addon Content"
              />
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="mt-12 md:mt-24 mb-12">
                <div className="w-20 h-20 md:w-28 md:h-28 bg-white/5 backdrop-blur-xl rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl border border-white/10 rotate-6">
                  {activeChannel?.type === 'text' ? <Hash className="w-10 h-10 md:w-14 md:h-14 text-white/20" /> : activeChannel?.type === 'voice' ? <Mic className="w-10 h-10 md:w-14 md:h-14 text-white/20" /> : <Bot className="w-10 h-10 md:w-14 md:h-14 text-white/40" />}
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-white mb-3 tracking-tighter">Welcome to #{activeChannel?.name}!</h1>
                <p className="text-white/30 text-lg md:text-xl font-medium leading-relaxed">
                  {activeChannel?.bio || `This is the beginning of the #${activeChannel?.name} channel.`}
                </p>
              </div>
              
              <div className="h-px bg-white/10 my-10 md:my-16 relative">
                <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white/5 backdrop-blur-xl px-6 py-1 rounded-full text-[10px] font-black text-white/40 uppercase tracking-[0.2em] border border-white/10">Today</span>
              </div>
              
              {/* Chat messages placeholder */}
              <div className="space-y-8">
                <div className="flex gap-5 p-4 rounded-[2rem] hover:bg-white/5 transition-all group border border-transparent hover:border-white/10">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xl border border-white/10"><Bot className="w-6 h-6" /></div>
                  <div>
                    <div className="flex items-baseline gap-3 mb-1">
                      <span className="font-black text-white tracking-tight">HelperBot</span>
                      <span className="bg-white/10 text-white text-[9px] px-2 py-0.5 rounded-lg font-black uppercase tracking-widest border border-white/10">Bot</span>
                      <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Just now</span>
                    </div>
                    <p className="text-white/60 font-medium leading-relaxed">Welcome everyone to {activeWorkspace.name}! I&apos;m here to help you manage this workspace. Type /help to see what I can do.</p>
                  </div>
                </div>

                {messages.map((msg) => (
                  <div key={msg.id} className="flex gap-5 p-4 rounded-[2rem] hover:bg-white/5 transition-all group border border-transparent hover:border-white/10">
                    <div className="relative w-12 h-12 shrink-0">
                      {msg.senderAvatar ? (
                        <Image src={msg.senderAvatar} alt="" fill className="rounded-2xl object-cover border border-white/10 shadow-xl" unoptimized referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full bg-white/10 rounded-2xl flex items-center justify-center text-white border border-white/10 shadow-xl"><User className="w-6 h-6" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-3 mb-1">
                        <span className="font-black text-white hover:text-white/70 cursor-pointer transition-colors tracking-tight">{msg.senderName}</span>
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                          {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                        </span>
                      </div>
                      {msg.text && <p className="text-white/60 font-medium leading-relaxed">{msg.text}</p>}
                      {msg.image && (
                        <div className="relative aspect-auto max-w-full rounded-[2rem] overflow-hidden mt-4 border border-white/10 shadow-2xl group-hover:scale-[1.01] transition-transform">
                          <Image 
                            src={msg.image} 
                            alt="Sent image" 
                            width={800} 
                            height={600} 
                            className="object-contain w-full h-auto max-h-[500px]"
                            unoptimized 
                            referrerPolicy="no-referrer" 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </div>
        
        {(!activeTool || activeTool === 'calendar') && (
          <div className="p-6 md:p-10 shrink-0">
            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto bg-white/5 backdrop-blur-2xl rounded-[2.5rem] flex items-center px-6 md:px-8 py-4 md:py-5 gap-5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 group focus-within:bg-white/10 transition-all">
              <input 
                type="file" 
                ref={chatFileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleChatImageUpload} 
              />
              <Plus 
                className="w-7 h-7 text-white/20 hover:text-white cursor-pointer shrink-0 transition-all hover:rotate-90" 
                onClick={() => chatFileInputRef.current?.click()}
              />
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message #${activeChannel?.name || 'general'}`}
                className="flex-1 bg-transparent text-white focus:outline-none placeholder:text-white/20 min-w-0 font-medium text-lg"
              />
              <button type="submit" disabled={!newMessage.trim() || isSending} className="text-white/40 hover:text-white disabled:opacity-50 transition-all hover:scale-110">
                {isSending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Overlay for mobile members */}
      {showMobileMembers && (
        <div 
          className="fixed inset-0 bg-black/50 z-10 lg:hidden" 
          onClick={() => setShowMobileMembers(false)}
        />
      )}

      {/* Members Sidebar */}
      <div className={`
        ${showMobileMembers ? 'flex' : 'hidden'} 
        lg:flex w-72 bg-white/5 backdrop-blur-3xl border-l border-white/10 flex-col shrink-0 z-20
        absolute lg:relative inset-y-0 right-0
      `}>
        <div className="p-6 h-16 border-b border-white/10 flex items-center shrink-0 bg-white/5">
          <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Members — {activeWorkspace.members.length + activeWorkspace.bots.length}</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
          <div>
            <h4 className="text-[10px] font-black text-white/20 uppercase px-2 mb-4 tracking-[0.2em]">Online — {activeWorkspace.members.length}</h4>
            <div className="space-y-1.5">
              {activeWorkspace.members.map(m => (
                <div key={m.id} className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl cursor-pointer transition-all group border border-transparent hover:border-white/10">
                  <div className="relative shrink-0">
                    {m.avatarUrl && (
                      <Image src={m.avatarUrl} alt="" width={36} height={36} className="rounded-xl border border-white/10 shadow-xl" unoptimized referrerPolicy="no-referrer" />
                    )}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-lg border-2 border-white/5 bg-[#23a559] shadow-xl" />
                  </div>
                  <span className="text-white/60 font-black truncate text-sm group-hover:text-white transition-colors tracking-tight">{m.username}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-[10px] font-black text-white/20 uppercase px-2 mb-4 tracking-[0.2em]">Bots — {activeWorkspace.bots.length}</h4>
            <div className="space-y-1.5">
              {activeWorkspace.bots.map(b => (
                <div key={b} className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl cursor-pointer transition-all group border border-transparent hover:border-white/10">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xl border border-white/10"><Bot className="w-5 h-5" /></div>
                  <span className="text-white/40 font-black truncate text-sm tracking-tight group-hover:text-white transition-colors">{b}</span>
                  <span className="bg-white/10 text-white text-[8px] px-2 py-0.5 rounded-lg font-black uppercase tracking-widest ml-auto border border-white/10">Bot</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Channel Modal */}
      {isEditingChannelSettings && editingChannel && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-2 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-4 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black text-white tracking-tight">Channel Settings</h3>
              <button 
                onClick={() => setIsEditingChannelSettings(false)}
                className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateChannel} className="space-y-8">
              <div>
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Channel Name</label>
                <input
                  type="text"
                  value={editingChannel.name}
                  onChange={(e) => setEditingChannel({ ...editingChannel, name: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="w-full bg-white/5 text-white placeholder:text-white/20 rounded-2xl p-4 focus:outline-none border border-white/10 font-medium"
                  placeholder="channel-name"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Channel Bio</label>
                <textarea
                  value={editingChannel.bio || ''}
                  onChange={(e) => setEditingChannel({ ...editingChannel, bio: e.target.value })}
                  className="w-full bg-white/5 text-white placeholder:text-white/20 rounded-2xl p-4 focus:outline-none border border-white/10 min-h-[80px] resize-none font-medium text-sm"
                  placeholder="What is this channel about?"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Basic Tools</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {BASIC_TOOLS.map(tool => {
                    const Icon = tool.icon;
                    const isEnabled = editingChannel.enabledTools?.includes(tool.id) || (tool.id === 'calendar' && editingChannel.hasCalendar);
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => {
                          const currentTools = editingChannel.enabledTools || [];
                          if (isEnabled) {
                            setEditingChannel({
                              ...editingChannel,
                              enabledTools: currentTools.filter(id => id !== tool.id),
                              hasCalendar: tool.id === 'calendar' ? false : editingChannel.hasCalendar
                            });
                          } else {
                            setEditingChannel({
                              ...editingChannel,
                              enabledTools: [...currentTools, tool.id],
                              hasCalendar: tool.id === 'calendar' ? true : editingChannel.hasCalendar
                            });
                          }
                        }}
                        className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-left ${isEnabled ? 'bg-red-500/10 border-red-500/20 shadow-xl' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isEnabled ? 'bg-red-500/20 text-red-500' : 'bg-white/5 text-white/40'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] font-black text-white tracking-tight">{isEnabled ? 'Remove' : 'Add'} {tool.name}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {([...(activeWorkspace.tools || []), ...(activeWorkspace.videos || []), ...(activeWorkspace.websites || [])]).length > 0 && (
                <div>
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Workspace Add-ons</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[...(activeWorkspace.tools || []), ...(activeWorkspace.videos || []), ...(activeWorkspace.websites || [])].map(addonId => {
                      const addon = addons.find(a => a.id === addonId);
                      if (!addon) return null;
                      const isEnabled = editingChannel.enabledAddons?.includes(addon.id);
                      return (
                        <button
                          key={addon.id}
                          type="button"
                          onClick={() => {
                            const currentAddons = editingChannel.enabledAddons || [];
                            if (isEnabled) {
                              setEditingChannel({
                                ...editingChannel,
                                enabledAddons: currentAddons.filter(id => id !== addon.id)
                              });
                            } else {
                              setEditingChannel({
                                ...editingChannel,
                                enabledAddons: [...currentAddons, addon.id]
                              });
                            }
                          }}
                          className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-left ${isEnabled ? 'bg-red-500/10 border-red-500/20 shadow-xl' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                        >
                          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-white/10">
                            <Image src={addon.iconUrl} alt="" width={32} height={32} className="object-cover" unoptimized referrerPolicy="no-referrer" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[10px] font-black text-white tracking-tight truncate">{isEnabled ? 'Remove' : 'Add'} {addon.name}</div>
                            <div className="text-[8px] text-white/40 font-medium uppercase tracking-widest">{addon.type}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-black py-4 rounded-2xl border border-white/20 transition-all uppercase tracking-widest text-xs shadow-xl"
                >
                  Save Changes
                </button>
              </div>

              {activeWorkspace.members.find(m => m.id === user?.uid)?.isAdmin && (
                <div className="pt-4 border-t border-white/5">
                  <button 
                    type="button"
                    onClick={async () => {
                      setConfirmAction({
                        message: `Are you sure you want to delete the channel "${editingChannel.name}"?`,
                        onConfirm: async () => {
                          const updatedChannels = activeWorkspace.channels.filter(c => c.id !== editingChannel.id);
                          await updateDoc(doc(db, "workspaces", activeWorkspaceId!), { channels: updatedChannels });
                          setIsEditingChannelSettings(false);
                          setEditingChannel(null);
                          if (activeChannelId === editingChannel.id) setActiveChannelId(null);
                        }
                      });
                    }}
                    className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 font-black py-4 rounded-2xl border border-red-500/20 transition-all uppercase tracking-widest text-xs"
                  >
                    Delete Channel
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
      {/* Addon Hub Modal */}
      {isAddonHubModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-[2.5rem] p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-white tracking-tight capitalize">Addon Hub</h3>
              <button 
                onClick={() => setIsAddonHubModalOpen(false)}
                className="p-2 hover:bg-white/5 rounded-xl text-white/40 hover:text-white transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { id: 'tool', icon: Bot, label: 'Add Tool', desc: 'Add an AI tool or widget' },
                { id: 'video', icon: Youtube, label: 'Add Video', desc: 'Add a YouTube video link' },
                { id: 'website', icon: Globe, label: 'Add Website', desc: 'Add an external website' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setAddonPickerType(t.id as any);
                    setIsAddonHubModalOpen(false);
                    setIsPickingAddons(true);
                  }}
                  className="flex flex-col items-center justify-center p-6 rounded-3xl border bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all gap-4 group shadow-xl"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform shadow-2xl">
                    <t.icon className="w-8 h-8" />
                  </div>
                  <div className="text-center">
                    <span className="block text-sm font-black uppercase tracking-widest mb-1">{t.label}</span>
                    <span className="block text-[10px] font-medium text-white/40">{t.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Addon Picker Modal */}
      {isPickingAddons && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-[2.5rem] p-8 max-w-2xl w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-white tracking-tight capitalize">Add {addonPickerType}s</h3>
              <button 
                onClick={() => setIsPickingAddons(false)}
                className="p-2 hover:bg-white/5 rounded-xl text-white/40 hover:text-white transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {addons.filter(a => a.type === addonPickerType && a.showInWorkspaces).map(addon => {
                const isAdded = (activeWorkspace[addonPickerType === 'tool' ? 'tools' : addonPickerType === 'video' ? 'videos' : 'websites'] || []).includes(addon.id);
                return (
                  <button
                    key={addon.id}
                    onClick={async () => {
                      if (!activeWorkspaceId) return;
                      const field = addonPickerType === 'tool' ? 'tools' : addonPickerType === 'video' ? 'videos' : 'websites';
                      const current = activeWorkspace[field] || [];
                      const updated = isAdded ? current.filter(id => id !== addon.id) : [...current, addon.id];
                      
                      try {
                        await updateDoc(doc(db, "workspaces", activeWorkspaceId), { [field]: updated });
                      } catch (error) {
                        console.error("Error updating addons:", error);
                      }
                    }}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${isAdded ? 'bg-white/10 border-white/20 shadow-xl' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10">
                      <Image src={addon.iconUrl} alt="" width={48} height={48} className="object-cover" unoptimized referrerPolicy="no-referrer" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-black text-white tracking-tight truncate">{addon.name}</div>
                      <div className="text-[10px] text-white/40 font-medium truncate">{addon.type}</div>
                    </div>
                    {isAdded ? <Check className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white/20" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Workspace Settings Modal */}
      {isEditingWorkspaceSettings && activeWorkspace && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-6 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-white tracking-tight">Workspace Settings</h3>
              <button 
                onClick={() => setIsEditingWorkspaceSettings(false)}
                className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-10">
              {/* Room Type */}
              <div>
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Room Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {ROOM_TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={async () => {
                        await updateDoc(doc(db, "workspaces", activeWorkspaceId!), { roomType: type.id });
                      }}
                      className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${activeWorkspace.roomType === type.id ? 'bg-white/10 border-white/20 shadow-xl' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${activeWorkspace.roomType === type.id ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40'}`}>
                        <type.icon className="w-5 h-5" />
                      </div>
                      <div className="text-[10px] font-black text-white tracking-tight uppercase">{type.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Members & Roles */}
              <div>
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Members & Roles</label>
                <div className="space-y-3">
                  {activeWorkspace.members.map(member => {
                    const currentUser = activeWorkspace.members.find(m => m.id === user?.uid);
                    const isCurrentUserAdmin = currentUser?.isAdmin;
                    const isCurrentUserAssistant = currentUser?.isAssistantAdmin;
                    
                    // Assistant can edit members except Admins
                    const canEdit = (isCurrentUserAdmin || (isCurrentUserAssistant && !member.isAdmin)) && member.id !== user?.uid;

                    return (
                      <div key={member.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="relative">
                          {member.avatarUrl && (
                            <Image src={member.avatarUrl} alt="" width={40} height={40} className="rounded-xl border border-white/10" unoptimized referrerPolicy="no-referrer" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-black tracking-tight truncate">{member.username}</span>
                            {member.isAdmin && <span className="bg-white/10 text-white text-[8px] px-2 py-0.5 rounded-lg font-black uppercase tracking-widest border border-white/10">Admin</span>}
                            {member.isAssistantAdmin && <span className="bg-white/5 text-white/60 text-[8px] px-2 py-0.5 rounded-lg font-black uppercase tracking-widest border border-white/10">Asst. Admin</span>}
                          </div>
                          <div className="text-[10px] text-white/40 font-medium">{member.role}</div>
                        </div>

                        {canEdit && (
                          <div className="flex items-center gap-2">
                            <select
                              value={member.role}
                              onChange={async (e) => {
                                const newRole = e.target.value;
                                const updatedMembers = activeWorkspace.members.map(m => 
                                  m.id === member.id ? { ...m, role: newRole } : m
                                );
                                await updateDoc(doc(db, "workspaces", activeWorkspaceId!), { members: updatedMembers });
                              }}
                              className="bg-white/5 text-white rounded-lg px-3 py-1.5 border border-white/10 text-[10px] font-black uppercase"
                            >
                              {DEFAULT_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                              {!DEFAULT_ROLES.includes(member.role) && <option value={member.role}>{member.role}</option>}
                            </select>

                            <div className="flex gap-1">
                              <button
                                onClick={async () => {
                                  const updatedMembers = activeWorkspace.members.map(m => 
                                    m.id === member.id ? { ...m, isAdmin: !m.isAdmin, isAssistantAdmin: false } : m
                                  );
                                  await updateDoc(doc(db, "workspaces", activeWorkspaceId!), { members: updatedMembers });
                                }}
                                className={`p-2 rounded-xl border transition-all ${member.isAdmin ? 'bg-white/20 border-white/20 text-white' : 'bg-white/5 border-white/5 text-white/40 hover:text-white'}`}
                                title="Toggle Admin"
                              >
                                <Shield className="w-4 h-4" />
                              </button>
                              <button
                                onClick={async () => {
                                  const updatedMembers = activeWorkspace.members.map(m => 
                                    m.id === member.id ? { ...m, isAssistantAdmin: !m.isAssistantAdmin, isAdmin: false } : m
                                  );
                                  await updateDoc(doc(db, "workspaces", activeWorkspaceId!), { members: updatedMembers });
                                }}
                                className={`p-2 rounded-xl border transition-all ${member.isAssistantAdmin ? 'bg-white/20 border-white/20 text-white' : 'bg-white/5 border-white/5 text-white/40 hover:text-white'}`}
                                title="Toggle Assistant Admin"
                              >
                                <ShieldAlert className="w-4 h-4" />
                              </button>
                              <button
                                onClick={async () => {
                                  setConfirmAction({
                                    message: `Remove ${member.username} from workspace?`,
                                    onConfirm: async () => {
                                      const updatedMembers = activeWorkspace.members.filter(m => m.id !== member.id);
                                      const updatedMemberIds = activeWorkspace.memberIds.filter(id => id !== member.id);
                                      await updateDoc(doc(db, "workspaces", activeWorkspaceId!), { 
                                        members: updatedMembers,
                                        memberIds: updatedMemberIds
                                      });
                                    }
                                  });
                                }}
                                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl border border-red-500/20 transition-all"
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Danger Zone */}
              {activeWorkspace.members.find(m => m.id === user?.uid)?.isAdmin && (
                <div className="pt-8 border-t border-white/10">
                  <button
                    onClick={async () => {
                      setConfirmAction({
                        message: "Are you sure you want to delete this workspace? This cannot be undone.",
                        onConfirm: async () => {
                          await deleteDoc(doc(db, "workspaces", activeWorkspaceId!));
                          setActiveWorkspaceId(null);
                          setIsEditingWorkspaceSettings(false);
                        }
                      });
                    }}
                    className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 py-4 rounded-2xl border border-red-500/20 font-black uppercase tracking-widest transition-all"
                  >
                    Delete Workspace
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-6 shadow-2xl max-w-sm w-full">
            <h3 className="text-lg font-black text-white mb-4">Confirm Action</h3>
            <p className="text-white/60 mb-6">{confirmAction.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl border border-white/10 font-black uppercase tracking-widest text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmAction.onConfirm();
                  setConfirmAction(null);
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl border border-red-500/20 font-black uppercase tracking-widest text-xs"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

