'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove, onSnapshot, getDoc } from 'firebase/firestore';
import { Search, UserPlus, Check, MessageCircle, Hash, User, Loader2, XCircle, X } from 'lucide-react';
import Image from 'next/image';

export default function FriendsTab() {
  const { profile, user, setFriends, friends, incomingRequests, setIncomingRequests, outgoingRequests, setOutgoingRequests, setActiveTab, setActivePrivateChatId } = useStore();
  const [searchType, setSearchType] = useState<'username' | 'code'>('username');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !user || !profile) return;
    setIsSearching(true);
    setSearchResult(null);

    try {
      const usersRef = collection(db, "users");
      let q;
      if (searchType === 'code') {
        q = query(usersRef, where("friendCode", "==", searchQuery.trim()));
      } else {
        q = query(usersRef, where("username", "==", searchQuery.trim()));
      }

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setSearchResult({ message: "User not found.", type: 'error' });
      } else {
        const foundUser = querySnapshot.docs[0];
        const foundUserId = foundUser.id;

        if (foundUserId === user.uid) {
          setSearchResult({ message: "You cannot add yourself.", type: 'error' });
        } else if (friends.some(f => f.id === foundUserId)) {
          setSearchResult({ message: "Already in your friends list.", type: 'error' });
        } else if (outgoingRequests.includes(foundUserId)) {
          setSearchResult({ message: "Friend request already sent.", type: 'error' });
        } else if (incomingRequests.some(r => r.id === foundUserId)) {
          // They already sent us a request, auto-accept
          await handleAcceptRequest(foundUserId);
          setSearchResult({ message: `Accepted friend request from ${foundUser.data().username}!`, type: 'success' });
          setSearchQuery('');
        } else {
          // Send friend request
          await updateDoc(doc(db, "users", foundUserId), {
            incomingRequests: arrayUnion(user.uid)
          });
          await updateDoc(doc(db, "users", user.uid), {
            outgoingRequests: arrayUnion(foundUserId)
          });
          
          setSearchResult({ message: `Friend request sent to ${foundUser.data().username}!`, type: 'success' });
          setSearchQuery('');
        }
      }
    } catch (err) {
      console.error(err);
      setSearchResult({ message: "An error occurred.", type: 'error' });
    } finally {
      setIsSearching(false);
      setTimeout(() => setSearchResult(null), 5000);
    }
  };

  const handleAcceptRequest = async (requesterId: string) => {
    if (!user) return;
    try {
      // Add to friends and remove from requests for current user
      await updateDoc(doc(db, "users", user.uid), {
        friends: arrayUnion(requesterId),
        incomingRequests: arrayRemove(requesterId)
      });
      // Add to friends and remove from requests for requester
      await updateDoc(doc(db, "users", requesterId), {
        friends: arrayUnion(user.uid),
        outgoingRequests: arrayRemove(user.uid)
      });
    } catch (err) {
      console.error("Error accepting request:", err);
    }
  };

  const handleDeclineRequest = async (requesterId: string) => {
    if (!user) return;
    try {
      // Remove from requests for current user
      await updateDoc(doc(db, "users", user.uid), {
        incomingRequests: arrayRemove(requesterId)
      });
      // Remove from requests for requester
      await updateDoc(doc(db, "users", requesterId), {
        outgoingRequests: arrayRemove(user.uid)
      });
    } catch (err) {
      console.error("Error declining request:", err);
    }
  };

  const startChat = (friendId: string) => {
    setActivePrivateChatId(friendId);
    setActiveTab('private_chat');
  };

  return (
    <div className="flex-1 flex flex-col bg-transparent p-3 sm:p-8 overflow-y-auto">
      <div className="max-w-4xl w-full mx-auto space-y-4 sm:space-y-12">
        
        {/* Search & Add Section */}
        <div className="bg-white/5 backdrop-blur-2xl p-4 sm:p-12 rounded-[1.5rem] sm:rounded-[3.5rem] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.4)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-10 mb-6 sm:mb-12">
            <div>
              <h2 className="text-xl sm:text-4xl font-black text-white mb-1 sm:mb-3 tracking-tighter">Add Friend</h2>
              <p className="text-white/30 text-[10px] sm:text-lg font-medium leading-relaxed">
                Connect with others by their unique username or permanent friend code.
              </p>
            </div>
            <div className="flex bg-white/5 backdrop-blur-md p-1 rounded-lg sm:rounded-2xl border border-white/10 shadow-2xl">
              <button
                onClick={() => setSearchType('username')}
                className={`flex items-center gap-1.5 sm:gap-3 px-3 sm:px-8 py-2 sm:py-4 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${
                  searchType === 'username' ? 'bg-white/10 text-white shadow-2xl border border-white/20' : 'text-white/20 hover:text-white/60'
                }`}
              >
                <User className="w-3 h-3 sm:w-5 sm:h-5" /> Username
              </button>
              <button
                onClick={() => setSearchType('code')}
                className={`flex items-center gap-1.5 sm:gap-3 px-3 sm:px-8 py-2 sm:py-4 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${
                  searchType === 'code' ? 'bg-white/10 text-white shadow-2xl border border-white/20' : 'text-white/20 hover:text-white/60'
                }`}
              >
                <Hash className="w-3 h-3 sm:w-5 sm:h-5" /> Friend Code
              </button>
            </div>
          </div>
          
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 sm:gap-6">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchType === 'username' ? "Enter username" : "Enter Friend Code"}
                className="w-full bg-white/5 text-white placeholder:text-white/20 rounded-lg sm:rounded-2xl pl-10 sm:pl-16 pr-4 sm:pr-6 py-3 sm:py-6 focus:outline-none focus:ring-2 focus:ring-white/20 border border-white/10 backdrop-blur-md transition-all font-black tracking-tight text-sm sm:text-lg"
              />
              <Search className="w-4 h-4 sm:w-7 sm:h-7 text-white/20 absolute left-3 sm:left-6 top-3.5 sm:top-6" />
            </div>
            <button
              type="submit"
              disabled={!searchQuery.trim() || isSearching}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-black px-6 sm:px-12 rounded-lg sm:rounded-2xl border border-white/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 sm:gap-4 shadow-2xl uppercase tracking-widest text-[8px] sm:text-[10px] py-3 sm:py-6"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4 sm:w-6 sm:h-6" />}
              {searchType === 'code' ? 'Add Friend' : 'Request'}
            </button>
          </form>
          
          {searchResult && (
            <div className={`mt-4 sm:mt-8 p-3 sm:p-6 rounded-lg sm:rounded-[2rem] flex items-center gap-2 sm:gap-4 animate-in fade-in slide-in-from-top-4 border backdrop-blur-xl shadow-2xl ${
              searchResult.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              {searchResult.type === 'success' ? <Check className="w-4 h-4 sm:w-6 sm:h-6" /> : <XCircle className="w-4 h-4 sm:w-6 sm:h-6" />}
              <span className="font-black text-[8px] sm:text-xs uppercase tracking-widest">{searchResult.message}</span>
            </div>
          )}
        </div>

        {/* Incoming Requests */}
        {incomingRequests.length > 0 && (
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center justify-between mb-4 sm:mb-6 px-2 sm:px-6">
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tighter flex items-center gap-3 sm:gap-4">
                Pending Requests <span className="bg-rose-500/20 text-rose-400 text-[9px] sm:text-[10px] px-3 sm:px-4 py-1 rounded-full border border-rose-500/20 shadow-xl">{incomingRequests.length}</span>
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {incomingRequests.map((req) => (
                <div key={req.id} className="bg-white/5 backdrop-blur-2xl p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 flex items-center gap-4 hover:bg-white/10 transition-all group shadow-xl">
                  <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-[1rem] sm:rounded-[1.5rem] overflow-hidden shrink-0 border border-white/20 shadow-2xl">
                    {req.avatarUrl && (
                      <Image src={req.avatarUrl} alt={req.username} fill className="object-cover" unoptimized referrerPolicy="no-referrer" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-black truncate text-base sm:text-lg tracking-tight mb-0.5">{req.username}</h4>
                    <p className="text-white/20 text-[8px] sm:text-[9px] truncate font-black uppercase tracking-[0.1em]">{req.friendCode}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleAcceptRequest(req.id)}
                      className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20 shadow-lg"
                    >
                      <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button 
                      onClick={() => handleDeclineRequest(req.id)}
                      className="w-8 h-8 sm:w-10 sm:h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-400 hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20 shadow-lg"
                    >
                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div>
          <div className="flex items-center justify-between mb-6 sm:mb-10 px-2 sm:px-6">
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tighter flex items-center gap-3 sm:gap-4">
              All Friends <span className="bg-white/10 text-white/60 text-[9px] sm:text-[10px] px-3 sm:px-4 py-1 rounded-full border border-white/10 shadow-xl">{friends.length}</span>
            </h3>
          </div>
          
          {friends.length === 0 ? (
            <div className="text-center py-16 sm:py-32 bg-white/5 backdrop-blur-2xl rounded-[2rem] sm:rounded-[4rem] border border-white/10 border-dashed shadow-2xl">
              <div className="w-20 h-20 sm:w-32 sm:h-32 bg-white/5 rounded-[2rem] sm:rounded-[3rem] flex items-center justify-center mx-auto mb-6 sm:mb-10 border border-white/10 rotate-12 shadow-2xl">
                <UserPlus className="w-10 h-10 sm:w-14 sm:h-14 text-white/10" />
              </div>
              <p className="text-white/20 font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[9px] sm:text-[10px]">Your circle is empty. Start connecting!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
              {friends.map((friend) => (
                <div key={friend.id} onClick={() => startChat(friend.id)} className="bg-white/5 backdrop-blur-2xl p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-white/10 flex items-center gap-4 sm:gap-6 hover:bg-white/10 transition-all cursor-pointer group hover:scale-[1.02] sm:hover:scale-[1.05] hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] sm:hover:shadow-[0_40px_80px_rgba(0,0,0,0.5)]">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden shrink-0 border border-white/20 shadow-2xl group-hover:rotate-6 transition-transform">
                    {friend.avatarUrl && (
                      <Image src={friend.avatarUrl} alt={friend.username} fill className="object-cover" unoptimized referrerPolicy="no-referrer" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-black truncate text-lg sm:text-xl tracking-tight mb-0.5 sm:mb-1">{friend.username}</h4>
                    <p className="text-white/20 text-[9px] sm:text-[10px] truncate font-black uppercase tracking-[0.1em] sm:tracking-[0.2em]">{friend.friendCode}</p>
                  </div>
                  <div className="flex gap-2 sm:gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 sm:translate-x-6 group-hover:translate-x-0">
                    <button className="w-10 h-10 sm:w-14 sm:h-14 bg-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all border border-white/10 shadow-2xl">
                      <MessageCircle className="w-5 h-5 sm:w-7 sm:h-7" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

