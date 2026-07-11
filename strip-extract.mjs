/* Extracts single-row idle+attack strips (assets/raw/*) into 2-row sheets
   (row0 idle, row1 attack). Detects frames by COLOURED content (so the grey
   IDLE/ATTACK labels are ignored), splits idle vs attack at the widest gap,
   then keys each frame's cell grey to isolate the sprite. Writes to _strip/. */
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import http from 'http';
const dir = path.dirname(fileURLToPath(import.meta.url));
const server = http.createServer((req,res)=>{
  const p=path.join(dir,decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p,(e,b)=>{ if(e){res.writeHead(404);res.end();return;}
    const ext=path.extname(p);res.writeHead(200,{'Content-Type':ext==='.js'?'application/javascript':ext==='.html'?'text/html':ext==='.png'?'image/png':'application/octet-stream'});res.end(b);});
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const PORT=server.address().port;
const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const page=await browser.newPage();
await page.goto(`http://127.0.0.1:${PORT}/index.html`);
await page.waitForTimeout(150);

// source file -> output name
const JOBS=[
  {src:'tower',   out:'tower'},
  {src:'warrior', out:'warrior'},
  {src:'Archer',  out:'archer'},
  {src:'Wizard',  out:'wizard'},
  {src:'Sorcerer',out:'sorcerer'},
  {src:'Shadow',  out:'shadow'},
];

const results = await page.evaluate(async ({JOBS})=>{
  const out={};
  const seg=(d,thr,gap)=>{const r=[];let s=-1,g=0;for(let i=0;i<d.length;i++){if(d[i]>=thr){if(s<0)s=i;g=0;}else if(s>=0){g++;if(g>=gap){r.push([s,i-g]);s=-1;}}}if(s>=0)r.push([s,d.length-1]);return r;};

  for(const job of JOBS){
    const img=await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src='assets/raw/'+job.src+'.png';});
    if(!img){continue;}
    const W=img.width,H=img.height;
    const c=document.createElement('canvas');c.width=W;c.height=H;const gx=c.getContext('2d');gx.drawImage(img,0,0);
    const A=gx.getImageData(0,0,W,H).data;
    const at=(x,y,k)=>A[(y*W+x)*4+k];
    const isBG=(r,g,b)=>{const mx=Math.max(r,g,b),mn=Math.min(r,g,b);const br=(r+g+b)/3;return (mx-mn)<26 && br>=30 && br<=120;};
    const isWhite=(r,g,b)=>r>205&&g>205&&b>205;
    // colourful mask (ignores grey labels & bg) for frame detection/splitting
    const colDen=new Array(W).fill(0);
    for(let x=0;x<W;x++){let n=0;for(let y=0;y<H;y++){const r=at(x,y,0),g=at(x,y,1),b=at(x,y,2),a=at(x,y,3);if(a>60&&(Math.max(r,g,b)-Math.min(r,g,b))>32)n++;}colDen[x]=n;}
    const maxD=Math.max(...colDen);
    let runs=seg(colDen,Math.max(2,maxD*0.10),14).filter(([a,b])=>b-a>=18);
    if(!runs.length){continue;}
    // split idle vs attack at widest gap between runs
    let gapAt=runs.length,mg=-1;
    for(let i=1;i<runs.length;i++){const g=runs[i][0]-runs[i-1][1];if(g>mg){mg=g;gapAt=i;}}

    function extract(rx0,rx1){
      const px0=Math.max(0,rx0-6),px1=Math.min(W-1,rx1+6),py0=24,py1=H-3;  // skip the top label band
      let br=0,bg=0,bb=0,bn=0;
      for(let x=px0;x<=px1;x+=2){const y=py0;const r=at(x,y,0),g=at(x,y,1),b=at(x,y,2);if(isBG(r,g,b)){br+=r;bg+=g;bb+=b;bn++;}}
      for(let y=py0;y<=py1;y+=2){for(const x of [px0,px1]){const r=at(x,y,0),g=at(x,y,1),b=at(x,y,2);if(isBG(r,g,b)){br+=r;bg+=g;bb+=b;bn++;}}}
      const BR=bn?br/bn:80,BG=bn?bg/bn:80,BB=bn?bb/bn:80;
      const cw=px1-px0+1,ch=py1-py0+1,keep=new Uint8Array(cw*ch);
      for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){const gxp=px0+x,gyp=py0+y,r=at(gxp,gyp,0),g=at(gxp,gyp,1),b=at(gxp,gyp,2),a=at(gxp,gyp,3);
        if(a<50||isWhite(r,g,b))continue; if(Math.abs(r-BR)+Math.abs(g-BG)+Math.abs(b-BB)>58)keep[y*cw+x]=1;}
      const lb=new Int32Array(cw*ch).fill(-1);let best=null,cid=0;
      for(let sy=0;sy<ch;sy++)for(let sx=0;sx<cw;sx++){const si=sy*cw+sx;if(!keep[si]||lb[si]!==-1)continue;const my=cid++;let area=0,x0=sx,x1=sx,y0=sy,y1=sy;const st=[si];lb[si]=my;
        while(st.length){const p=st.pop();const py=(p/cw)|0,pxx=p-py*cw;area++;if(pxx<x0)x0=pxx;if(pxx>x1)x1=pxx;if(py<y0)y0=py;if(py>y1)y1=py;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=pxx+dx,ny=py+dy;if(nx<0||ny<0||nx>=cw||ny>=ch)continue;const ni=ny*cw+nx;if(keep[ni]&&lb[ni]===-1){lb[ni]=my;st.push(ni);}}}
        if(!best||area>best.area)best={id:my,area,x0,y0,x1,y1};}
      if(!best||best.area<150)return null;
      const sw=best.x1-best.x0+1,sh=best.y1-best.y0+1;const oc=document.createElement('canvas');oc.width=sw;oc.height=sh;const octx=oc.getContext('2d');const md=octx.createImageData(sw,sh);
      for(let y=best.y0;y<=best.y1;y++)for(let x=best.x0;x<=best.x1;x++){if(lb[y*cw+x]!==best.id)continue;const di=((y-best.y0)*sw+(x-best.x0))*4,gxp=px0+x,gyp=py0+y,gj=(gyp*W+gxp)*4;md.data[di]=A[gj];md.data[di+1]=A[gj+1];md.data[di+2]=A[gj+2];md.data[di+3]=A[gj+3];}
      octx.putImageData(md,0,0);return{canvas:oc,w:sw,h:sh};
    }

    const doAll=rs=>rs.map(([x0,x1])=>extract(x0,x1)).filter(Boolean);
    const idle=doAll(runs.slice(0,gapAt)), atk0=doAll(runs.slice(gapAt)), atk=atk0.length?atk0:idle;
    const all=idle.concat(atk); if(!all.length)continue;
    const refH=all.map(s=>s.h).sort((a,b)=>a-b)[Math.floor(all.length/2)]||1;
    const th=150,sc=th/refH;
    const CW=Math.round(Math.max(...all.map(s=>s.w*sc))+16),CH=Math.round(Math.max(...all.map(s=>s.h*sc))+12),cols=Math.max(idle.length,atk.length);
    const o=document.createElement('canvas');o.width=CW*cols;o.height=CH*2;const oc=o.getContext('2d');oc.imageSmoothingEnabled=true;
    const row=(fr,r)=>fr.forEach((s,ci)=>{const dw=s.w*sc,dh=s.h*sc,dx=ci*CW+(CW-dw)/2,dy=r*CH+(CH-dh)-4;oc.save();oc.beginPath();oc.rect(ci*CW,r*CH,CW,CH);oc.clip();oc.drawImage(s.canvas,0,0,s.w,s.h,dx,dy,dw,dh);oc.restore();});
    row(idle,0);row(atk,1);
    out[job.out]={url:o.toDataURL('image/png'),idle:idle.length,attack:atk.length,cols,cw:CW,ch:CH};
  }
  return out;
}, {JOBS});

fs.mkdirSync(path.join(dir,'assets','_strip'),{recursive:true});
for(const [n,r] of Object.entries(results)){
  fs.writeFileSync(path.join(dir,'assets','_strip',n+'.png'),Buffer.from(r.url.split(',')[1],'base64'));
  console.log(n.padEnd(9),'idle='+r.idle,'attack='+r.attack,'cols='+r.cols,'cell='+r.cw+'x'+r.ch);
}
await browser.close();server.close();
console.log('done');
