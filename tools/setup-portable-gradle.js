const fs = require('fs');
const https = require('https');
const path = require('path');
const { execSync } = require('child_process');

const targetDir = path.join(__dirname, '..', 'android', '.gradle_dist');
const zipPath = path.join(__dirname, '..', 'android', 'gradle82.zip');

console.log('Downloading Gradle 8.2 Binary...');

const file = fs.createWriteStream(zipPath);

function download(url) {
  https.get(url, res => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      return download(res.headers.location);
    }
    if (res.statusCode !== 200) {
      console.error('Download failed with status:', res.statusCode);
      process.exit(1);
    }
    const total = parseInt(res.headers['content-length'] || '0', 10);
    let downloaded = 0;
    res.on('data', chunk => {
      downloaded += chunk.length;
      if (total > 0 && downloaded % (10 * 1024 * 1024) < chunk.length) {
        console.log(`Progress: ${(downloaded / 1024 / 1024).toFixed(1)} MB / ${(total / 1024 / 1024).toFixed(1)} MB`);
      }
    });
    res.pipe(file);
    file.on('finish', () => {
      file.close(() => {
        console.log('Download complete. Extracting Gradle...');
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
        try {
          execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${targetDir}' -Force"`, { stdio: 'inherit' });
          console.log('Gradle successfully extracted to:', targetDir);
          fs.unlinkSync(zipPath);
        } catch (e) {
          console.error('Extraction failed:', e.message);
        }
      });
    });
  }).on('error', err => {
    console.error('Error:', err.message);
  });
}

download('https://services.gradle.org/distributions/gradle-8.2-bin.zip');
