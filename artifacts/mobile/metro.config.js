const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Force Metro to check files actively every few milliseconds
config.watcher = {
  ...config.watcher,
  watchman: {
    usePolling: true,
    interval: 1000, // checks for changes every 1 second
  },
};

module.exports = config;
