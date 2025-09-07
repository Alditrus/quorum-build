# Passkey SDK Integration Plan for Expo Dev Environment

**Status**: 📋 Planning  
**Priority**: High  
**Created**: 2025-01-07  
**Related Issues**: 
- `.readme/tasks/todo/mobile-dev/mobile-sdk-integration-issue.md`
- `.readme/tasks/todo/mobile-dev/sdk-shim-temporary-solutions.md`

## Executive Summary

Now that we've migrated from Expo GO to Expo Dev Build, we can attempt full integration of the `@quilibrium/quilibrium-js-sdk-channels` SDK. This plan outlines the steps to remove the temporary shim and test real SDK functionality with proper crypto polyfills and native module support.

## Background

### Previous Issues with Expo GO
- Node.js crypto module not available
- WebAssembly not supported
- Metro bundler couldn't handle pre-bundled SDK code
- import.meta.url syntax not supported

### Current Setup
- **SDK Shim**: `src/shims/quilibrium-sdk-channels.native.tsx` provides mock implementation
- **Metro Config**: Blocks real SDK and redirects all imports to shim
- **Test Screens**: OnboardingTestScreen and LoginTestScreen use shim
- **SDK Location**: Local dependency at `../quilibrium-js-sdk-channels`

### What Changed with Expo Dev Build
- Custom native modules supported
- Metro configuration fully customizable
- Crypto polyfills can be properly initialized
- Better control over bundling process

## Implementation Plan

### Phase 1: Polyfill Setup

#### 1.1 Create Polyfills File
**File**: `mobile/polyfills.js`

```javascript
// Critical: Import order matters!
import 'react-native-get-random-values';
import 'react-native-randombytes';
import crypto from 'react-native-crypto';

// Make crypto available globally for SDK
global.crypto = crypto;

// Add WebCrypto API stub if needed
if (!global.crypto.subtle) {
  global.crypto.subtle = {}; // Basic stub, expand as needed
}

// Buffer polyfill (already available from main package.json)
global.Buffer = require('buffer').Buffer;

// Process polyfill for Node.js compatibility
global.process = global.process || {};
global.process.env = global.process.env || {};

console.log('[Polyfills] Crypto and Buffer initialized for React Native');
```

#### 1.2 Update Entry Point
**File**: `mobile/index.ts`

```typescript
import './polyfills'; // MUST be first import!
import { registerRootComponent } from 'expo';
import App from './AppTest';

registerRootComponent(App);
```

### Phase 2: Metro Configuration

#### 2.1 Remove SDK Blocking
**File**: `mobile/metro.config.js`

Remove these sections:
- `blockList` that blocks `@quilibrium/quilibrium-js-sdk-channels`
- `extraNodeModules` redirect to shim
- `resolveRequest` custom resolver for SDK

Keep:
- Workspace configuration
- Watch folders for shared source
- Platform-specific resolution
- Source extensions

Updated config structure:
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Monorepo setup
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

config.watchFolders = [
  path.resolve(monorepoRoot, 'src'),
];

config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [
    path.resolve(monorepoRoot, 'node_modules'),
  ],
  platforms: ['native', 'android', 'ios'],
  sourceExts: [...config.resolver.sourceExts, 'mjs', 'cjs'],
  unstable_enablePackageExports: true, // Enable for SDK
  unstable_conditionNames: ['react-native', 'browser', 'require'],
  resolverMainFields: ['react-native', 'main'],
};

config.resolver.symlinks = true;

module.exports = config;
```

### Phase 3: SDK Integration Approach

#### 3.1 Conditional SDK Loading
**File**: `src/shims/quilibrium-sdk-channels.native.tsx`

Transform the shim into a smart loader that attempts real SDK first:

```typescript
// Try to load real SDK with polyfills
let realSDK: any = null;
let isRealSDK = false;

try {
  // Attempt to import real SDK
  realSDK = require('@quilibrium/quilibrium-js-sdk-channels');
  isRealSDK = true;
  console.log('[SDK] Successfully loaded real Quilibrium SDK');
} catch (error) {
  console.warn('[SDK] Failed to load real SDK, using mock:', error.message);
}

// Export real SDK if available, otherwise export mock
if (isRealSDK && realSDK) {
  export const {
    channel,
    channel_raw,
    passkey,
    PasskeysProvider,
    usePasskeysContext,
  } = realSDK;
  
  export default realSDK;
} else {
  // ... existing mock implementation ...
}
```

### Phase 4: Handle Specific Issues

#### 4.1 WebAssembly Support
If WASM is still problematic:

**Option A**: Stub WASM functionality
```javascript
// In polyfills.js
global.WebAssembly = global.WebAssembly || {
  instantiate: () => Promise.reject(new Error('WebAssembly not supported')),
  compile: () => Promise.reject(new Error('WebAssembly not supported')),
};
```

**Option B**: Use WASM polyfill library
```bash
# Install if needed
yarn add @wasmer/wasi
```

#### 4.2 import.meta.url Support
Update Babel config if needed:

**File**: `mobile/babel.config.js`
```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      '@babel/plugin-syntax-import-meta',
      // Transform import.meta.url to a React Native compatible format
      ['babel-plugin-transform-import-meta', {
        'import.meta.url': 'file://' + __filename
      }]
    ],
  };
};
```

#### 4.3 Multiformats Subpath Exports
If Metro has issues with `multiformats` package:

Add to `metro.config.js`:
```javascript
config.resolver.unstable_enablePackageExports = true;
```

### Phase 5: Testing Strategy

#### 5.1 Incremental Testing
1. **Test 1**: Basic SDK import without usage
2. **Test 2**: Crypto operations (key generation)
3. **Test 3**: Passkey creation
4. **Test 4**: Full authentication flow
5. **Test 5**: Complete onboarding process

#### 5.2 Error Monitoring
Add detailed logging at each step:
```typescript
// In components using SDK
try {
  const result = await sdkOperation();
  console.log('[SDK Test] Operation successful:', operationName);
} catch (error) {
  console.error('[SDK Test] Operation failed:', operationName, error);
  // Fall back to mock if available
}
```

### Phase 6: Fallback Strategy

If integration fails at any point:
1. Keep shim as fallback
2. Use feature flags to toggle between implementations
3. Document specific failure points for future resolution

### Dependencies Status

#### Already Installed (in mobile/package.json)
✅ `react-native-crypto`  
✅ `react-native-get-random-values`  
✅ `react-native-randombytes`  
✅ `buffer` (in main package.json)

#### May Need to Install
- `expo-crypto` - Alternative crypto implementation if react-native-crypto has issues
- `@babel/plugin-syntax-import-meta` - For import.meta support
- `babel-plugin-transform-import-meta` - Transform import.meta for React Native
- `@wasmer/wasi` - WebAssembly polyfill (if needed)

### Success Criteria

1. **Minimum Success**: SDK imports without Metro bundling errors
2. **Partial Success**: Crypto operations work, but WASM features disabled
3. **Full Success**: All SDK features work including passkey authentication

### Rollback Plan

If integration fails:
```bash
# Revert to previous commit
git reset --hard HEAD~1

# Or revert specific files
git checkout HEAD -- mobile/metro.config.js
git checkout HEAD -- src/shims/quilibrium-sdk-channels.native.tsx
```

### Next Steps After This Plan

1. **Execute Phase 1-2**: Set up polyfills and update Metro config
2. **Test basic import**: Verify SDK can be loaded
3. **Identify specific errors**: Document any remaining issues
4. **Iterate on solutions**: Apply fixes for specific problems
5. **Update components**: Once SDK works, update Onboarding and Login components
6. **Remove shim**: After successful testing, remove mock implementation

### Files to Modify

| File | Action | Priority |
|------|--------|----------|
| `mobile/polyfills.js` | Create | High |
| `mobile/index.ts` | Update | High |
| `mobile/metro.config.js` | Update | High |
| `src/shims/quilibrium-sdk-channels.native.tsx` | Update | Medium |
| `mobile/babel.config.js` | Update if needed | Low |
| Components using SDK | Update after success | Low |

### Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Crypto polyfills insufficient | Medium | High | Try expo-crypto alternative |
| WASM completely unsupported | High | Medium | Disable WASM features, use JS fallbacks |
| import.meta.url issues | Medium | Low | Babel transformation |
| Bundle size increase | Low | Low | Code splitting if needed |
| Performance degradation | Low | Medium | Profile and optimize hot paths |

### Timeline Estimate

- **Polyfill setup**: 30 minutes
- **Metro config update**: 15 minutes  
- **Initial testing**: 1 hour
- **Issue resolution**: 2-4 hours (depends on issues found)
- **Component updates**: 1-2 hours
- **Full testing**: 1 hour

**Total estimate**: 5-8 hours

---

## Conclusion

This plan provides a systematic approach to integrating the real Quilibrium SDK in the Expo Dev Build environment. The key advantages over Expo GO are proper native module support and full Metro configuration control. With the crypto dependencies already installed and a clear fallback strategy, we can safely attempt this integration with minimal risk to the existing functionality.

---

*Last updated: 2025-01-07*