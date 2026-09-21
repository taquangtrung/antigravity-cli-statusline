#!/usr/bin/env node

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

function getAntigravityDir() {
  return process.env.ANTIGRAVITY_CONFIG_DIR || path.join(os.homedir(), '.gemini', 'antigravity-cli');
}

function installStatusline(sourceDir, targetDir) {
  const sourceFile = path.join(sourceDir, 'statusline.js');
  const targetFile = path.join(targetDir, 'statusline.js');

  if (!fs.existsSync(sourceFile)) {
    console.error(`Error: source file not found at ${sourceFile}`);
    process.exit(1);
  }

  fs.mkdirSync(targetDir, { recursive: true });
  fs.copyFileSync(sourceFile, targetFile);

  if (process.platform !== 'win32') {
    try {
      fs.chmodSync(targetFile, 0o755);
    } catch {
      // Best effort chmod
    }
  }

  console.log(`Copied statusline.js to: ${targetFile}`);
}

function updateSettings(targetDir) {
  const settingsFile = path.join(targetDir, 'settings.json');
  let settings = {};

  if (fs.existsSync(settingsFile)) {
    try {
      const raw = fs.readFileSync(settingsFile, 'utf8');
      settings = JSON.parse(raw);
    } catch (err) {
      console.warn(`Warning: Could not parse existing settings.json (${err.message}). Creating backup...`);
      const backupFile = `${settingsFile}.backup.${Date.now()}`;
      fs.copyFileSync(settingsFile, backupFile);
      console.warn(`Backup saved to ${backupFile}`);
      settings = {};
    }
  }

  settings.statusLine = {
    type: 'command',
    command: "node -e /*'*/require(require(`os`).homedir()+`/.gemini/antigravity-cli/statusline.js`)//'",
    enabled: true,
  };

  fs.writeFileSync(settingsFile, `${JSON.stringify(settings, null, 2)}\n`, 'utf8');
  console.log(`Updated configuration in: ${settingsFile}`);
}

function main() {
  const sourceDir = __dirname;
  const targetDir = getAntigravityDir();

  console.log('Installing Antigravity CLI statusline...');
  installStatusline(sourceDir, targetDir);
  updateSettings(targetDir);
  console.log('Installation completed successfully!');
}

main();
