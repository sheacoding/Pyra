// Post-build script to fix uninstaller icon in NSIS installer
const fs = require('fs');
const path = require('path');

const installerPath = path.join(__dirname, 'src-tauri', 'target', 'release', 'nsis', 'x64', 'installer.nsi');

console.log('[Fix Uninstaller Icon] Reading installer.nsi...');

if (!fs.existsSync(installerPath)) {
    console.error('[Fix Uninstaller Icon] installer.nsi not found at:', installerPath);
    process.exit(1);
}

let content = fs.readFileSync(installerPath, 'utf8');

// Check if MUI_UNICON is already defined
if (content.includes('MUI_UNICON')) {
    console.log('[Fix Uninstaller Icon] MUI_UNICON already defined, skipping...');
    process.exit(0);
}

// Find the MUI_ICON definition and add MUI_UNICON right after it
const muiIconPattern = /(!define MUI_ICON "\$\{INSTALLERICON\}")/;

if (!muiIconPattern.test(content)) {
    console.error('[Fix Uninstaller Icon] Could not find MUI_ICON definition');
    process.exit(1);
}

content = content.replace(
    muiIconPattern,
    '$1\n  !define MUI_UNICON "${INSTALLERICON}"'
);

fs.writeFileSync(installerPath, content, 'utf8');

console.log('[Fix Uninstaller Icon] Successfully added MUI_UNICON to installer.nsi');
console.log('[Fix Uninstaller Icon] Now rebuilding NSIS installer...');
