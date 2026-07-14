/* Slices the user's uploaded showcase sheets (titles + row labels + uneven
   frames, assets/*.png.png) into clean uniform grids the game can use.
   Detects sprite rows and frames by alpha, drops the title band and each row's
   left label, then re-packs frames into 4 rows (idle/walk/attack/cast) x N.
   Served over HTTP so getImageData isn't tainted (file:// would block it). */
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import http from 'http';

const dir = path.dirname(fileURLToPath(import.meta.url));
// output sheet (in game) <- source showcase art (assets/raw, named by actual art)
const JOBS = [
  { out:'warrior.png',  src:'_reslice/warrior.png'  },  // Garran  – warrior
  { out:'wizard.png',   src:'_reslice/wizard.png'   },  // Mira    – purple wizard
  { out:'archer.png',   src:'_reslice/archer.png'   },  // Faye    – archer
  { out:'sorcerer.png', src:'_reslice/sorcerer.png' },  // Rai     – elemental sorcerer
  { out:'shadow.png',   src:'_reslice/shadow.png'   },  // Boss    – shadow mage (unused now)
];

// tiny static server (same-origin http => canvas not tainted)
const server = http.createServer((req, res) => {
  const p = path.join(dir, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p, (e, buf) => {
    if (e) { res.writeHead(404); res.end(); return; }
    const ext = path.extname(p);
    res.writeHead(200, { 'Content-Type': ext==='.png'?'image/png':ext==='.html'?'text/html':'application/octet-stream' });
    res.end(buf);
  });
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const PORT = server.address().port;

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage();
await page.goto(`http://127.0.0.1:${PORT}/index.html`);
await page.waitForTimeout(200);

const report = {};
for (const job of JOBS){
  const result = await page.evaluate(async ({ src }) => {
    const img = await new Promise(r => { const i=new Image(); i.onload=()=>r(i); i.onerror=()=>r(null); i.src='assets/'+src; });
    if (!img) return { error:'load' };
    const W = img.width, H = img.height;
    const cv = document.createElement('canvas'); cv.width=W; cv.height=H;
    const cx = cv.getContext('2d'); cx.drawImage(img,0,0);
    const A = cx.getImageData(0,0,W,H).data;
    const alpha = (x,y) => A[(y*W+x)*4+3];
    const AT = 24; // alpha threshold
    const LABEL_X = 190; // frames start after the left row-label

    // segment a density profile into runs where density >= thr, gap>=minGap
    function segment(dens, thr, minGap){
      const runs=[]; let s=-1, gap=0;
      for (let i=0;i<dens.length;i++){
        if (dens[i] >= thr){ if (s<0) s=i; gap=0; }
        else if (s>=0){ gap++; if (gap>=minGap){ runs.push([s, i-gap]); s=-1; } }
      }
      if (s>=0) runs.push([s, dens.length-1]);
      return runs;
    }

    // ---- row bands via row density ----
    const rowDen = new Array(H).fill(0);
    for (let y=0; y<H; y++){ let n=0; for (let x=0; x<W; x+=2){ if (alpha(x,y)>AT) n++; } rowDen[y]=n; }
    const maxRow = Math.max(...rowDen);
    let bands = segment(rowDen, maxRow*0.04, 8);
    const heights = bands.map(b=>b[1]-b[0]).sort((a,b)=>a-b);
    const med = heights[Math.floor(heights.length/2)] || 1;
    let rows = bands.filter(b => (b[1]-b[0]) >= med*0.5);   // drop title/short bands

    // ---- frames within each row band via column density ----
    function framesIn(y0,y1){
      const colDen = new Array(W).fill(0);
      for (let x=0; x<W; x++){ let n=0; for (let y=y0; y<=y1; y++){ if (alpha(x,y)>AT) n++; } colDen[x]=n; }
      const maxCol = Math.max(...colDen);
      let runs = segment(colDen, maxCol*0.07, 8);
      runs = runs.filter(([x0,x1]) => x1 > LABEL_X && (x1-x0) >= 16);   // drop label + noise
      // count distinct quantized colours — text is near-monochrome, sprites aren't
      const variety = (x0,x1) => {
        const set = new Set(); let n=0;
        for (let y=y0; y<=y1; y+=2) for (let x=x0; x<=x1; x+=2){
          const i=(y*W+x)*4; if (A[i+3]<=AT) continue; n++;
          set.add(((A[i]>>5)<<6)|((A[i+1]>>5)<<3)|(A[i+2]>>5));
        }
        return n>40 ? set.size : 0;
      };
      return runs.map(([x0,x1]) => {
        let ty0=y1, ty1=y0;
        for (let y=y0; y<=y1; y++){ for (let x=x0; x<=x1; x+=2){ if (alpha(x,y)>AT){ if(y<ty0)ty0=y; if(y>ty1)ty1=y; break; } } }
        return { x0, x1, y0:ty0, y1:ty1, v:variety(x0,x1) };
      });
    }
    let rowFrames = rows.map(([y0,y1]) => framesIn(y0,y1));
    // adaptive text filter: characters have far more colours than title/label text
    const maxVar = Math.max(1, ...rowFrames.flat().map(f=>f.v));
    rowFrames = rowFrames.map(fr => fr.filter(f => f.v >= maxVar*0.45)).filter(fr => fr.length>0);

    // keep 4 anim rows: idle, walk, attack, cast (first four sprite rows)
    const use = rowFrames.slice(0, 4);
    const maxF = Math.min(10, Math.max(...use.map(r=>r.length)));

    // ---- re-pack into clean uniform grid ----
    // ONE scale for the whole character (from the median frame height) so the
    // body stays the same size across every frame/row — no sudden shrinking.
    // Taller cell + scale by the TALLEST frame so raised weapons / effects fit
    // fully inside the frame (no clipping). Uniform scale keeps size consistent.
    const CW=140, CH=176, COLS=maxF, ROWS=use.length;
    const maxFH = Math.max(...use.flat().map(f=>f.y1-f.y0+1));
    const scale = Math.min((CH-10)/maxFH, 3.2);
    const o = document.createElement('canvas'); o.width=COLS*CW; o.height=ROWS*CH;
    const oc = o.getContext('2d'); oc.imageSmoothingEnabled=true;
    use.forEach((frames, r) => {
      frames.slice(0, maxF).forEach((f, c) => {
        const fw=f.x1-f.x0+1, fh=f.y1-f.y0+1;
        const dw=fw*scale, dh=fh*scale;
        const cx0=c*CW, cy0=r*CH;
        oc.save();
        oc.beginPath(); oc.rect(cx0,cy0,CW,CH); oc.clip();      // keep each frame inside its cell
        oc.drawImage(img, f.x0,f.y0,fw,fh, cx0+(CW-dw)/2, cy0+(CH-dh)-4, dw,dh);  // centered, bottom-aligned
        oc.restore();
      });
    });
    return { url:o.toDataURL('image/png'), cols:COLS, rows:ROWS, frames:use.map(r=>Math.min(maxF,r.length)) };
  }, { src: job.src });

  if (result.error){ console.log(job.out, 'ERROR', result.error); continue; }
  fs.writeFileSync(path.join(dir,'assets',job.out), Buffer.from(result.url.split(',')[1],'base64'));
  report[job.out] = { cols:result.cols, rows:result.rows, frames:result.frames };
  console.log(job.out.padEnd(13), 'rows='+result.rows, 'cols='+result.cols, 'frames/row='+JSON.stringify(result.frames));
}
await browser.close();
server.close();
fs.writeFileSync(path.join(dir,'assets','.slice-report.json'), JSON.stringify(report,null,2));
console.log('done');
