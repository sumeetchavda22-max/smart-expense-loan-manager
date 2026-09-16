import React, { useEffect, useRef, useState } from 'react';
import { Delete, Fingerprint, ShieldCheck } from 'lucide-react';
import { useAuthPin } from '../../context/AuthPinContext';

export const PINLockModal: React.FC = () => {
  const { isLocked, unlockApp, biometricEnabled, unlockWithBiometric } = useAuthPin();
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const [biometricPrompting, setBiometricPrompting] = useState(false);
  const autoPromptedRef = useRef(false);

  const tryBiometric = async () => {
    setBiometricPrompting(true);
    setError(false);
    const ok = await unlockWithBiometric();
    setBiometricPrompting(false);
    if (!ok) setPin('');
  };

  // Prompt Face ID / Fingerprint automatically as soon as the lock screen appears — same as
  // a native app — but only once per lock session, so a cancelled prompt doesn't loop.
  useEffect(() => {
    if (isLocked && biometricEnabled && !autoPromptedRef.current) {
      autoPromptedRef.current = true;
      tryBiometric();
    }
    if (!isLocked) autoPromptedRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLocked, biometricEnabled]);

  if (!isLocked) return null;

  const handleNumClick = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError(false);

      if (nextPin.length === 4) {
        setTimeout(() => {
          const success = unlockApp(nextPin);
          if (!success) {
            setError(true);
            setPin('');
          }
        }, 150);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 pt-safe pb-safe animate-in fade-in duration-300" role="dialog" aria-modal="true" aria-label="Enter PIN">
      <div className="w-full max-w-sm flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-xl shadow-brand-500/30">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Enter Security PIN</h2>
          <p className="text-xs text-slate-400 mt-1">
            {biometricPrompting ? 'Waiting for Face ID / Fingerprint…' : 'SMT-C is locked'}
          </p>
        </div>

        {biometricEnabled && (
          <button
            onClick={tryBiometric}
            disabled={biometricPrompting}
            className="flex items-center gap-2 px-4 py-2.5 min-h-[2.75rem] rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white text-sm font-semibold shadow-md active:scale-95 transition-all disabled:opacity-60"
          >
            <Fingerprint className={`w-5 h-5 ${biometricPrompting ? 'animate-pulse text-brand-400' : 'text-brand-400'}`} />
            <span>Use Face ID / Fingerprint</span>
          </button>
        )}

        {/* PIN Dots */}
        <div className="flex items-center space-x-4 my-2">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                idx < pin.length
                  ? 'bg-brand-500 border-brand-500 shadow-md shadow-brand-500/50 scale-110'
                  : 'border-slate-700 bg-transparent'
              } ${error ? 'border-red-500 bg-red-500 animate-bounce' : ''}`}
            />
          ))}
        </div>

        {error && <p className="text-xs font-semibold text-red-400">Incorrect PIN code. Try again.</p>}

        {/* Keypad Grid */}
        <div className="grid grid-cols-3 gap-3 xs:gap-4 w-full max-w-xs pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleNumClick(num)}
              className="w-[4.25rem] h-[4.25rem] xs:w-[4.5rem] xs:h-[4.5rem] mx-auto rounded-full bg-slate-800/80 hover:bg-slate-700 active:bg-brand-600 text-white font-semibold text-2xl flex items-center justify-center transition-all shadow-md active:scale-95 select-none"
            >
              {num}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleNumClick('0')}
            className="w-16 h-16 mx-auto rounded-full bg-slate-800/80 hover:bg-slate-700 active:bg-brand-600 text-white font-semibold text-xl flex items-center justify-center transition-all shadow-md active:scale-95"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="w-16 h-16 mx-auto rounded-full bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all active:scale-95"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
