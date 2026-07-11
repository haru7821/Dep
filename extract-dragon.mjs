/* New Dragon.png → 2-row×1-col sheet (row0 idle, row1 attack+fire).
   Opaque white/grey checkerboard keyed out; the two poses are split by a
   full-height dark divider (~x1892). Keep only each side's largest connected
   blob (copying just that blob's pixels), dragon right+bottom aligned. */
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';import path from 'path';import fs from 'fs';import http from 'http';
const dir=path.dirname(fileURLToPath(import.meta.url));
const server=http.createServer((req,res)=>{const p=path.join(dir,decodeURIComponent(req.url.split('?')[0]));fs.readFile(p,(e,b)=>{if(e){res.writeHead(404);res.end();return;}const x=path.extname(p);res.writeHead(200,{'Content-Type':x==='.png'?'image/png':'text/html'});res.end(b);});});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const PORT=server.address().port;
const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const page=await browser.newPage();await page.goto(`http://127.0.0.1:${PORT}/blank.html`);
const out=await page.evaluate(async()=>{
  const img=await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src='/assets/raw/Dragon.png';});
  const W=img.width,H=img.height;const c=document.createElement('canvas');c.width=W;c.height=H;const gx=c.getContext('2d');gx.drawImage(img,0,0);
  const A=gx.getImageData(0,0,W,H).data;
  const isBG=(r,g,b)=>{const mx=Math.max(r,g,b),mn=Math.min(r,g,b);return (mx-mn)<30 && mn>158;};
  const Np=W*H;const fg=new Uint8Array(Np);
  for(let py=0;py<H;py++)for(let px=0;px<W;px++){const j=(py*W+px)*4;if(!isBG(A[j],A[j+1],A[j+2]))fg[py*W+px]=1;}
  // divider = full-height dark thin line in the central band
  let dvx=Math.floor(W/2),dv=-1;for(let px=Math.floor(W*0.4);px<Math.floor(W*0.6);px++){let d=0;for(let py=0;py<H;py++){const j=(py*W+px)*4;if((A[j]+A[j+1]+A[j+2])/3<60)d++;}if(d>dv){dv=d;dvx=px;}}
  const splitL=dvx-40, splitR=dvx+60;
  const lab=new Int32Array(Np).fill(-1);let cid=0;
  function blob(x0,x1){
    let best=null;
    for(let sy=0;sy<H;sy++)for(let sx=x0;sx<=x1;sx++){const si=sy*W+sx;if(!fg[si]||lab[si]!==-1)continue;const id=cid++;
      let area=0,mnx=sx,mxx=sx,mny=sy,mxy=sy;const st=[si];lab[si]=id;
      while(st.length){const p=st.pop();const py=(p/W)|0,px=p-py*W;area++;if(px<mnx)mnx=px;if(px>mxx)mxx=px;if(py<mny)mny=py;if(py>mxy)mxy=py;
        const nb=[[px-1,py],[px+1,py],[px,py-1],[px,py+1]];
        for(const [nx,ny] of nb){if(nx<x0||nx>x1||ny<0||ny>=H)continue;const q=ny*W+nx;if(fg[q]&&lab[q]===-1){lab[q]=id;st.push(q);}}}
      if(!best||area>best.area)best={id,area,x0:mnx,x1:mxx,y0:mny,y1:mxy};
    }
    best.w=best.x1-best.x0+1;best.h=best.y1-best.y0+1;return best;
  }
  const idle=blob(splitR,W-1), atk=blob(0,splitL);
  const cellW=Math.max(idle.w,atk.w), cellH=Math.max(idle.h,atk.h);
  const sc=Math.min(1,360/cellH);const CW=Math.round(cellW*sc),CH=Math.round(cellH*sc);
  const o=document.createElement('canvas');o.width=CW;o.height=CH*2;const oc=o.getContext('2d');oc.imageSmoothingEnabled=true;
  function place(f,rowY){
    const mc=document.createElement('canvas');mc.width=f.w;mc.height=f.h;const mx=mc.getContext('2d');const md=mx.createImageData(f.w,f.h);
    for(let py=f.y0;py<=f.y1;py++)for(let px=f.x0;px<=f.x1;px++){if(lab[py*W+px]!==f.id)continue;const di=((py-f.y0)*f.w+(px-f.x0))*4,gj=(py*W+px)*4;md.data[di]=A[gj];md.data[di+1]=A[gj+1];md.data[di+2]=A[gj+2];md.data[di+3]=A[gj+3];}
    mx.putImageData(md,0,0);const dw=f.w*sc,dh=f.h*sc;oc.drawImage(mc,0,0,f.w,f.h,CW-dw,rowY+(CH-dh),dw,dh);
  }
  place(idle,0);place(atk,CH);
  return{url:o.toDataURL('image/png'),dvx,CW,CH,idle:{w:idle.w,h:idle.h},atk:{w:atk.w,h:atk.h}};
});
fs.writeFileSync(path.join(dir,'assets','dragon.png'),Buffer.from(out.url.split(',')[1],'base64'));
console.log('cell='+out.CW+'x'+out.CH,'dvx='+out.dvx,'idle',JSON.stringify(out.idle),'atk',JSON.stringify(out.atk));
await browser.close();server.close();
