'use client';

import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, where, limit, Timestamp } from 'firebase/firestore';
import { MessageCircle, Send, Loader2, Image as ImageIcon, Paperclip, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { compressImage } from '@/lib/utils';

export default function PrivateChatTab() {
  const { friends, activePrivateChatId, setActivePrivateChatId, user } = useStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeFriend = friends.find(f => f.id === activePrivateChatId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user || !activePrivateChatId) return;

    const chatId = [user.uid, activePrivateChatId].sort().join('_');
    
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).reverse();
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [user, activePrivateChatId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !activePrivateChatId || isSending) return;

    const messageText = newMessage.trim();
    setNewMessage(''); // Optimistic clear
    setIsSending(true);
    
    const chatId = [user.uid, activePrivateChatId].sort().join('_');
    
    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: messageText,
        senderId: user.uid,
        timestamp: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setNewMessage(messageText); // Revert on error
    } finally {
      setIsSending(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !activePrivateChatId || isSending) return;

    setIsSending(true);
    const chatId = [user.uid, activePrivateChatId].sort().join('_');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const compressed = await compressImage(base64, 800, 800, 0.6);

        await addDoc(collection(db, "chats", chatId, "messages"), {
          image: compressed,
          senderId: user.uid,
          timestamp: Timestamp.now(),
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error sending image:", error);
    } finally {
      setIsSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex-1 flex bg-transparent overflow-hidden p-2 sm:p-8 gap-4 sm:gap-8">
      {/* Friends List Sidebar */}
      <div className={`w-full md:w-80 bg-white/5 backdrop-blur-2xl rounded-[2rem] sm:rounded-[3rem] border border-white/10 flex-col shrink-0 shadow-2xl overflow-hidden ${activeFriend ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 sm:p-8 border-b border-white/10 flex items-center justify-between shrink-0">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tighter">Private Chats</h2>
          <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white/20" />
        </div>
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 custom-scrollbar">
          {friends.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-white/20 text-xs font-black uppercase tracking-widest">Add friends to start chatting.</p>
            </div>
          ) : (
            friends.map(f => (
              <button
                key={f.id}
                onClick={() => setActivePrivateChatId(f.id)}
                className={`w-full flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 sm:py-4 rounded-2xl transition-all group ${
                  activePrivateChatId === f.id ? 'bg-white/10 text-white shadow-xl border border-white/20' : 'text-white/30 hover:bg-white/5 hover:text-white/70'
                }`}
              >
                <div className="relative shrink-0">
                  {f.avatarUrl ? (
                    <Image src={f.avatarUrl} alt="" width={40} height={40} className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border border-white/10 object-cover" unoptimized referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10" />
                  )}
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-emerald-500 rounded-full border-2 border-[#1a1a1a]" />
                </div>
                <div className="flex flex-col items-start overflow-hidden flex-1">
                  <span className="font-black text-sm tracking-tight truncate w-full text-left">{f.username}</span>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-40">Online</span>
                </div>
                <div className="ml-auto p-2 bg-white/10 rounded-full text-white/50 group-hover:text-white transition-all md:opacity-0 group-hover:opacity-100">
                  <MessageCircle className="w-4 h-4" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex-col min-w-0 bg-white/5 backdrop-blur-2xl rounded-[2rem] sm:rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden ${!activeFriend ? 'hidden md:flex' : 'flex'}`}>
        {!activeFriend ? (
          <div className="flex-1 flex flex-col items-center justify-center text-white/20 p-8 sm:p-12 text-center">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white/5 rounded-[2rem] sm:rounded-[3rem] flex items-center justify-center mb-8 sm:mb-10 rotate-12 border border-white/10 shadow-2xl">
              <MessageCircle className="w-12 h-12 sm:w-16 sm:h-16" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white mb-3 sm:mb-4 tracking-tight">Select a friend</h3>
            <p className="text-sm sm:text-lg font-medium max-w-xs leading-relaxed">Choose a friend from the sidebar to start a private conversation.</p>
          </div>
        ) : (
          <>
            <div className="p-4 sm:p-8 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/5">
              <div className="flex items-center gap-3 sm:gap-4">
                <button 
                  onClick={() => setActivePrivateChatId(null)}
                  className="md:hidden p-2 -ml-2 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="relative shrink-0">
                  {activeFriend.avatarUrl ? (
                    <Image src={activeFriend.avatarUrl} alt="" width={40} height={40} className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border border-white/10 object-cover" unoptimized referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10" />
                  )}
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-emerald-500 rounded-full border-2 border-[#1a1a1a]" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-2xl font-black text-white tracking-tighter truncate">{activeFriend.username}</h3>
                  <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-400/60">Active Now</p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 p-4 sm:p-8 overflow-y-auto flex flex-col custom-scrollbar gap-6 sm:gap-8">
              <div className="text-center py-8 sm:py-12 border-b border-white/5 mb-4 sm:mb-8">
                {activeFriend.avatarUrl && (
                  <Image src={activeFriend.avatarUrl} alt="" width={80} height={80} className="w-20 h-20 sm:w-[120px] sm:h-[120px] rounded-[2rem] sm:rounded-[2.5rem] mx-auto mb-4 sm:mb-6 border-4 border-white/10 shadow-2xl object-cover" unoptimized referrerPolicy="no-referrer" />
                )}
                <h1 className="text-2xl sm:text-4xl font-black text-white mb-2 sm:mb-3 tracking-tighter">{activeFriend.username}</h1>
                <p className="text-white/30 font-medium text-sm sm:text-lg max-w-md mx-auto px-4">This is the beginning of your direct message history with {activeFriend.username}.</p>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {messages.map((msg) => {
                  const isMe = msg.senderId === user?.uid;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] sm:max-w-[70%] p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] backdrop-blur-3xl border border-white/10 shadow-2xl ${
                        isMe ? 'bg-white/15 text-white rounded-tr-none border-white/20' : 'bg-white/5 text-white/90 rounded-tl-none'
                      }`}>
                        {msg.text && <p className="text-sm sm:text-lg font-medium leading-relaxed break-words">{msg.text}</p>}
                        {msg.image && (
                          <div className="relative aspect-auto max-w-full rounded-xl sm:rounded-2xl overflow-hidden mt-2 sm:mt-3 border border-white/10">
                            <Image 
                              src={msg.image} 
                              alt="Sent image" 
                              width={600} 
                              height={600} 
                              className="object-contain w-full h-auto"
                              unoptimized 
                              referrerPolicy="no-referrer" 
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-2 sm:mt-3 opacity-30">
                          <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest">
                            {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            <div className="p-3 sm:p-8 shrink-0 bg-white/5 border-t border-white/10">
              <form onSubmit={handleSendMessage} className="bg-white/5 backdrop-blur-3xl rounded-[1.5rem] sm:rounded-[2rem] flex items-center px-3 sm:px-6 py-2 sm:py-5 gap-2 sm:gap-5 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] group focus-within:border-white/20 transition-all">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-white/20 hover:text-white transition-all hover:scale-110 p-2 sm:p-0"
                >
                  <Paperclip className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Message @${activeFriend.username}`}
                  className="flex-1 w-full min-w-0 bg-transparent text-white focus:outline-none placeholder:text-white/20 font-black tracking-tight text-sm sm:text-lg"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className="bg-white/10 hover:bg-white/20 text-white p-2 sm:p-3 rounded-xl border border-white/20 transition-all shadow-xl disabled:opacity-50 hover:scale-110 shrink-0"
                >
                  {isSending ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" /> : <Send className="w-5 h-5 sm:w-6 sm:h-6" />}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
