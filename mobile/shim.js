/**
 * Node.js Shims for React Native
 * ================================
 * This file provides Node.js API shims that must be loaded
 * before any other modules that depend on Node.js APIs.
 */

// Inject node globals into React Native global scope
import { Platform } from 'react-native';

// Process shim
if (typeof global.process === 'undefined') {
  global.process = {};
}

global.process.browser = false;
global.process.env = global.process.env || {};
global.process.version = global.process.version || 'v16.0.0';

// Buffer shim
if (typeof global.Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

// Crypto shim - MUST be loaded before react-native-crypto
if (typeof global.crypto === 'undefined') {
  global.crypto = {};
}

// Now load the actual implementations
import 'react-native-get-random-values';
import crypto from 'react-native-crypto';

// Ensure crypto is available globally
if (!global.crypto || !global.crypto.getRandomValues) {
  global.crypto = crypto;
}

// Stream shim
if (typeof global.stream === 'undefined') {
  global.stream = require('stream-browserify');
}

console.log('[Shim] Node.js compatibility layer loaded');