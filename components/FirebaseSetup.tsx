'use client';

import React, { useState, useEffect } from 'react';
import { InfoIcon, Settings2Icon, CheckCircle2Icon, AlertCircleIcon, XIcon } from "lucide-react";

export default function FirebaseSetup() {
  const [isConfigured, setIsConfigured] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [config, setConfig] = useState({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: ''
  });

  useEffect(() => {
    const checkConfig = () => {
      const hasEnvConfig = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
      const hasLocalConfig = !!localStorage.getItem('firebase_config_override');
      setIsConfigured(hasEnvConfig || hasLocalConfig);
    };

    checkConfig();
  }, []);

  const handleSave = () => {
    localStorage.setItem('firebase_config_override', JSON.stringify(config));
    window.location.reload();
  };

  const handleClear = () => {
    localStorage.removeItem('firebase_config_override');
    window.location.reload();
  };

  if (isConfigured) {
    return null;
  }

  return null; // Or return the setup UI if you want, but for now just return null to prevent crash
}

