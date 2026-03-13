'use client';

import { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { Sparkles, ArrowRight } from 'lucide-react';
import BlurIn from './animations/BlurIn';
import SplitText from './animations/SplitText';
import Link from 'next/link';

interface HeroSectionProps {
  showContent?: boolean;
}

export default function HeroSection({ showContent = true }: HeroSectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsUrl = "https://stream.mux.com/s8pMcOvMQXc4GD6AX4e1o01xFogFxipmuKltNfSYza0200.m3u8";

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(e => console.error("Video play failed:", e));
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(e => console.error("Video play failed:", e));
      });
    }
  }, []);

  return (
    <section className="relative w-full h-screen overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          className="ml-[200px] w-full h-full object-cover scale-[1.2] origin-left"
        />
        {/* Bottom Fade Gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#070612] to-transparent z-10" />
      </div>

      {/* Content */}
      {showContent && (
        <div className="relative z-20 h-full max-w-7xl mx-auto px-6 lg:px-12 flex flex-col justify-center">
          <div className="flex flex-col gap-12">
            {/* Badge & Heading Group */}
            <div className="flex flex-col gap-6">
              <BlurIn duration={0.6}>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-sm bg-white/5">
                  <Sparkles className="w-3 h-3 text-white/80" />
                  <span className="text-sm font-medium text-white/80">New AI Automation Ally</span>
                </div>
              </BlurIn>

              <div className="flex flex-col gap-2">
                <SplitText 
                  text="Unlock the Power of AI" 
                  className="text-4xl md:text-5xl lg:text-6xl font-medium text-white leading-tight lg:leading-[1.2] block"
                />
                <div className="flex flex-wrap items-baseline gap-x-[0.3em]">
                  <SplitText 
                    text="for Your" 
                    delay={0.5}
                    className="text-4xl md:text-5xl lg:text-6xl font-medium text-white leading-tight lg:leading-[1.2]"
                  />
                  <SplitText 
                    text="Business." 
                    delay={0.7}
                    className="text-4xl md:text-5xl lg:text-6xl font-medium text-white leading-tight lg:leading-[1.2] italic font-serif"
                  />
                </div>
              </div>

              <BlurIn delay={0.4} duration={0.6}>
                <p className="text-white/80 text-lg font-normal leading-relaxed max-w-xl">
                  Our cutting-edge AI platform automates, analyzes, and accelerates your workflows so you can focus on what really matters.
                </p>
              </BlurIn>
            </div>

            {/* CTA Buttons */}
            <BlurIn delay={0.6} duration={0.6}>
              <div className="flex flex-wrap gap-4">
                <Link 
                  href="/book-call"
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-white text-[#070612] font-bold hover:bg-white/90 transition-colors"
                >
                  Book A Free Call
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <button className="px-8 py-3 rounded-full bg-white/20 backdrop-blur-sm text-white font-bold hover:bg-white/30 transition-colors">
                  Learn now
                </button>
              </div>
            </BlurIn>
          </div>
        </div>
      )}
    </section>
  );
}
