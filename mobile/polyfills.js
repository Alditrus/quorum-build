/**
 * React Native Polyfills for Quilibrium SDK
 * ==========================================
 * 
 * This file sets up necessary polyfills for the Quilibrium SDK to work
 * in React Native environment. Must be imported before any SDK usage.
 * 
 * IMPORTANT: Import order matters! Do not rearrange imports.
 */

// Step 1: Random values for crypto operations
import 'react-native-get-random-values';

// Step 2: Random bytes generation
import 'react-native-randombytes';

// Step 3: Crypto module implementation
import crypto from 'react-native-crypto';

// Step 4: Make crypto available globally for SDK
global.crypto = crypto;

// Step 5: Add basic WebCrypto API stub if not present
// The SDK might expect crypto.subtle for certain operations
if (!global.crypto.subtle) {
  global.crypto.subtle = {
    // Add stub methods as needed based on SDK requirements
    digest: async (algorithm, data) => {
      console.warn('[Polyfill] crypto.subtle.digest called - using fallback');
      // Fallback implementation or throw error
      throw new Error('crypto.subtle.digest not implemented in React Native');
    },
    generateKey: async () => {
      console.warn('[Polyfill] crypto.subtle.generateKey called - using fallback');
      throw new Error('crypto.subtle.generateKey not implemented in React Native');
    },
    // Add more methods as needed
  };
}

// Step 6: Buffer polyfill (already available from main package.json)
global.Buffer = require('buffer').Buffer;

// Step 7: Process polyfill for Node.js compatibility
global.process = global.process || {};
global.process.env = global.process.env || {};
global.process.version = global.process.version || 'v16.0.0'; // Mock Node version

// Step 8: WebAssembly stub (SDK contains WASM that won't work in React Native)
if (!global.WebAssembly) {
  console.warn('[Polyfill] WebAssembly not available - adding stub');
  global.WebAssembly = {
    instantiate: (source, imports) => {
      console.error('[Polyfill] WebAssembly.instantiate called but not supported in React Native');
      console.error('[Polyfill] WASM features will be disabled');
      // Return a mock instance to prevent crashes
      return Promise.resolve({
        instance: {
          exports: {},
        },
        module: {},
      });
    },
    instantiateStreaming: (source, imports) => {
      console.error('[Polyfill] WebAssembly.instantiateStreaming called but not supported');
      // Fallback to regular instantiate
      return global.WebAssembly.instantiate(source, imports);
    },
    compile: (source) => {
      console.error('[Polyfill] WebAssembly.compile called but not supported');
      return Promise.resolve({});
    },
    Module: class Module {
      constructor() {
        console.error('[Polyfill] WebAssembly.Module constructed but not supported');
      }
    },
    Instance: class Instance {
      constructor() {
        console.error('[Polyfill] WebAssembly.Instance constructed but not supported');
      }
    },
  };
}

// Step 9: URL polyfill for import.meta.url compatibility
if (!global.URL) {
  try {
    global.URL = require('react-native-url-polyfill').URL;
  } catch (e) {
    console.warn('[Polyfill] react-native-url-polyfill not available, URL might not work properly');
    // URL should be available in modern React Native, but add fallback just in case
  }
}

// Step 10: TextEncoder/TextDecoder polyfills
if (!global.TextEncoder) {
  try {
    const { TextEncoder, TextDecoder } = require('text-encoding');
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
  } catch (e) {
    console.warn('[Polyfill] text-encoding not available, using basic TextEncoder/TextDecoder');
    // Basic fallback implementation
    global.TextEncoder = class TextEncoder {
      encode(str) {
        const buf = Buffer.from(str, 'utf8');
        const arr = new Uint8Array(buf.length);
        for (let i = 0; i < buf.length; i++) {
          arr[i] = buf[i];
        }
        return arr;
      }
    };
    global.TextDecoder = class TextDecoder {
      decode(arr) {
        return Buffer.from(arr).toString('utf8');
      }
    };
  }
}

console.log('[Polyfills] ✅ Crypto and environment polyfills initialized for React Native');
console.log('[Polyfills] Available:', {
  crypto: !!global.crypto,
  cryptoSubtle: !!global.crypto?.subtle,
  buffer: !!global.Buffer,
  process: !!global.process,
  webAssembly: !!global.WebAssembly,
  url: !!global.URL,
  textEncoder: !!global.TextEncoder,
});