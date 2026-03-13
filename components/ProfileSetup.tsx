'use client';

import { useState, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { User, Image as ImageIcon, ArrowRight, Check, Sparkles, Upload, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { GoogleGenAI } from "@google/genai";
import { compressImage } from '@/lib/utils';

export default function ProfileSetup() {
  const { user, setProfile } = useStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatars = [
    'https://picsum.photos/seed/av1/150/150',
    'https://picsum.photos/seed/av2/150/150',
    'https://picsum.photos/seed/av3/150/150',
    'https://picsum.photos/seed/av4/150/150',
    'https://picsum.photos/seed/av5/150/150',
    'https://picsum.photos/seed/av6/150/150',
  ];

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setStep(2);
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
              text: `A 3D stylized character avatar, Snapchat Bitmoji style, vibrant colors, expressive facial features, modern outfit, soft studio lighting, high quality render, person named ${username}.`,
            },
          ],
        },
      });
      
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const rawBase64 = `data:image/png;base64,${part.inlineData.data}`;
          const compressed = await compressImage(rawBase64, 400, 400, 0.7);
          setAvatarUrl(compressed);
          break;
        }
      }
    } catch (error) {
      console.error('Error generating avatar:', error);
      // Fallback if AI fails
      setAvatarUrl(`https://picsum.photos/seed/${username}/150/150`);
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
        setAvatarUrl(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinish = async () => {
    if (!user) return;
    setIsFinishing(true);
    
    // Generate a random alphanumeric friend code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const newProfile = {
      uid: user.uid,
      username: username.trim(),
      avatarUrl: avatarUrl || avatars[0],
      friendCode: code,
    };

    try {
      await setDoc(doc(db, "users", user.uid), newProfile);
      setProfile(newProfile);
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-[#2b2d31]/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-[#3f4147]"
            >
              <div className="w-16 h-16 bg-[#5865F2]/20 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <User className="w-8 h-8 text-[#5865F2]" />
              </div>
              <h1 className="text-3xl font-bold text-white text-center mb-2">Choose a Username</h1>
              <p className="text-[#949ba4] text-center mb-8">What should everyone call you?</p>

              <form onSubmit={handleNext} className="space-y-6">
                <div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#1e1f22] text-[#dbdee1] rounded-xl p-4 text-lg focus:outline-none focus:ring-2 focus:ring-[#5865F2] border border-[#3f4147] transition-all"
                    placeholder="Enter username..."
                    required
                    maxLength={32}
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={!username.trim()}
                  className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Next Step <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-[#2b2d31]/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-[#3f4147]"
            >
              <div className="w-16 h-16 bg-[#23a559]/20 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <ImageIcon className="w-8 h-8 text-[#23a559]" />
              </div>
              <h1 className="text-3xl font-bold text-white text-center mb-2">Pick an Avatar</h1>
              <p className="text-[#949ba4] text-center mb-8">Select a profile picture for {username}</p>

              <div className="flex flex-col gap-6 mb-8">
                {/* Selected/Preview Avatar */}
                <div className="flex justify-center">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-[#5865F2] bg-[#1e1f22]">
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt="Preview" fill className="object-cover" unoptimized referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#949ba4]">
                        <User className="w-12 h-12" />
                      </div>
                    )}
                    {isGenerating && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Options */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-4 bg-[#1e1f22] rounded-xl border border-[#3f4147] hover:border-[#5865F2] transition-all gap-2"
                  >
                    <Upload className="w-6 h-6 text-[#5865F2]" />
                    <span className="text-xs font-bold text-white uppercase">Upload</span>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </button>
                  <button
                    onClick={generateAIAvatar}
                    disabled={isGenerating}
                    className="flex flex-col items-center justify-center p-4 bg-[#1e1f22] rounded-xl border border-[#3f4147] hover:border-[#f0b232] transition-all gap-2 group"
                  >
                    <Sparkles className={`w-6 h-6 ${isGenerating ? 'text-[#949ba4]' : 'text-[#f0b232] group-hover:scale-110 transition-transform'}`} />
                    <span className="text-xs font-bold text-white uppercase">AI Generate</span>
                  </button>
                </div>

                <div className="h-px bg-[#3f4147]" />

                {/* Default Avatars */}
                <div className="grid grid-cols-6 gap-2">
                  {avatars.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => setAvatarUrl(url)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        avatarUrl === url ? 'border-[#23a559]' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      {url && (
                        <Image src={url} alt={`Avatar ${idx + 1}`} fill className="object-cover" unoptimized referrerPolicy="no-referrer" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-[#3f4147] hover:bg-[#4b4d54] text-white font-bold py-4 rounded-xl transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleFinish}
                  disabled={(!avatarUrl && !avatars[0]) || isFinishing}
                  className="flex-1 bg-[#23a559] hover:bg-[#1d8a4a] text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isFinishing ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Finish <Check className="w-5 h-5" /></>}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

