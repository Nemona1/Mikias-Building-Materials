'use client';

import { useState, useEffect } from 'react';
import { X, Shield, Timer, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function OTPModal({ isOpen, onClose, onVerify, title, description, deviceInfo }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(600); // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setOtp(['', '', '', '', '', '']);
    setTimer(600);
    setCanResend(false);
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }
    setLoading(true);
    await onVerify(code);
    setLoading(false);
  };

  const handleResend = async () => {
    setCanResend(false);
    setTimer(600);
    toast.success('New verification code sent');
    // Parent component should handle resend logic via prop
  };

  if (!isOpen) return null;

  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-300 mb-4">{description}</p>

          {deviceInfo && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4 text-sm">
              <p className="font-medium text-gray-900 dark:text-white">Device: {deviceInfo.deviceName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Location: {deviceInfo.location}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">IP: {deviceInfo.ipAddress}</p>
            </div>
          )}

          <div className="flex justify-center gap-2 my-6">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-${idx}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-12 h-14 text-center text-2xl font-bold rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                autoFocus={idx === 0}
              />
            ))}
          </div>

          <div className="flex justify-between items-center text-sm mb-4">
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <Timer className="h-4 w-4" />
              <span>Code expires in {minutes}:{seconds.toString().padStart(2, '0')}</span>
            </div>
            {canResend ? (
              <button onClick={handleResend} className="text-primary hover:underline">
                Resend code
              </button>
            ) : (
              <span className="text-gray-400">Resend available soon</span>
            )}
          </div>

          <div className="bg-yellow-500/10 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5" />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                A verification code has been sent to your registered email address. 
                This adds an extra layer of security to confirm it's really you.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="flex-1">
              {loading ? 'Verifying...' : 'Verify & Revoke'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}