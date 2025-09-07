/**
 * MOBILE SDK INTEGRATION WITH FALLBACK
 * =====================================
 * 
 * This module attempts to load the real Quilibrium SDK for React Native.
 * If the SDK fails to load (due to WASM or other incompatibilities),
 * it falls back to a mock implementation.
 * 
 * Status: Testing real SDK integration with Expo Dev Build
 * 
 * See: .readme/tasks/todo/mobile-dev/passkey-sdk-expo-dev-integration-plan.md
 */

import React, { createContext, useContext, ReactNode, useState } from 'react';

// ============================================================================
// LAZY SDK LOADING - Delay loading to avoid hooks issues
// ============================================================================

let realSDK: any = null;
let isRealSDK = false;
let sdkLoadError: Error | null = null;
let loadAttempted = false;

const loadRealSDK = () => {
  if (loadAttempted) return realSDK;
  loadAttempted = true;
  
  try {
    console.log('[SDK] Attempting to load real Quilibrium SDK...');
    // Try to import the real SDK
    realSDK = require('@quilibrium/quilibrium-js-sdk-channels');
    isRealSDK = true;
    console.log('[SDK] ✅ Successfully loaded real Quilibrium SDK');
    console.log('[SDK] Available exports:', Object.keys(realSDK || {}));
    return realSDK;
  } catch (error: any) {
    sdkLoadError = error;
    console.warn('[SDK] ⚠️ Failed to load real SDK, will use mock implementation');
    console.warn('[SDK] Error:', error?.message || error);
    return null;
  }
};

// ============================================================================
// TYPE DEFINITIONS - Must match the real SDK interface
// ============================================================================

export interface UserKeyset {
  privateKey: string;
  publicKey: string;
  address: string;
}

export interface DeviceKeyset {
  privateKey: string;
  publicKey: string;
  address: string;
}

export interface UserRegistration {
  displayName: string;
  address: string;
  publicKey?: string;
  // Add other fields as needed to match real SDK
}

export interface PasskeyInfo {
  credentialId: string;
  address: string;
  publicKey?: string;
}

export interface StoredPasskey {
  credentialId: string;
  address: string;
  publicKey: string;
  displayName?: string;
  pfpUrl?: string;
  completedOnboarding?: boolean;
}

export interface PasskeysContextType {
  address: string | null;
  username: string | null;
  publicKey: string | null;
  credentialId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  currentPasskeyInfo: PasskeyInfo | null;
  
  // Methods that need to be mocked
  login: () => Promise<void>;
  logout: () => void;
  register: (username: string) => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateStoredPasskey: (credentialId: string, updates: Partial<StoredPasskey>) => void;
  exportKey?: (address: string) => Promise<string>;
}

// ============================================================================
// CHANNEL_RAW MOCK - Basic channel operations without encryption
// ============================================================================

const channel_raw_mock = {
  validateMessage: (message: any): boolean => {
    console.warn('[SDK Mock] validateMessage called - returning true');
    return true;
  },
  verifySignature: (message: any, signature: any, publicKey: any): boolean => {
    console.warn('[SDK Mock] verifySignature called - returning true');
    return true;
  },
  parseMessage: (message: any): any => {
    console.warn('[SDK Mock] parseMessage called - returning input');
    return message;
  },
  generateKeyset: (): { privateKey: string; publicKey: string; address: string } => {
    console.warn('[SDK Mock] generateKeyset called - returning mock keys');
    return {
      privateKey: 'mock_private_key',
      publicKey: 'mock_public_key',
      address: 'mock_address_' + Math.random().toString(36).substr(2, 9),
    };
  },
};

// ============================================================================
// CHANNEL MOCK - Secure channel operations with encryption
// ============================================================================

const channel_mock = {
  uploadUserRegistration: async (registration: any): Promise<void> => {
    console.warn('[SDK Mock] uploadUserRegistration called - no-op');
    return Promise.resolve();
  },
  lookupUser: async (address: string): Promise<UserRegistration | null> => {
    console.warn(`[SDK Mock] lookupUser called for ${address} - returning null`);
    return Promise.resolve(null);
  },
  encryptMessage: (message: any, recipientPublicKey: string): any => {
    console.warn('[SDK Mock] encryptMessage called - returning mock encrypted data');
    return {
      encrypted: true,
      data: message,
      recipientKey: recipientPublicKey,
    };
  },
  decryptMessage: (encryptedMessage: any, privateKey: string): any => {
    console.warn('[SDK Mock] decryptMessage called - returning mock decrypted data');
    return encryptedMessage.data || encryptedMessage;
  },
  signMessage: (message: any, privateKey: string): string => {
    console.warn('[SDK Mock] signMessage called - returning mock signature');
    return 'mock_signature_' + Math.random().toString(36).substr(2, 9);
  },
  // Re-export UserKeyset and DeviceKeyset types
  UserKeyset: {} as any,
  DeviceKeyset: {} as any,
  UserRegistration: {} as any,
};

// ============================================================================
// PASSKEYS CONTEXT MOCK
// ============================================================================

const PasskeysContext = createContext<PasskeysContextType | null>(null);

const PasskeysProviderMock: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Mock passkey info for testing mobile onboarding - using state for updates
  const [mockPasskeyInfo, setMockPasskeyInfo] = useState<PasskeyInfo & Partial<StoredPasskey>>({
    credentialId: 'mock_credential_id_12345',
    address: '0x1234567890abcdef1234567890abcdef12345678',
    publicKey: 'mock_public_key_abcdef123456',
    displayName: undefined,
    pfpUrl: undefined,
    completedOnboarding: false,
  });

  const mockValue: PasskeysContextType = {
    address: mockPasskeyInfo.address,
    username: mockPasskeyInfo.displayName || 'MockUser',
    publicKey: mockPasskeyInfo.publicKey,
    credentialId: mockPasskeyInfo.credentialId,
    isAuthenticated: true,
    isLoading: false,
    error: null,
    currentPasskeyInfo: mockPasskeyInfo,
    
    login: async () => {
      console.warn('[SDK Mock] Passkey login not available on mobile');
      throw new Error('Passkey authentication not available on mobile');
    },
    
    logout: () => {
      console.warn('[SDK Mock] Logout called - no-op');
    },
    
    register: async (username: string) => {
      console.warn(`[SDK Mock] Register called for ${username} - not available`);
      throw new Error('Passkey registration not available on mobile');
    },
    
    updateProfile: async (data: any) => {
      console.warn('[SDK Mock] updateProfile called - no-op');
    },
    
    deleteAccount: async () => {
      console.warn('[SDK Mock] deleteAccount called - not available');
      throw new Error('Account deletion not available on mobile');
    },

    updateStoredPasskey: (credentialId: string, updates: Partial<StoredPasskey>) => {
      console.warn('[SDK Mock] updateStoredPasskey called with:', updates);
      setMockPasskeyInfo(prev => ({
        ...prev,
        ...updates,
      }));
    },

    exportKey: async (address: string): Promise<string> => {
      console.warn('[SDK Mock] exportKey called - returning mock key data');
      return JSON.stringify({
        address: address,
        privateKey: 'mock_private_key_data_for_testing',
        createdAt: new Date().toISOString(),
        version: '1.0',
        isMockData: true,
      });
    },
  };

  return (
    <PasskeysContext.Provider value={mockValue}>
      {children}
    </PasskeysContext.Provider>
  );
};

const usePasskeysContextMock = (): PasskeysContextType => {
  const context = useContext(PasskeysContext);
  if (!context) {
    console.warn('[SDK Mock] usePasskeysContext called outside provider - returning mock');
    return {
      address: null,
      username: null,
      publicKey: null,
      credentialId: null,
      isAuthenticated: false,
      isLoading: false,
      error: 'Passkeys not available on mobile',
      currentPasskeyInfo: null,
      login: async () => { throw new Error('Not available'); },
      logout: () => {},
      register: async () => { throw new Error('Not available'); },
      updateProfile: async () => {},
      deleteAccount: async () => { throw new Error('Not available'); },
      updateStoredPasskey: () => { console.warn('[SDK Mock] updateStoredPasskey - no provider'); },
    };
  }
  return context;
};

// ============================================================================
// PASSKEY NAMESPACE EXPORT
// ============================================================================

const passkey_mock = {
  StoredPasskey: {} as StoredPasskey, // Type export for compatibility
};

// ============================================================================
// LAZY EXPORTS - Try real SDK first, fall back to mocks
// ============================================================================

// Export getters that attempt to load real SDK on first access
export const channel = new Proxy({} as any, {
  get(target, prop) {
    const sdk = loadRealSDK();
    if (sdk && sdk.channel) {
      return sdk.channel[prop];
    }
    return channel_mock[prop];
  }
});

export const channel_raw = new Proxy({} as any, {
  get(target, prop) {
    const sdk = loadRealSDK();
    if (sdk && sdk.channel_raw) {
      return sdk.channel_raw[prop];
    }
    return channel_raw_mock[prop];
  }
});

export const passkey = new Proxy({} as any, {
  get(target, prop) {
    const sdk = loadRealSDK();
    if (sdk && sdk.passkey) {
      return sdk.passkey[prop];
    }
    return passkey_mock[prop];
  }
});

// For React components, we need to export them directly (can't use Proxy)
export const PasskeysProvider: React.FC<{ children: ReactNode }> = (props) => {
  const sdk = loadRealSDK();
  if (sdk && sdk.PasskeysProvider) {
    const RealProvider = sdk.PasskeysProvider;
    return <RealProvider {...props} />;
  }
  return <PasskeysProviderMock {...props} />;
};

export const usePasskeysContext = (): PasskeysContextType => {
  const sdk = loadRealSDK();
  if (sdk && sdk.usePasskeysContext) {
    try {
      return sdk.usePasskeysContext();
    } catch (error) {
      console.warn('[SDK] Real usePasskeysContext failed, using mock:', error);
    }
  }
  return usePasskeysContextMock();
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  channel,
  channel_raw,
  passkey,
  PasskeysProvider,
  usePasskeysContext,
};

/**
 * IMPLEMENTATION NOTES:
 * =====================
 * 
 * Current Status:
 * - SDK loading is deferred until first use to avoid React hooks issues
 * - Uses Proxy objects to dynamically switch between real and mock implementations
 * - React components are wrapped to handle the conditional loading
 * 
 * Known Issues:
 * - WebAssembly features will not work (stubbed in polyfills)
 * - Some crypto operations may fail if they rely on WASM
 * - Passkey authentication needs native module implementation
 */