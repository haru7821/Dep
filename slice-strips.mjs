/* Slices the single-row hero animation strips in assets/raw/ into clean 1-row
   sprite sheets. Detects frames by column density, drops the baked-in
   "SKILL"/"CAST" label via colour-variety, and re-packs at one uniform scale. */
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import http from 'http';
const dir = path.dirname(fileURLToPath(import.meta.url));
const JOBS = [
  { out:'warrior.png',  src:'raw/warrior.png'  },  // Garran
  { out:'wizard.png',   src:'raw/wizard.png'   },  // Mira   (purple wizard)
  { out:'archer.png',   src:'raw/archer.png'   },  // Faye
  { out:'sorcerer.png', src:'raw/sorcerer.png' },  // Rai    (elemental sorcerer)
  { out:'shadow.png',   src:'raw/shadow.png'   },  // Boss
];
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

const report={};
for (const job of JOBS){
  const r = await page.evaluate(async ({src}) => {
    const img = await new Promise(res=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>res(null);i.src='assets/'+src;});
    if(!img) return {error:'load'};
    const W=img.width,H=img.height;
    const cv=document.createElement('canvas'); cv.width=W; cv.height=H;
    const cx=cv.getContext('2d'); cx.drawImage(img,0,0);
    const A=cx.getImageData(0,0,W,H).data;
    const al=(x,y)=>A[(y*W+x)*4+3]; const AT=24;
    const seg=(d,thr,g)=>{const r=[];let s=-1,gap=0;for(let i=0;i<d.length;i++){if(d[i]>=thr){if(s<0)s=i;gap=0;}else if(s>=0){gap++;if(gap>=g){r.push([s,i-gap]);s=-1;}}}if(s>=0)r.push([s,d.length-1]);return r;};
    // whole strip is one row; find its vertical extent
    const rowDen=new Array(H).fill(0);
    for(let y=0;y<H;y++){let n=0;for(let x=0;x<W;x+=2)if(al(x,y)>AT)n++;rowDen[y]=n;}
    const maxRow=Math.max(...rowDen); const band=seg(rowDen,maxRow*0.04,6)[0]||[0,H-1];
    const [y0,y1]=band;
    // columns -> frames
    const colDen=new Array(W).fill(0);
    for(let x=0;x<W;x++){let n=0;for(let y=y0;y<=y1;y++)if(al(x,y)>AT)n++;colDen[x]=n;}
    const maxCol=Math.max(...colDen);
    let runs=seg(colDen,maxCol*0.06,10).filter(([a,b])=>b-a>=14);
    // colour variety per run (character = many colours; label text = few)
    const variety=(x0,x1)=>{const s=new Set();let n=0;for(let y=y0;y<=y1;y+=2)for(let x=x0;x<=x1;x+=2){const i=(y*W+x)*4;if(A[i+3]<=AT)continue;n++;s.add(((A[i]>>5)<<6)|((A[i+1]>>5)<<3)|(A[i+2]>>5));}return n>40?s.size:0;};
    const withV=runs.map(([x0,x1])=>({x0,x1,v:variety(x0,x1)}));
    const maxV=Math.max(1,...withV.map(f=>f.v));
    let frames=withV.filter(f=>f.v>=maxV*0.5).map(f=>{
      let ty0=y1,ty1=y0;for(let y=y0;y<=y1;y++)for(let x=f.x0;x<=f.x1;x+=2){if(al(x,y)>AT){if(y<ty0)ty0=y;if(y>ty1)ty1=y;break;}}
      return {x0:f.x0,x1:f.x1,y0:ty0,y1:ty1};
    });
    if(frames.length>12) frames=frames.slice(0,12);
    // uniform scale from median frame height
    const CW=132,CH=150;
    const hs=frames.map(f=>f.y1-f.y0+1).sort((a,b)=>a-b); const refH=hs[Math.floor(hs.length/2)]||1;
    const scale=Math.min((CH-14)/refH,3.2);
    const o=document.createElement('canvas'); o.width=frames.length*CW; o.height=CH;
    const oc=o.getContext('2d'); oc.imageSmoothingEnabled=true;
    frames.forEach((f,c)=>{const fw=f.x1-f.x0+1,fh=f.y1-f.y0+1,dw=fw*scale,dh=fh*scale;
      oc.save(); oc.beginPath(); oc.rect(c*CW,0,CW,CH); oc.clip();
      oc.drawImage(img,f.x0,f.y0,fw,fh, c*CW+(CW-dw)/2, (CH-dh)-4, dw,dh); oc.restore();});
    return {url:o.toDataURL('image/png'), frames:frames.length};
  }, {src:job.src});
  if(r.error){console.log(job.out,'ERR',r.error);continue;}
  fs.writeFileSync(path.join(dir,'assets',job.out), Buffer.from(r.url.split(',')[1],'base64'));
  report[job.out]=r.frames; console.log(job.out.padEnd(13),'frames='+r.frames);
}
await browser.close(); server.close();
fs.writeFileSync(path.join(dir,'assets','.strip-report.json'), JSON.stringify(report,null,2));
console.log('done');
