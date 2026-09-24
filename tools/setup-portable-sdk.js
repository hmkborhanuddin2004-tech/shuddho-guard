const fs = require('fs');
const https = require('https');
const path = require('path');
const { execSync } = require('child_process');

const sdkDir = path.join(__dirname, '..', 'android', '.android-sdk');
const buildToolsDir = path.join(sdkDir, 'build-tools', '34.0.0');
const platformsDir = path.join(sdkDir, 'platforms', 'android-34');

function downloadAndExtract(url, zipName, targetFolder) {
  return new Promise((resolve, reject) => {
    const zipPath = path.join(sdkDir, zipName);
    console.log(`Downloading ${zipName}...`);
    const file = fs.createWriteStream(zipPath);

    https.get(url, res => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed with status ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          console.log(`Extracting ${zipName}...`);
          if (!fs.existsSync(targetFolder)) fs.mkdirSync(targetFolder, { recursive: true });
          try {
            const tempExtract = path.join(sdkDir, 'temp_' + path.basename(zipName, '.zip'));
            if (!fs.existsSync(tempExtract)) fs.mkdirSync(tempExtract, { recursive: true });
            execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${tempExtract}' -Force"`, { stdio: 'inherit' });
            
            // Move contents into targetFolder
            const entries = fs.readdirSync(tempExtract);
            const sourceDir = entries.length === 1 && fs.statSync(path.join(tempExtract, entries[0])).isDirectory()
              ? path.join(tempExtract, entries[0])
              : tempExtract;

            for (const item of fs.readdirSync(sourceDir)) {
              const src = path.join(sourceDir, item);
              const dest = path.join(targetFolder, item);
              if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
              fs.renameSync(src, dest);
            }

            fs.rmSync(tempExtract, { recursive: true, force: true });
            fs.unlinkSync(zipPath);
            console.log(`Successfully installed to ${targetFolder}`);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });
    }).on('error', reject);
  });
}

async function run() {
  if (!fs.existsSync(sdkDir)) fs.mkdirSync(sdkDir, { recursive: true });

  // 1. Build Tools 34
  await downloadAndExtract(
    'https://dl.google.com/android/repository/build-tools_r34-windows.zip',
    'build-tools_r34.zip',
    buildToolsDir
  );

  // 2. Platforms Android 34
  await downloadAndExtract(
    'https://dl.google.com/android/repository/platform-34-ext8_r01.zip',
    'platform-34.zip',
    platformsDir
  );

  console.log('✅ Android SDK 34 is 100% installed and ready!');
}

run().catch(console.error);
