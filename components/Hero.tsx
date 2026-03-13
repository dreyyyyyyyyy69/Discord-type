'use client';

import React from 'react';
import { motion } from 'motion/react';

export default function Hero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-[#21346e] font-rubik">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260206_044704_dd33cb15-c23f-4cfc-aa09-a0465d4dcb54.mp4"
          type="video/mp4"
        />
      </video>

      {/* Overlay to ensure text readability if needed, though request didn't specify one */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Content Container */}
      <div className="relative z-10 container mx-auto px-6 pt-32 md:pt-48">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-start"
        >
          {/* Headline */}
          <h1 className="flex flex-col text-6xl md:text-8xl lg:text-[100px] font-bold uppercase text-white leading-[0.98] tracking-[-2px] md:tracking-[-4px]">
            <span>NEW ERA</span>
            <span>OF DESIGN</span>
            <span>STARTS NOW</span>
          </h1>

          {/* Custom CTA Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative mt-12 w-[184px] h-[65px] flex items-center justify-center group outline-none"
          >
            {/* SVG Background */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 184 65"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 0H184V45L164 65H0V0Z"
                fill="white"
              />
            </svg>
            
            {/* Button Text */}
            <span className="relative z-10 text-[20px] font-bold uppercase text-[#161a20]">
              GET STARTED
            </span>
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
