'use client';

import { useStore } from '@/store/useStore';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { Copy, Check, LogOut, Settings as SettingsIcon, Edit2, User, Image as ImageIcon, Sparkles, Upload, Loader2, X, Save } from 'lucide-react';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { compressImage } from '@/lib/utils';

export default function SettingsTab() {
  const { profile, setProfile, user } = useStore();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState(profile?.username || '');
  const [editAvatarUrl, setEditAvatarUrl] = useState(profile?.avatarUrl || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatars = [
    'https://picsum.photos/seed/av1/150/150',
    'https://picsum.photos/seed/av2/150/150',
    'https://picsum.photos/seed/av3/150/150',
    'https://picsum.photos/seed/av4/150/150',
    'https://picsum.photos/seed/av5/150/150',
    'https://picsum.photos/seed/av6/150/150',
  ];

  const handleCopy = () => {
    if (profile?.friendCode) {
      navigator.clipboard.writeText(profile.friendCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setProfile(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const generateAIAvatar = async () => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: `A 3D stylized character avatar, Snapchat Bitmoji style, vibrant colors, expressive facial features, modern outfit, soft studio lighting, high quality render, person named ${editUsername}.`,
            },
          ],
        },
      });
      
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const rawBase64 = `data:image/png;base64,${part.inlineData.data}`;
          const compressed = await compressImage(rawBase64, 400, 400, 0.7);
          setEditAvatarUrl(compressed);
          break;
        }
      }
    } catch (error) {
      console.error('Error generating avatar:', error);
      setEditAvatarUrl(`https://picsum.photos/seed/${editUsername}/150/150`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawBase64 = reader.result as string;
        const compressed = await compressImage(rawBase64, 400, 400, 0.7);
        setEditAvatarUrl(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (profile && editUsername.trim() && user) {
      setIsSaving(true);
      try {
        const updatedProfile = {
          ...profile,
          username: editUsername.trim(),
          avatarUrl: editAvatarUrl,
        };
        await updateDoc(doc(db, "users", user.uid), updatedProfile);
        setProfile(updatedProfile);
        setIsEditing(false);
      } catch (error) {
        console.error("Error updating profile:", error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleCancel = () => {
    setEditUsername(profile?.username || '');
    setEditAvatarUrl(profile?.avatarUrl || '');
    setIsEditing(false);
  };

  if (!profile) return null;

  return (
    <div className="flex-1 flex flex-col bg-transparent p-4 sm:p-8 overflow-y-auto">
      <div className="max-w-3xl w-full mx-auto space-y-6 sm:space-y-12">
        
        <div>
          <h2 className="text-xl sm:text-3xl font-black text-white flex items-center gap-2 sm:gap-3 mb-4 sm:mb-8 tracking-tight">
            <SettingsIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white/40" /> My Account
          </h2>
          
          {/* Profile Card */}
          <div className="bg-white/5 backdrop-blur-2xl rounded-2xl sm:rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl">
            <div className="h-24 sm:h-40 bg-gradient-to-r from-white/10 to-transparent" />
            <div className="px-4 sm:px-8 pb-4 sm:pb-8 relative flex justify-between items-start">
              <div className="relative -mt-12 sm:-mt-20">
                <div className="w-24 h-24 sm:w-40 sm:h-40 rounded-2xl sm:rounded-[2.5rem] border-4 sm:border-8 border-white/5 overflow-hidden bg-white/5 shadow-2xl">
                  {isEditing ? (
                    <div className="relative w-full h-full">
                      {editAvatarUrl && (
                        <Image src={editAvatarUrl} alt="Avatar" fill className="object-cover" unoptimized referrerPolicy="no-referrer" />
                      )}
                      {isGenerating && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                  ) : (
                    profile.avatarUrl && (
                      <Image src={profile.avatarUrl} alt="Avatar" fill className="object-cover" unoptimized referrerPolicy="no-referrer" />
                    )
                  )}
                </div>
                <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-4 h-4 sm:w-6 sm:h-6 rounded-full border-2 sm:border-4 border-[#1e1f22] bg-[#23a559]" />
              </div>
              
              <div className="mt-2 sm:mt-4 flex gap-2">
                {isEditing ? (
                  <>
                    <button 
                      onClick={handleCancel}
                      className="bg-white/5 hover:bg-white/10 backdrop-blur-md text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border border-white/10 transition-all flex items-center gap-1 sm:gap-2"
                    >
                      <X className="w-3 h-3 sm:w-4 sm:h-4" /> Cancel
                    </button>
                    <button 
                      onClick={handleSave}
                      disabled={isSaving || !editUsername.trim()}
                      className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border border-white/10 transition-all flex items-center gap-1 sm:gap-2 disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> : <><Save className="w-3 h-3 sm:w-4 sm:h-4" /> Save</>}
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border border-white/10 transition-all flex items-center gap-1 sm:gap-2"
                  >
                    <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" /> Edit
                  </button>
                )}
              </div>
            </div>
            
            <div className="px-4 sm:px-6 pb-4 sm:pb-6">
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-[#2b2d31] rounded-xl p-4 sm:p-6 border border-[#3f4147] space-y-4 sm:space-y-6"
                  >
                    <div>
                      <h4 className="text-[10px] font-bold text-[#b5bac1] uppercase mb-1 sm:mb-2">Username</h4>
                      <input 
                        type="text"
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        className="w-full bg-[#1e1f22] text-[#dbdee1] rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-[#5865F2] border border-[#3f4147] text-sm"
                        placeholder="Enter username..."
                      />
                    </div>

                    <div>
                      <h4 className="text-[10px] font-bold text-[#b5bac1] uppercase mb-2 sm:mb-3">Avatar Options</h4>
                      <div className="flex flex-col gap-3 sm:gap-4">
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center justify-center gap-1 sm:gap-2 p-2 sm:p-3 bg-[#1e1f22] rounded-lg border border-[#3f4147] hover:border-[#5865F2] transition-all"
                          >
                            <Upload className="w-3 h-3 sm:w-4 sm:h-4 text-[#5865F2]" />
                            <span className="text-[9px] sm:text-xs font-bold text-white uppercase">Upload</span>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                          </button>
                          <button
                            onClick={generateAIAvatar}
                            disabled={isGenerating}
                            className="flex items-center justify-center gap-1 sm:gap-2 p-2 sm:p-3 bg-[#1e1f22] rounded-lg border border-[#3f4147] hover:border-[#f0b232] transition-all group"
                          >
                            <Sparkles className={`w-3 h-3 sm:w-4 sm:h-4 ${isGenerating ? 'text-[#949ba4]' : 'text-[#f0b232] group-hover:scale-110 transition-transform'}`} />
                            <span className="text-[9px] sm:text-xs font-bold text-white uppercase">AI Generate</span>
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-6 gap-1 sm:gap-2">
                          {avatars.map((url, idx) => (
                            <button
                              key={idx}
                              onClick={() => setEditAvatarUrl(url)}
                              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                                editAvatarUrl === url ? 'border-[#23a559]' : 'border-transparent opacity-60 hover:opacity-100'
                              }`}
                            >
                              <Image src={url} alt={`Avatar ${idx + 1}`} fill className="object-cover" unoptimized referrerPolicy="no-referrer" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-[#2b2d31] rounded-xl p-3 sm:p-4 border border-[#3f4147] space-y-3 sm:space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-[10px] font-bold text-[#b5bac1] uppercase mb-0.5 sm:mb-1">Username</h4>
                        <p className="text-white font-medium text-sm sm:text-lg">{profile.username}</p>
                      </div>
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="bg-[#4e5058] hover:bg-[#6d6f78] text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                    
                    <div className="h-px bg-[#3f4147]" />
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-[10px] font-bold text-[#b5bac1] uppercase mb-0.5 sm:mb-1">Friend Code</h4>
                        <p className="text-white font-medium font-mono bg-[#1e1f22] px-1.5 py-0.5 sm:px-2 sm:py-1 rounded inline-block text-xs sm:text-base">
                          {profile.friendCode}
                        </p>
                        <p className="text-[#949ba4] text-[10px] sm:text-xs mt-0.5 sm:mt-1">Share to add friends.</p>
                      </div>
                      <button 
                        onClick={handleCopy}
                        className={`${copied ? 'bg-[#23a559]' : 'bg-[#5865F2] hover:bg-[#4752C4]'} text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 sm:gap-2`}
                      >
                        {copied ? <><Check className="w-3 h-3 sm:w-4 sm:h-4" /> Copied</> : <><Copy className="w-3 h-3 sm:w-4 sm:h-4" /> Copy</>}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="h-px bg-[#3f4147]" />
        
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#f23f43] mb-3 sm:mb-4">Danger Zone</h3>
          <button 
            onClick={handleLogout}
            className="border border-[#f23f43] text-[#f23f43] hover:bg-[#f23f43] hover:text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl font-bold transition-all flex items-center gap-2 text-sm sm:text-base"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" /> Log Out
          </button>
        </div>

      </div>
    </div>
  );
}
