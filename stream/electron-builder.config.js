/**
 * Streamline Electron Config
 * Build settings for electron-builder
 */

module.exports = {
  appId: "com.streamline.app",
  productName: "Streamline",
  directories: {
    buildResources: "build",
    output: "dist",
  },
  files: ["dist/**/*", "electron/**/*", "package.json"],
  win: {
    target: ["nsis", "portable"],
    certificateFile: process.env.WIN_CSC_LINK,
    certificatePassword: process.env.WIN_CSC_KEY_PASSWORD,
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
  },
  mac: {
    target: ["dmg", "zip"],
    category: "public.app-category.entertainment",
  },
  linux: {
    target: ["AppImage", "deb"],
    category: "Multimedia",
  },
};
