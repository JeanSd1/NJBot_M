const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

// Pads NJBot_trim.png to a target width/height ratio so using object-fit: cover
// will not cut the logo. Outputs NJBot_padded.png.

const src = path.join(__dirname, '..', 'src', 'img', 'NJBot_trim.png');
const out = path.join(__dirname, '..', 'src', 'img', 'NJBot_padded.png');

// desired width/height ratio (width divided by height). Tweak if needed.
const TARGET_RATIO = 1.05; // slight wider ratio to better fit the panel without cutting

fs.createReadStream(src)
  .pipe(new PNG())
  .on('parsed', function() {
    const w = this.width;
    const h = this.height;
    const currentRatio = w / h;

    if (Math.abs(currentRatio - TARGET_RATIO) < 0.01) {
      // already close enough - just copy
      fs.copyFileSync(src, out);
      console.log('Source already close to target ratio; copied to', out);
      return;
    }

    let newW = w;
    let newH = h;

    if (currentRatio < TARGET_RATIO) {
      // need to increase width
      newW = Math.round(TARGET_RATIO * h);
    } else {
      // need to increase height (unlikely for this logo)
      newH = Math.round(w / TARGET_RATIO);
    }

    const padLeft = Math.floor((newW - w) / 2);
    const padTop = Math.floor((newH - h) / 2);

    const outPng = new PNG({width: newW, height: newH});

    // fill background with near-black color similar to original (#080807)
    const bg = {r:8,g:8,b:7,a:255};
    for (let i=0;i<outPng.data.length;i+=4){
      outPng.data[i] = bg.r;
      outPng.data[i+1] = bg.g;
      outPng.data[i+2] = bg.b;
      outPng.data[i+3] = bg.a;
    }

    // copy source into centered position
    for (let y = 0; y < h; y++){
      for (let x = 0; x < w; x++){
        const srcIdx = (y * w + x) << 2;
        const dstIdx = ((y + padTop) * newW + (x + padLeft)) << 2;
        outPng.data[dstIdx] = this.data[srcIdx];
        outPng.data[dstIdx+1] = this.data[srcIdx+1];
        outPng.data[dstIdx+2] = this.data[srcIdx+2];
        outPng.data[dstIdx+3] = this.data[srcIdx+3];
      }
    }

    outPng.pack().pipe(fs.createWriteStream(out)).on('finish', ()=>{
      console.log('Wrote padded image to', out);
    });
  })
  .on('error', err => { console.error('error reading PNG:', err.message); process.exit(1); });
