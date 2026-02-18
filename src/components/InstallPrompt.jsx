'use client';

import { useState, useEffect } from 'react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    });

    // Check if already installed (for iOS)
    if (isIOSDevice) {
      // For iOS, we can't detect installation, so show iOS instructions
      setTimeout(() => {
        if (!isInstalled) {
          setShowPrompt(true);
        }
      }, 3000);
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Store in localStorage that user dismissed
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Check if user dismissed before
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed === 'true') {
      setShowPrompt(false);
    }
  }, []);

  if (isInstalled || !showPrompt) return null;

  // iOS Installation Instructions
  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-lg shadow-xl border border-blue-100 p-4 z-50 animate-slide-up">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">
              Install PARV Tour & Travels
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Install this app on your iPhone:
            </p>
            <div className="mt-2 text-xs text-gray-600">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-blue-600">1.</span>
                <span>Tap Share</span>
                <span className="text-blue-600">📤</span>
              </div>
              <div className="flex items-center gap-1 mb-1">
                <span className="text-blue-600">2.</span>
                <span>Scroll down and tap</span>
                <span className="text-blue-600">"Add to Home Screen"</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-blue-600">3.</span>
                <span>Tap "Add" in top right</span>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded hover:bg-gray-200 transition-colors w-full"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Android Installation
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-lg shadow-xl border border-blue-100 p-4 z-50 animate-slide-up">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">P</span>
          </div>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-900">
            Install PARV Tour & Travels
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Install as app for quick access and better experience
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
            >
              Install App
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded hover:bg-gray-200 transition-colors"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}