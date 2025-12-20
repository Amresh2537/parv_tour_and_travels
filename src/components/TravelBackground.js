'use client';

import { useState, useEffect } from 'react';

export const TravelBackground = ({ 
  children, 
  variant = 'road', // 'road', 'mountains', 'car', 'city', 'minimal'
}) => {
  const [mounted, setMounted] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Local image paths
  const imagePaths = {
    road: '/images/backgrounds/mountain-road.jpg',
    mountains: '/images/backgrounds/mountain-road.jpg',
    car: '/images/backgrounds/1.jpg',
    city: '/images/backgrounds/luxury-travel.jpg',
    minimal: '/images/backgrounds/road-trip.jpg',
  };

  // Fallback solid colors if images fail to load
  const fallbackColors = {
    road: '#dbeafe', // Light blue
    mountains: '#a5f3fc', // Cyan
    car: '#f0f9ff', // Very light blue
    city: '#f8fafc', // Light gray
    minimal: '#ffffff', // White
  };

  // Test image loading
  useEffect(() => {
    if (mounted && imagePaths[variant]) {
      const img = new Image();
      img.src = imagePaths[variant];
      img.onload = () => {
        console.log(`✓ Image loaded successfully: ${imagePaths[variant]}`);
        setImageError(false);
      };
      img.onerror = () => {
        console.error(`✗ Failed to load image: ${imagePaths[variant]}`);
        setImageError(true);
      };
    }
  }, [mounted, variant]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50">
        {children}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background with Clear Local Image */}
      <div 
        className="fixed inset-0 z-0 transition-all duration-1000"
        style={{
          backgroundImage: imageError || !imagePaths[variant] 
            ? 'none'
            : `url(${imagePaths[variant]})`,
          backgroundColor: imageError ? fallbackColors[variant] : 'transparent',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          // REMOVED: filter (blur)
          // REMOVED: opacity overlay
        }}
        onError={() => setImageError(true)}
      >
        {/* REMOVED: All overlays and animated elements */}
      </div>

      {/* Content Area with transparent background */}
      <div className="relative z-10 min-h-screen bg-transparent">
        {children}
      </div>
    </div>
  );
};

// Enhanced Wrapper Component
export default function BackgroundImageWrapper({ children }) {
  const [bgVariant, setBgVariant] = useState('road');
  
  // Optional: Rotate backgrounds every 30 seconds
  useEffect(() => {
    const variants = ['road', 'mountains', 'car', 'city', 'minimal'];
    const interval = setInterval(() => {
      setBgVariant(variants[Math.floor(Math.random() * variants.length)]);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <TravelBackground variant={bgVariant}>
      {children}
    </TravelBackground>
  );
}