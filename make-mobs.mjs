/* Turns the single-image monsters in assets/raw/ into looping animation strips.
   Extracts the sprite(s) from each image (ghost.png -> ghost + skeleton), then
   procedurally animates each into an 8-frame strip with type-specific motion
   (slime squash, ghost float, orc/skeleton breathe, dragon breathe+bob).
   Served over HTTP so getImageData isn't tainted. */
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import http from 'http';
const dir = path.dirname(fileURLToPath(import.meta.url));
const server = http.createServer((req,res)=>{
  const p = path.join(dir, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p,(e,b)=>{ if(e){res.writeHead(404);res.end();return;}
    const ext=path.extname(p); res.writeHead(200,{'Content-Type':ext==='.js'?'application/javascript':ext==='.html'?'text/html':ext==='.png'?'image/png':'application/octet-stream'}); res.end(b); });
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const PORT=server.address().port;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage();
await page.goto(`http://127.0.0.1:${PORT}/index.html`);
await page.waitForTimeout(150);

// src file -> list of outputs (name + motion). Multi-subject files split by blob.
const JOBS = [
  { src:'raw/slime.png',  out:[{name:'slime',   motion:'squash',  th:120}] },
  { src:'raw/ghost.png',  out:[{name:'ghost',   motion:'float',   th:150}, {name:'skeleton', motion:'breathe', th:160}] },
  { src:'raw/oak.png',    out:[{name:'orc',     motion:'breathe', th:150}] },
  { src:'raw/dragon.png', out:[{name:'dragon',  motion:'dragon',  th:210}] },
];

const results = await page.evaluate(async ({JOBS}) => {
  const out = {};
  const load = f => new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src='assets/'+f;});
  const seg=(d,thr,g)=>{const r=[];let s=-1,gap=0;for(let i=0;i<d.length;i++){if(d[i]>=thr){if(s<0)s=i;gap=0;}else if(s>=0){gap++;if(gap>=g){r.push([s,i-gap]);s=-1;}}}if(s>=0)r.push([s,d.length-1]);return r;};

  for (const job of JOBS){
    const img = await load(job.src); if(!img){ out[job.src]='load-fail'; continue; }
    const W=img.width,H=img.height;
    const c=document.createElement('canvas'); c.width=W;c.height=H;
    const x=c.getContext('2d'); x.drawImage(img,0,0);
    const A=x.getImageData(0,0,W,H).data; const al=(px,py)=>A[(py*W+px)*4+3]; const AT=24;
    // column blobs
    const colDen=new Array(W).fill(0);
    for(let px=0;px<W;px++){let n=0;for(let py=0;py<H;py++)if(al(px,py)>AT)n++;colDen[px]=n;}
    const maxCol=Math.max(...colDen);
    let blobs=seg(colDen,maxCol*0.05,14).filter(([a,b])=>b-a>=18).map(([x0,x1])=>{
      let ty0=H,ty1=0,area=0;
      for(let py=0;py<H;py++)for(let px=x0;px<=x1;px++)if(al(px,py)>AT){area++;if(py<ty0)ty0=py;if(py>ty1)ty1=py;}
      return {x0,x1,y0:ty0,y1:ty1,area};
    });
    blobs.sort((a,b)=>b.area-a.area);
    const need=job.out.length;
    let chosen=blobs.slice(0,need).sort((a,b)=>a.x0-b.x0);
    // need 2 but the subjects touch -> split the widest blob at its density valley
    if(need===2 && chosen.length<2){
      const b=blobs[0]||{x0:0,x1:W-1,y0:0,y1:H-1};
      const lo=Math.floor(b.x0+(b.x1-b.x0)*0.30), hi=Math.ceil(b.x0+(b.x1-b.x0)*0.70);
      let vx=lo, vmin=Infinity; for(let px=lo;px<=hi;px++){ if(colDen[px]<vmin){vmin=colDen[px];vx=px;} }
      const mk=(x0,x1)=>{let ty0=H,ty1=0;for(let py=0;py<H;py++)for(let px=x0;px<=x1;px++)if(al(px,py)>AT){if(py<ty0)ty0=py;if(py>ty1)ty1=py;}return {x0,y0:ty0,x1,y1:ty1};};
      chosen=[mk(b.x0,vx-1), mk(vx+1,b.x1)];
    }
    if(chosen.length<need) while(chosen.length<need) chosen.push(chosen[chosen.length-1]);

    job.out.forEach((spec, idx) => {
      const bb = chosen[Math.min(idx,chosen.length-1)];
      const cw=bb.x1-bb.x0+1, ch=bb.y1-bb.y0+1;
      const sc = (spec.th||150)/ch;                 // downscale to a game-friendly size
      const cw2=cw*sc, ch2=ch*sc;
      const N=8, PADX=Math.round(cw2*0.16), PADT=Math.round(ch2*0.16), PADB=Math.round(ch2*0.10);
      const CW=Math.round(cw2+PADX*2), CH=Math.round(ch2+PADT+PADB);
      const o=document.createElement('canvas'); o.width=CW*N; o.height=CH;
      const oc=o.getContext('2d'); oc.imageSmoothingEnabled=true;
      for(let f=0;f<N;f++){
        const t=f/N, ph=t*Math.PI*2, s=Math.sin(ph);
        let sx=1,sy=1,xoff=0,yoff=0,alpha=1,centered=false;
        if(spec.motion==='squash'){ sy=1+0.14*s; sx=1/sy; yoff=-Math.max(0,s)*ch2*0.06; }
        else if(spec.motion==='float'){ centered=true; yoff=s*ch2*0.07; xoff=Math.sin(ph*0.7)*cw2*0.02; alpha=0.78+0.22*(0.5+0.5*s); }
        else if(spec.motion==='breathe'){ sy=1+0.04*s; sx=1-0.02*s; yoff=-s*ch2*0.015; xoff=Math.sin(ph*0.5)*cw2*0.012; }
        else if(spec.motion==='dragon'){ sy=1+0.05*s; sx=1+0.02*Math.sin(ph+Math.PI); yoff=s*ch2*0.025; }
        const cellX=f*CW;
        const ax = cellX + CW/2 + xoff;
        const ay = centered ? (CH/2 + yoff) : (CH - PADB + yoff);
        oc.save();
        oc.beginPath(); oc.rect(cellX,0,CW,CH); oc.clip();
        oc.globalAlpha=alpha;
        oc.translate(ax, ay); oc.scale(sc*sx, sc*sy);
        oc.drawImage(img, bb.x0,bb.y0,cw,ch, -cw/2, centered?-ch/2:-ch, cw, ch);
        oc.restore();
      }
      out[spec.name] = { url:o.toDataURL('image/png'), frames:N, cw:CW, ch:CH };
    });
  }
  return out;
}, {JOBS});

for (const [name, r] of Object.entries(results)){
  if (typeof r === 'string'){ console.log(name, r); continue; }
  fs.writeFileSync(path.join(dir,'assets',name+'.png'), Buffer.from(r.url.split(',')[1],'base64'));
  console.log((name+'.png').padEnd(14), 'frames='+r.frames, 'cell='+r.cw+'x'+r.ch);
}
await browser.close(); server.close();
console.log('done');
