'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function AlreadyVerifiedPage() {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = '/login';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <Card className="max-w-md w-full p-8 text-center">
        <div className="h-20 w-20 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-10 w-10 text-warning" />
        </div>
        
        <h2 className="text-2xl font-bold text-foreground mb-2">Already Verified</h2>
        <p className="text-muted mb-2">This email has already been verified.</p>
        <p className="text-sm text-muted mb-4">You can log in directly to your account.</p>
        
        <p className="text-sm text-muted mb-3">Redirecting to login in {countdown} seconds...</p>
        
        <div className="w-full bg-border rounded-full h-2 mb-4">
          <div 
            className="bg-warning h-2 rounded-full transition-all duration-1000"
            style={{ width: `${(countdown / 5) * 100}%` }}
          />
        </div>
        
        <Link 
          href="/login" 
          className="inline-flex items-center gap-2 text-primary hover:text-primary-hover text-sm transition-colors"
        >
          Click here to log in
          <ArrowRight className="h-3 w-3" />
        </Link>
      </Card>
    </div>
  );
}