const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver = {
  ...config.resolver,
  blockList: [
    // Ignore tmp directories created by postinstall scripts (esbuild-plugin-pino, etc.)
    /node_modules\/.*_tmp_\d+/,
    /node_modules\/[^/]+_tmp_[^/]+/,
    // Ignore other artifacts' node_modules to avoid conflicts
    /artifacts\/api-server\/node_modules/,
    /artifacts\/mockup-sandbox\/node_modules/,
  ],
};

module.exports = config;
