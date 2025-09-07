const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Monorepo setup with Yarn Workspaces
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

// Watch shared source folders
config.watchFolders = [
  path.resolve(monorepoRoot, 'src'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Configure resolver for workspace
config.resolver = {
  ...config.resolver,
  // Use hoisted dependencies from workspace root
  nodeModulesPaths: [
    path.resolve(monorepoRoot, 'node_modules'),
    path.resolve(projectRoot, 'node_modules'),
  ],
  platforms: ['native', 'android', 'ios'],
  // Handle ES modules properly
  sourceExts: [...config.resolver.sourceExts, 'mjs', 'cjs'],
  // Enable package exports for SDK compatibility
  unstable_enablePackageExports: true,
  unstable_conditionNames: ['react-native', 'browser', 'require'],
  // Prioritize platform-specific files for React Native
  resolverMainFields: ['react-native', 'main'],
  // Alias Node.js modules to React Native equivalents
  extraNodeModules: new Proxy({}, {
    get: (target, name) => {
      // Redirect Node.js core modules to their React Native equivalents
      const aliases = {
        'crypto': path.resolve(monorepoRoot, 'node_modules/react-native-crypto'),
        'stream': path.resolve(monorepoRoot, 'node_modules/stream-browserify'),
        'buffer': path.resolve(monorepoRoot, 'node_modules/buffer'),
        'vm': path.resolve(monorepoRoot, 'node_modules/vm-browserify'),
        'process': path.resolve(monorepoRoot, 'node_modules/process'),
      };
      
      if (aliases[name]) {
        return aliases[name];
      }
      
      // Default to node_modules lookup
      return path.resolve(monorepoRoot, `node_modules/${name}`);
    }
  }),
};

// Support symlinks (used by Yarn workspaces)
config.resolver.symlinks = true;

console.log('[Metro] Configuration loaded - SDK imports now allowed');

module.exports = config;
