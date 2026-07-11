/* Extracts the 4 fire-tower states from assets/raw/tower.png into a clean
   1-row 4-frame sheet. The image has a baked-in neutral-grey checkerboard
   background (not real transparency), so key that out (towers are warm tan +
   orange fire). Detect the 4 towers from the lower region, then repack at one
   uniform scale, bases aligned. Frame 0 = no fire ... frame 3 = big fire. */
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import http from 'http';
const dir = path.dirname(fileURLToPath(import.meta.url));
const server = http.createServer((req,res)=>{const p=path.join(dir,decodeURIComponent(req.url.split('?')[0]));fs.readFile(p,(e,b)=>{if(e){res.writeHead(404);res.end();return;}const x=path.extname(p);res.writeHead(200,{'Content-Type':x==='.js'?'application/javascript':x==='.html'?'text/html':x==='.png'?'image/png':'application/octet-stream'});res.end(b);});});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const PORT=server.address().port;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage();
await page.goto(`http://127.0.0.1:${PORT}/index.html`);
await page.waitForTimeout(150);
const out = await page.evaluate(async () => {
  const img = await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src='assets/raw/tower.png';});
  const W=img.width,H=img.height;
  const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.drawImage(img,0,0);
  const A=x.getImageData(0,0,W,H).data;
  const at=(px,py,k)=>A[(py*W+px)*4+k];
  // neutral-grey checkerboard background (two close greys) — key it out
  // checkerboard = two neutral greys ~[96,96,96] and ~[64,64,64]; key both.
  // stone body is warm/tan and fire is orange (mx-mn large) so they survive.
  const isBG=(r,g,b)=>{const mx=Math.max(r,g,b),mn=Math.min(r,g,b);const br=(r+g+b)/3;return (mx-mn)<14 && br>=52 && br<=118;};
  const isFG=(px,py)=>{const r=at(px,py,0),g=at(px,py,1),b=at(px,py,2),a=at(px,py,3);return a>40 && !isBG(r,g,b);};
  const seg=(d,thr,gap)=>{const r=[];let s=-1,g=0;for(let i=0;i<d.length;i++){if(d[i]>=thr){if(s<0)s=i;g=0;}else if(s>=0){g++;if(g>=gap){r.push([s,i-g]);s=-1;}}}if(s>=0)r.push([s,d.length-1]);return r;};
  // detect towers by column density over the LOWER region (stone bodies)
  const y0d=Math.floor(H*0.42), y1d=H-1;
  const colDen=new Array(W).fill(0);
  for(let px=0;px<W;px++){let n=0;for(let py=y0d;py<=y1d;py++)if(isFG(px,py))n++;colDen[px]=n;}
  const maxD=Math.max(...colDen);
  let runs=seg(colDen,maxD*0.18,26).filter(([a,b])=>b-a>=60);
  // for each tower x-range, find full-height fg bbox (include fire above)
  const frames=runs.map(([rx0,rx1])=>{
    let y0=H,y1=0,x0=rx1,x1=rx0;
    for(let py=0;py<H;py++)for(let px=rx0;px<=rx1;px++)if(isFG(px,py)){if(py<y0)y0=py;if(py>y1)y1=py;if(px<x0)x0=px;if(px>x1)x1=px;}
    return {x0,x1,y0,y1,w:x1-x0+1,h:y1-y0+1};
  });
  const th=Math.max(...frames.map(f=>f.h)), sc=Math.min(1,240/th);
  const CW=Math.round(Math.max(...frames.map(f=>f.w))*sc+24), CH=Math.round(th*sc+14), N=frames.length;
  const o=document.createElement('canvas');o.width=CW*N;o.height=CH;const oc=o.getContext('2d');oc.imageSmoothingEnabled=true;
  frames.forEach((f,i)=>{
    // build a masked sprite (only fg pixels) for this frame
    const sw=f.w,sh=f.h;const mc=document.createElement('canvas');mc.width=sw;mc.height=sh;const mx=mc.getContext('2d');const md=mx.createImageData(sw,sh);
    for(let py=f.y0;py<=f.y1;py++)for(let px=f.x0;px<=f.x1;px++){ if(!isFG(px,py))continue; const di=((py-f.y0)*sw+(px-f.x0))*4,gj=(py*W+px)*4; md.data[di]=A[gj];md.data[di+1]=A[gj+1];md.data[di+2]=A[gj+2];md.data[di+3]=255; }
    mx.putImageData(md,0,0);
    const dw=sw*sc,dh=sh*sc,dx=i*CW+(CW-dw)/2,dy=(CH-dh)-7;
    oc.save();oc.beginPath();oc.rect(i*CW,0,CW,CH);oc.clip();oc.drawImage(mc,0,0,sw,sh,dx,dy,dw,dh);oc.restore();
  });
  return { url:o.toDataURL('image/png'), n:N, cw:CW, ch:CH };
});
fs.writeFileSync(path.join(dir,'assets','tower.png'), Buffer.from(out.url.split(',')[1],'base64'));
console.log('tower.png frames='+out.n, 'cell='+out.cw+'x'+out.ch);
await browser.close();server.close();
