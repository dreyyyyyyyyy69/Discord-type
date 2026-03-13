'use client';

import { useState, useRef, useEffect } from 'react';
import { useStore, Addon } from '@/store/useStore';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { Link as LinkIcon, Plus, ExternalLink, Sparkles, Youtube, Globe, Bot, Upload, Loader2, Image as ImageIcon, Check, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { GoogleGenAI } from "@google/genai";

export default function AddonsTab() {
  const { addons, setAddons, user } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<Addon['type']>('tool');
  const [iconUrl, setIconUrl] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | Addon['type']>('all');
  const [showInWorkspaces, setShowInWorkspaces] = useState(true);
  
  const iconInputRef = useRef<HTMLInputElement>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  const generateAIIcon = async () => {
    if (!name.trim()) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: `A professional, high-quality app icon for an AI tool named ${name}. Minimalist, modern, tech-oriented design.`,
            },
          ],
        },
      });
      
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setIconUrl(`data:image/png;base64,${part.inlineData.data}`);
          break;
        }
      }
    } catch (error) {
      console.error('Error generating icon:', error);
      setIconUrl(`https://picsum.photos/seed/${name}/150/150`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'icon' | 'screenshot') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'icon') setIconUrl(reader.result as string);
        else setScreenshotUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim() || isSaving) return;

    setIsSaving(true);
    try {
      await addDoc(collection(db, "addons"), {
        name: name.trim(),
        url: url.trim(),
        type,
        iconUrl: iconUrl || `https://picsum.photos/seed/${name}/150/150`,
        screenshotUrl: screenshotUrl || null,
        showInWorkspaces,
        createdBy: user?.uid,
      });

      setName('');
      setUrl('');
      setType('tool');
      setIconUrl('');
      setScreenshotUrl('');
      setShowInWorkspaces(true);
      setIsAdding(false);
    } catch (error) {
      console.error("Error adding addon:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "addons", id));
    } catch (error) {
      console.error("Error deleting addon:", error);
    }
  };

  const filteredAddons = activeCategory === 'all' ? addons : addons.filter(a => a.type === activeCategory);

  return (
    <div className="flex-1 flex flex-col bg-transparent p-4 sm:p-8 overflow-y-auto">
      <div className="max-w-6xl w-full mx-auto space-y-6 sm:space-y-12">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 bg-white/5 backdrop-blur-2xl p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-white/10 shadow-2xl">
          <div>
            <h2 className="text-2xl sm:text-4xl font-black text-white flex items-center gap-3 sm:gap-4 tracking-tighter">
              <LinkIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white/40" /> Addons Hub
            </h2>
            <p className="text-white/30 mt-1 sm:mt-3 text-sm sm:text-lg font-medium">Manage AI tools, video links, and websites.</p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex bg-white/5 backdrop-blur-md p-1 rounded-xl sm:rounded-2xl border border-white/10">
              {(['all', 'tool', 'video', 'website'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 sm:px-8 py-2 sm:py-4 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeCategory === cat ? 'bg-white/10 text-white shadow-2xl border border-white/20' : 'text-white/20 hover:text-white/60'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-black px-6 sm:px-10 py-3 sm:py-5 rounded-xl sm:rounded-2xl border border-white/20 transition-all flex items-center gap-2 sm:gap-4 shadow-2xl uppercase tracking-widest text-[8px] sm:text-[10px]"
            >
              {isAdding ? 'Cancel' : <><Plus className="w-4 h-4 sm:w-6 sm:h-6" /> Add</>}
            </button>
          </div>
        </div>

        {isAdding && (
          <div className="bg-white/5 backdrop-blur-2xl p-6 sm:p-12 rounded-[2rem] sm:rounded-[3rem] border border-white/10 animate-in fade-in slide-in-from-top-6 shadow-[0_30px_60px_rgba(0,0,0,0.4)]">
            <h3 className="text-xl sm:text-3xl font-black text-white mb-6 sm:mb-10 flex items-center gap-3 sm:gap-4 tracking-tight">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400" /> Create New Addon
            </h3>
            
            <form onSubmit={handleAdd} className="space-y-6 sm:space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10">
                {/* Basic Info */}
                <div className="md:col-span-2 space-y-6 sm:space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                    <div className="space-y-2 sm:space-y-4">
                      <label className="text-[8px] sm:text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Type</label>
                      <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        {[
                          { id: 'tool', icon: Bot, label: 'Tool' },
                          { id: 'video', icon: Youtube, label: 'Video' },
                          { id: 'website', icon: Globe, label: 'Web' }
                        ].map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setType(t.id as any)}
                            className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all gap-2 sm:gap-3 ${
                              type === t.id ? 'bg-white/10 border-white/30 text-white shadow-2xl' : 'bg-white/5 border-white/10 text-white/20 hover:border-white/20'
                            }`}
                          >
                            <t.icon className="w-4 h-4 sm:w-6 sm:h-6" />
                            <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-widest">{t.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2 sm:space-y-4">
                      <label className="text-[8px] sm:text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. ChatGPT"
                        className="w-full bg-white/5 text-white placeholder:text-white/20 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-5 focus:outline-none focus:ring-2 focus:ring-white/20 border border-white/10 backdrop-blur-md font-black tracking-tight text-sm sm:text-lg"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2 sm:space-y-4">
                    <label className="text-[8px] sm:text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">URL</label>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-white/5 text-white placeholder:text-white/20 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-5 focus:outline-none focus:ring-2 focus:ring-white/20 border border-white/10 backdrop-blur-md font-black tracking-tight text-sm sm:text-lg"
                      required
                    />
                  </div>

                  <div className="flex items-center gap-4 bg-white/5 p-6 rounded-2xl border border-white/10">
                    <div className="flex-1">
                      <h4 className="text-white font-black text-xs uppercase tracking-widest">Enable for Workspaces</h4>
                      <p className="text-white/40 text-[9px] font-medium">If enabled, this addon will be available to add to channels.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowInWorkspaces(!showInWorkspaces)}
                      className={`w-14 h-8 rounded-full p-1 transition-all ${showInWorkspaces ? 'bg-emerald-500' : 'bg-white/10'}`}
                    >
                      <div className={`w-6 h-6 bg-white rounded-full transition-all ${showInWorkspaces ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

                {/* Icon Selection */}
                <div className="space-y-2 sm:space-y-4">
                  <label className="text-[8px] sm:text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Icon / Profile</label>
                  <div className="bg-white/5 rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 p-4 sm:p-8 flex flex-col items-center gap-4 sm:gap-8 backdrop-blur-md shadow-2xl">
                    <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden border border-white/20 bg-white/5 shadow-2xl">
                      {iconUrl ? (
                        <Image src={iconUrl} alt="Icon" fill className="object-cover" unoptimized referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/10">
                          <ImageIcon className="w-8 h-8 sm:w-12 sm:h-12" />
                        </div>
                      )}
                      {isGenerating && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 sm:gap-3 w-full">
                      <button
                        type="button"
                        onClick={() => iconInputRef.current?.click()}
                        className="w-full bg-white/5 hover:bg-white/10 text-white text-[8px] sm:text-[10px] font-black uppercase py-3 sm:py-4 rounded-lg sm:rounded-xl border border-white/10 flex items-center justify-center gap-2 sm:gap-3 transition-all"
                      >
                        <Upload className="w-3 h-3 sm:w-4 sm:h-4" /> Upload
                        <input type="file" ref={iconInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'icon')} />
                      </button>
                      {type === 'tool' && (
                        <button
                          type="button"
                          onClick={generateAIIcon}
                          disabled={isGenerating || !name.trim()}
                          className="w-full bg-white/10 hover:bg-white/20 text-white text-[8px] sm:text-[10px] font-black uppercase py-3 sm:py-4 rounded-lg sm:rounded-xl border border-white/20 flex items-center justify-center gap-2 sm:gap-3 transition-all disabled:opacity-50 shadow-xl"
                        >
                          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" /> AI Generate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Screenshot Upload (for tools/websites) */}
              {(type === 'tool' || type === 'website') && (
                <div className="space-y-2 sm:space-y-4">
                  <label className="text-[8px] sm:text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Demo Screenshot</label>
                  <div 
                    onClick={() => screenshotInputRef.current?.click()}
                    className="w-full h-40 sm:h-56 bg-white/5 rounded-[2rem] sm:rounded-[3rem] border-2 border-dashed border-white/10 hover:border-white/30 transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group backdrop-blur-md shadow-2xl"
                  >
                    {screenshotUrl ? (
                      <Image src={screenshotUrl} alt="Screenshot" fill className="object-cover opacity-60 group-hover:opacity-100 transition-opacity" unoptimized referrerPolicy="no-referrer" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 sm:w-12 sm:h-12 text-white/10 mb-2 sm:mb-4" />
                        <span className="text-[8px] sm:text-[10px] text-white/30 font-black uppercase tracking-widest">Click to upload</span>
                      </>
                    )}
                    <input type="file" ref={screenshotInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'screenshot')} />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-4 sm:gap-8 pt-4 sm:pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-6 sm:px-10 py-3 sm:py-5 text-white/30 font-black uppercase tracking-widest text-[8px] sm:text-[10px] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !name.trim() || !url.trim()}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-black px-8 sm:px-14 py-3 sm:py-5 rounded-xl sm:rounded-2xl border border-white/20 transition-all shadow-2xl disabled:opacity-50 uppercase tracking-widest text-[8px] sm:text-[10px]"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : 'Save Addon'}
                </button>
              </div>
            </form>
          </div>
        )}

        {filteredAddons.length === 0 ? (
          <div className="text-center py-16 sm:py-32 bg-white/5 backdrop-blur-2xl rounded-[2rem] sm:rounded-[4rem] border border-white/10 border-dashed shadow-2xl">
            <div className="w-20 h-20 sm:w-32 sm:h-32 bg-white/5 rounded-[2rem] sm:rounded-[3rem] flex items-center justify-center mx-auto mb-6 sm:mb-10 border border-white/10 rotate-12 shadow-2xl">
              <LinkIcon className="w-10 h-10 sm:w-14 sm:h-14 text-white/10" />
            </div>
            <h3 className="text-xl sm:text-3xl font-black text-white mb-2 sm:mb-4 tracking-tight">No addons found</h3>
            <p className="text-white/20 font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[8px] sm:text-[10px]">
              {activeCategory === 'all' ? 'Start by adding your favorite AI tools, videos, or websites.' : `You haven't added any ${activeCategory}s yet.`}
            </p>
          </div>
        ) : (
          <div className="space-y-16 sm:space-y-24">
            {(['tool', 'video', 'website'] as const).map((cat) => {
              const catAddons = filteredAddons.filter(a => a.type === cat);
              if (catAddons.length === 0 && activeCategory !== 'all') return null;
              if (catAddons.length === 0) return null;

              return (
                <div key={cat} className="space-y-6 sm:space-y-10">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white/5 rounded-xl sm:rounded-2xl flex items-center justify-center border border-white/10 shadow-xl">
                      {cat === 'tool' ? <Bot className="w-5 h-5 sm:w-7 sm:h-7 text-white/40" /> : cat === 'video' ? <Youtube className="w-5 h-5 sm:w-7 sm:h-7 text-white/40" /> : <Globe className="w-5 h-5 sm:w-7 sm:h-7 text-white/40" />}
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tighter">{cat}s</h3>
                      <p className="text-white/20 text-[8px] sm:text-[10px] font-black uppercase tracking-widest">Manage your {cat} collection</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-10">
                    {catAddons.map((addon) => (
                      <div
                        key={addon.id}
                        className="bg-white/5 backdrop-blur-2xl p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-white/10 flex flex-col h-full hover:bg-white/10 transition-all group hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] sm:hover:shadow-[0_40px_80px_rgba(0,0,0,0.5)]"
                      >
                        {/* Header/Screenshot */}
                        <div className="h-32 sm:h-40 bg-white/5 rounded-[1.5rem] sm:rounded-[2rem] relative flex items-center justify-center overflow-hidden mb-6 sm:mb-8 border border-white/10">
                          {addon.screenshotUrl ? (
                            <Image src={addon.screenshotUrl} alt="Screenshot" fill className="object-cover opacity-40 group-hover:opacity-60 transition-opacity" unoptimized referrerPolicy="no-referrer" />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                          )}
                          
                          {/* Icon */}
                          <div className="relative z-10 w-16 h-16 sm:w-24 sm:h-24 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden border-4 border-white/10 shadow-2xl group-hover:scale-110 transition-transform">
                            {addon.iconUrl && (
                              <Image src={addon.iconUrl} alt={addon.name} fill className="object-cover" unoptimized referrerPolicy="no-referrer" />
                            )}
                          </div>
                          
                          {/* Workspace Badge */}
                          {addon.showInWorkspaces && (
                            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-emerald-500/20 backdrop-blur-xl px-2 sm:px-4 py-1 sm:py-2 rounded-full flex items-center gap-1 sm:gap-2 border border-emerald-500/20">
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-widest text-emerald-400">Workspace</span>
                            </div>
                          )}
                          
                          {/* Delete Button */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDelete(addon.id);
                            }}
                            className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-red-500/20 hover:bg-red-500/40 backdrop-blur-xl p-2 rounded-full flex items-center justify-center border border-red-500/20 transition-colors z-20"
                            title="Delete Addon"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>

                        <div className="flex-1 flex flex-col">
                          <h4 className="text-white font-black text-lg sm:text-xl mb-1 sm:mb-2 tracking-tight truncate group-hover:text-white/80 transition-colors">{addon.name}</h4>
                          <p className="text-white/20 text-[8px] sm:text-[10px] font-black uppercase tracking-widest truncate mb-6 sm:mb-8">{addon.url}</p>
                          
                          <div className="mt-auto pt-6 sm:pt-8 flex items-center justify-between border-t border-white/10">
                            <a
                              href={addon.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-black text-white hover:text-white/60 transition-colors uppercase tracking-widest"
                            >
                              Open <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                            </a>
                            <div className="flex items-center gap-1 sm:gap-2 text-[7px] sm:text-[9px] font-black text-white/20 uppercase tracking-widest">
                              {addon.type === 'video' ? 'Video DP' : 'Tool Icon'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
