const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const srcPath = path.join(__dirname, '..', 'src', 'img', 'NJBot.png');
const outPath = path.join(__dirname, '..', 'src', 'img', 'NJBot_trim.png');

fs.createReadStream(srcPath)
  .pipe(new PNG())
  .on('parsed', function() {
    const w = this.width;
    const h = this.height;
    const data = this.data;

    // Find bounding box of pixels that are not 'near-black'
    const isNotBlack = (r,g,b,a) => {
      const threshold = 12; // allow slight noise
      return a > 16 && (r > threshold || g > threshold || b > threshold);
    };

    let minX = w, minY = h, maxX = 0, maxY = 0;
    for (let y = 0; y < h; y++){
      for (let x = 0; x < w; x++){
        const idx = (y * w + x) << 2;
        const r = data[idx];
        const g = data[idx+1];
        const b = data[idx+2];
        const a = data[idx+3];
        if (isNotBlack(r,g,b,a)){
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (minX > maxX || minY > maxY){
      console.error('No non-black area found; aborting.');
      process.exit(1);
    }

    const cropW = maxX - minX + 1;
    const cropH = maxY - minY + 1;

    const outPng = new PNG({width: cropW, height: cropH});
    for (let y=0; y<cropH; y++){
      for (let x=0; x<cropW; x++){
        const srcIdx = ((y + minY) * w + (x + minX)) << 2;
        const dstIdx = (y * cropW + x) << 2;
        outPng.data[dstIdx] = data[srcIdx];
        outPng.data[dstIdx+1] = data[srcIdx+1];
        outPng.data[dstIdx+2] = data[srcIdx+2];
        outPng.data[dstIdx+3] = data[srcIdx+3];
      }
    }

    outPng.pack().pipe(fs.createWriteStream(outPath)).on('finish', ()=>{
      console.log('Wrote trimmed image to', outPath);
    });
  })
  .on('error', err => { console.error('error reading PNG:', err.message); process.exit(1); });
