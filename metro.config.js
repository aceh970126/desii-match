const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure we're using the correct entry point
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
