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
const page=await browser.newPage({viewport:{width:1200,height:940}});
await page.goto(`http://127.0.0.1:${PORT}/index.html`);
await page.waitForTimeout(150);
const info = await page.evaluate(async ()=>{
  const img=await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src='assets/raw/bestiary.png';});
  const W=img.width,H=img.height;
  const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.drawImage(img,0,0);
  const A=x.getImageData(0,0,W,H).data;
  const px=(i)=>[A[i*4],A[i*4+1],A[i*4+2]];
  // classify: cell-grey = low saturation, mid-low brightness
  const isGrey=(r,g,b)=>{const mx=Math.max(r,g,b),mn=Math.min(r,g,b);const br=(r+g+b)/3;return (mx-mn)<28 && br>34 && br<96;};
  // connected components of grey -> candidate cells
  const lab=new Int32Array(W*H).fill(-1);const comps=[];let id=0;
  for(let sy=0;sy<H;sy+=1)for(let sx=0;sx<W;sx+=1){
    const si=sy*W+sx;const [r,g,b]=px(si);
    if(!isGrey(r,g,b)||lab[si]!==-1)continue;
    const cid=id++;let area=0,x0=sx,x1=sx,y0=sy,y1=sy;const st=[si];lab[si]=cid;
    while(st.length){const p=st.pop();const py=(p/W)|0,pxx=p-py*W;area++;if(pxx<x0)x0=pxx;if(pxx>x1)x1=pxx;if(py<y0)y0=py;if(py>y1)y1=py;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=pxx+dx,ny=py+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const ni=ny*W+nx;const q=px(ni);if(isGrey(q[0],q[1],q[2])&&lab[ni]===-1){lab[ni]=cid;st.push(ni);}}}
    comps.push({area,x0,y0,x1,y1,w:x1-x0+1,h:y1-y0+1});
  }
  // keep cell-like regions (roughly square-ish, decent size)
  const cells=comps.filter(c=>c.area>1500 && c.w>28 && c.h>28 && c.w<160 && c.h<160);
  // debug overlay
  x.lineWidth=2;x.strokeStyle='#00ffb0';
  for(const c of cells) x.strokeRect(c.x0,c.y0,c.w,c.h);
  return { W,H, totalComps:comps.length, cellCount:cells.length,
    cells:cells.map(c=>({x:c.x0,y:c.y0,w:c.w,h:c.h})).slice(0,60),
    debug:c.toDataURL('image/png') };
});
fs.writeFileSync(path.join(dir,'bestiary-debug.png'),Buffer.from(info.debug.split(',')[1],'base64'));
console.log('W/H',info.W,info.H,'grey-cell candidates:',info.cellCount);
console.log('sample cells:',JSON.stringify(info.cells.slice(0,16)));
await browser.close();server.close();
