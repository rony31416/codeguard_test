const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Copy webview HTML to out directory
const copyWebviewFiles = () => {
    const srcDir = path.join(__dirname, 'src', 'webview');
    const outDir = path.join(__dirname, 'out', 'webview');
    
    // Create out/webview directory if it doesn't exist
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }
    
    // Copy webview.html
    const htmlSrc = path.join(srcDir, 'webview.html');
    const htmlDest = path.join(outDir, 'webview.html');
    
    if (fs.existsSync(htmlSrc)) {
        fs.copyFileSync(htmlSrc, htmlDest);
        console.log('✓ Copied webview.html to out/webview/');
    } else {
        console.error('✗ webview.html not found at', htmlSrc);
    }
};

esbuild.build({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    outfile: 'out/extension.js',
    external: ['vscode'],   // provided by VS Code at runtime
    format: 'cjs',
    platform: 'node',
    target: 'node18',
    sourcemap: false,
    minify: false,          // keep readable for debugging
}).then(() => {
    copyWebviewFiles();
    console.log('✓ Build complete');
}).catch(() => process.exit(1));
