import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Face ID / Touch ID / Android fingerprint, via the WebAuthn platform-authenticator API.
 * There's no server here (everything is on-device), so this isn't "log in to a backend" —
 * it just asks the OS to run its native biometric prompt and, on success, unlocks the app
 * the same way a correct PIN would. The credential id is the only thing persisted; nothing
 * biometric ever leaves the device (the OS/secure-enclave handles that part entirely).
 */

const PIN_STORAGE_KEY = 'app_pin_code';
const BIOMETRIC_CREDENTIAL_KEY = 'app_biometric_credential_id';

function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const str = atob(padded);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
  return bytes.buffer;
}

const randomChallenge = (): Uint8Array => {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return arr;
};

interface AuthPinContextType {
  isLocked: boolean;
  pinRequired: boolean;
  pinCode: string | null;
  unlockApp: (enteredPin: string) => boolean;
  setPin: (newPin: string | null) => void;
  lockApp: () => void;
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  enableBiometric: () => Promise<{ ok: boolean; error?: string }>;
  disableBiometric: () => void;
  unlockWithBiometric: () => Promise<boolean>;
}

const AuthPinContext = createContext<AuthPinContextType>({
  isLocked: false,
  pinRequired: false,
  pinCode: null,
  unlockApp: () => false,
  setPin: () => {},
  lockApp: () => {},
  biometricAvailable: false,
  biometricEnabled: false,
  enableBiometric: async () => ({ ok: false, error: 'Not available' }),
  disableBiometric: () => {},
  unlockWithBiometric: async () => false,
});

export const AuthPinProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pinCode, setPinCodeState] = useState<string | null>(() => {
    return localStorage.getItem(PIN_STORAGE_KEY) || null;
  });

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    return !!localStorage.getItem(PIN_STORAGE_KEY);
  });

  const [biometricEnabled, setBiometricEnabled] = useState<boolean>(() => {
    return !!localStorage.getItem(BIOMETRIC_CREDENTIAL_KEY);
  });
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    const check = (window as any).PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable;
    if (typeof check === 'function') {
      check.call((window as any).PublicKeyCredential).then(setBiometricAvailable).catch(() => setBiometricAvailable(false));
    }
  }, []);

  const pinRequired = !!pinCode;

  const unlockApp = (enteredPin: string): boolean => {
    if (!pinCode || enteredPin === pinCode) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const setPin = (newPin: string | null) => {
    if (newPin) {
      localStorage.setItem(PIN_STORAGE_KEY, newPin);
      setPinCodeState(newPin);
      setIsLocked(false);
    } else {
      // Biometric unlock only makes sense as a companion to the PIN — clear it too so a
      // stale credential can't unlock an app that no longer has a lock configured.
      localStorage.removeItem(PIN_STORAGE_KEY);
      localStorage.removeItem(BIOMETRIC_CREDENTIAL_KEY);
      setPinCodeState(null);
      setBiometricEnabled(false);
      setIsLocked(false);
    }
  };

  const lockApp = () => {
    if (pinCode) {
      setIsLocked(true);
    }
  };

  const enableBiometric = async (): Promise<{ ok: boolean; error?: string }> => {
    if (!pinCode) return { ok: false, error: 'Set a Security PIN first.' };
    if (!(window as any).PublicKeyCredential) return { ok: false, error: 'Face ID / Fingerprint isn’t supported on this browser.' };
    try {
      const userId = new Uint8Array(16);
      crypto.getRandomValues(userId);

      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge: randomChallenge(),
          rp: { name: 'SmartFinance' },
          user: { id: userId, name: 'smartfinance-device', displayName: 'SmartFinance' },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },
            { type: 'public-key', alg: -257 },
          ],
          authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
          timeout: 60000,
        },
      } as any)) as PublicKeyCredential | null;

      if (!credential) return { ok: false, error: 'Setup was cancelled.' };
      localStorage.setItem(BIOMETRIC_CREDENTIAL_KEY, bufferToBase64url(credential.rawId));
      setBiometricEnabled(true);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.name === 'NotAllowedError' ? 'Setup was cancelled.' : err?.message || 'Could not set up Face ID / Fingerprint.' };
    }
  };

  const disableBiometric = () => {
    localStorage.removeItem(BIOMETRIC_CREDENTIAL_KEY);
    setBiometricEnabled(false);
  };

  const unlockWithBiometric = async (): Promise<boolean> => {
    const credId = localStorage.getItem(BIOMETRIC_CREDENTIAL_KEY);
    if (!credId || !(window as any).PublicKeyCredential) return false;
    try {
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: randomChallenge(),
          allowCredentials: [{ id: base64urlToBuffer(credId), type: 'public-key' }],
          userVerification: 'required',
          timeout: 60000,
        },
      } as any);
      if (assertion) {
        setIsLocked(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <AuthPinContext.Provider
      value={{
        isLocked,
        pinRequired,
        pinCode,
        unlockApp,
        setPin,
        lockApp,
        biometricAvailable,
        biometricEnabled,
        enableBiometric,
        disableBiometric,
        unlockWithBiometric,
      }}
    >
      {children}
    </AuthPinContext.Provider>
  );
};

export const useAuthPin = () => useContext(AuthPinContext);
