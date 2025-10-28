const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const imgPath = path.join(__dirname, '..', 'src', 'img', 'NJBot.png');

fs.createReadStream(imgPath)
  .pipe(new PNG())
  .on('parsed', function() {
    const w = this.width;
    const h = this.height;
    const cx = Math.floor(w / 2);
    const cy = Math.floor(h / 2);
    const idx = (cy * w + cx) << 2;
    const r = this.data[idx];
    const g = this.data[idx + 1];
    const b = this.data[idx + 2];
    const a = this.data[idx + 3];
    function toHex(v){ return ('0' + v.toString(16)).slice(-2); }
    const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    console.log(`center sample: rgba(${r},${g},${b},${a}) -> ${hex}`);
  })
  .on('error', err => {
    console.error('failed to read PNG:', err.message);
    process.exit(1);
  });
