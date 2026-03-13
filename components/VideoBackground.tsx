'use client';

import React from 'react';

export default function VideoBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute min-w-full min-h-full object-cover opacity-70"
      >
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260206_044704_dd33cb15-c23f-4cfc-aa09-a0465d4dcb54.mp4"
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>
      {/* Overlay to ensure readability */}
      <div className="absolute inset-0 bg-black/20" />
    </div>
  );
}
