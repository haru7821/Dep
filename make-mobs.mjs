/* Turns the single-image monsters in assets/raw/ into looping animation strips.
   Isolates the monster with connected-component labelling (keeps only the main
   blob, so detached swords / flags / stray artifacts are removed), then
   procedurally animates it (slime squash, ghost float, orc/skeleton breathe,
   dragon breathe). ghost.png -> ghost + skeleton (its two largest blobs).
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

const JOBS = [
  { src:'raw/slime.png',  out:[{name:'slime',   motion:'squash',  th:120}] },
  { src:'raw/ghost.png',  out:[{name:'ghost',   motion:'float',   th:150}, {name:'skeleton', motion:'breathe', th:160}] },
  { src:'raw/oak.png',    out:[{name:'orc',     motion:'breathe', th:150}] },
  { src:'raw/dragon.png', out:[{name:'dragon',  motion:'dragon',  th:210}] },
];

const results = await page.evaluate(async ({JOBS}) => {
  const out = {};
  const load = f => new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src='assets/'+f;});

  for (const job of JOBS){
    const img = await load(job.src); if(!img){ out[job.src]='load-fail'; continue; }
    const W=img.width,H=img.height;
    const c=document.createElement('canvas'); c.width=W;c.height=H;
    const cx=c.getContext('2d'); cx.drawImage(img,0,0);
    const A=cx.getImageData(0,0,W,H).data; const AT=40;

    // connected components (8-conn) over opaque pixels
    const labels=new Int32Array(W*H).fill(-1);
    const comps=[]; let id=0;
    for(let sy=0;sy<H;sy++) for(let sx=0;sx<W;sx++){
      const si=sy*W+sx;
      if(A[si*4+3]<=AT || labels[si]!==-1) continue;
      const cid=id++; let area=0,x0=sx,x1=sx,y0=sy,y1=sy;
      const st=[si]; labels[si]=cid;
      while(st.length){
        const p=st.pop(); const py=(p/W)|0, px=p-py*W;
        area++; if(px<x0)x0=px; if(px>x1)x1=px; if(py<y0)y0=py; if(py>y1)y1=py;
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
          if(!dx&&!dy)continue; const nx=px+dx,ny=py+dy;
          if(nx<0||ny<0||nx>=W||ny>=H)continue; const ni=ny*W+nx;
          if(A[ni*4+3]>AT && labels[ni]===-1){ labels[ni]=cid; st.push(ni); }
        }
      }
      comps.push({id:cid,area,x0,y0,x1,y1});
    }
    comps.sort((a,b)=>b.area-a.area);
    const need=job.out.length;
    let chosen=comps.slice(0,need).sort((a,b)=>a.x0-b.x0);   // largest N, left->right
    while(chosen.length<need) chosen.push(chosen[chosen.length-1]||{id:0,x0:0,y0:0,x1:W-1,y1:H-1});

    job.out.forEach((spec, idx) => {
      const comp = chosen[Math.min(idx,chosen.length-1)];
      const cw=comp.x1-comp.x0+1, ch=comp.y1-comp.y0+1;
      // masked sprite: only this component's pixels (drop everything else)
      const mc=document.createElement('canvas'); mc.width=cw; mc.height=ch;
      const mx=mc.getContext('2d'); const md=mx.createImageData(cw,ch);
      for(let py=comp.y0;py<=comp.y1;py++) for(let px=comp.x0;px<=comp.x1;px++){
        const gi=py*W+px; if(labels[gi]!==comp.id) continue;
        const di=((py-comp.y0)*cw+(px-comp.x0))*4, gj=gi*4;
        md.data[di]=A[gj]; md.data[di+1]=A[gj+1]; md.data[di+2]=A[gj+2]; md.data[di+3]=A[gj+3];
      }
      mx.putImageData(md,0,0);

      const sc=(spec.th||150)/ch, cw2=cw*sc, ch2=ch*sc;
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
        const cellX=f*CW, ax=cellX+CW/2+xoff, ay=centered?(CH/2+yoff):(CH-PADB+yoff);
        oc.save();
        oc.beginPath(); oc.rect(cellX,0,CW,CH); oc.clip();
        oc.globalAlpha=alpha;
        oc.translate(ax,ay); oc.scale(sc*sx, sc*sy);
        oc.drawImage(mc, 0,0,cw,ch, -cw/2, centered?-ch/2:-ch, cw,ch);
        oc.restore();
      }
      out[spec.name]={ url:o.toDataURL('image/png'), frames:N, cw:CW, ch:CH };
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
