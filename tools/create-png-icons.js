const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createSolidPNG(width, height, r, g, b, a = 255) {
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    // IHDR chunk
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr.writeUInt8(8, 8); // bit depth
    ihdr.writeUInt8(6, 9); // RGBA color type
    ihdr.writeUInt8(0, 10); // compression
    ihdr.writeUInt8(0, 11); // filter
    ihdr.writeUInt8(0, 12); // interlace

    function makeChunk(type, data) {
        const len = Buffer.alloc(4);
        len.writeUInt32BE(data.length, 0);
        const typeBuf = Buffer.from(type, 'ascii');
        const toCrc = Buffer.concat([typeBuf, data]);
        const crc = crc32(toCrc);
        const crcBuf = Buffer.alloc(4);
        crcBuf.writeUInt32BE(crc, 0);
        return Buffer.concat([len, typeBuf, data, crcBuf]);
    }

    // CRC32 table
    const table = [];
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            if (c & 1) c = 0xedb88320 ^ (c >>> 1);
            else c = c >>> 1;
        }
        table[n] = c;
    }
    function crc32(buf) {
        let crc = 0 ^ (-1);
        for (let i = 0; i < buf.length; i++) {
            crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
        }
        return (crc ^ (-1)) >>> 0;
    }

    // Scanlines
    const rowSize = 1 + width * 4;
    const rawData = Buffer.alloc(rowSize * height);
    for (let y = 0; y < height; y++) {
        const rowStart = y * rowSize;
        rawData[rowStart] = 0; // filter type 0
        for (let x = 0; x < width; x++) {
            const px = rowStart + 1 + x * 4;
            rawData[px] = r;
            rawData[px + 1] = g;
            rawData[px + 2] = b;
            rawData[px + 3] = a;
        }
    }

    const compressed = zlib.deflateSync(rawData);
    const ihdrChunk = makeChunk('IHDR', ihdr);
    const idatChunk = makeChunk('IDAT', compressed);
    const iendChunk = makeChunk('IEND', Buffer.alloc(0));

    return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.join(__dirname, '../web-extension/icons');
fs.writeFileSync(path.join(iconsDir, 'icon16.png'), createSolidPNG(16, 16, 5, 150, 105));
fs.writeFileSync(path.join(iconsDir, 'icon48.png'), createSolidPNG(48, 48, 5, 150, 105));
fs.writeFileSync(path.join(iconsDir, 'icon128.png'), createSolidPNG(128, 128, 5, 150, 105));

console.log('✅ 16x16, 48x48, 128x128 আইকন ফাইলসমূহ সফলভাবে তৈরি হয়েছে।');
