const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Native alias resolution — replaces babel-plugin-module-resolver
config.resolver.alias = {
  '@': path.resolve(__dirname, 'src'),
};

module.exports = config;
