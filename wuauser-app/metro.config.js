const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable experimental type stripping to avoid conflicts
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
};

// Ensure TypeScript files are handled properly
config.resolver = {
  ...config.resolver,
  sourceExts: [...config.resolver.sourceExts, 'ts', 'tsx'],
};

module.exports = config;