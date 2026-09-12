import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthPinContextType {
  isLocked: boolean;
  pinRequired: boolean;
  pinCode: string | null;
  unlockApp: (enteredPin: string) => boolean;
  setPin: (newPin: string | null) => void;
  lockApp: () => void;
}

const AuthPinContext = createContext<AuthPinContextType>({
  isLocked: false,
  pinRequired: false,
  pinCode: null,
  unlockApp: () => false,
  setPin: () => {},
  lockApp: () => {},
});

export const AuthPinProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pinCode, setPinCodeState] = useState<string | null>(() => {
    return localStorage.getItem('app_pin_code') || null;
  });

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    return !!localStorage.getItem('app_pin_code');
  });

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
      localStorage.setItem('app_pin_code', newPin);
      setPinCodeState(newPin);
      setIsLocked(false);
    } else {
      localStorage.removeItem('app_pin_code');
      setPinCodeState(null);
      setIsLocked(false);
    }
  };

  const lockApp = () => {
    if (pinCode) {
      setIsLocked(true);
    }
  };

  return (
    <AuthPinContext.Provider value={{ isLocked, pinRequired, pinCode, unlockApp, setPin, lockApp }}>
      {children}
    </AuthPinContext.Provider>
  );
};

export const useAuthPin = () => useContext(AuthPinContext);
