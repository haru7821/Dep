/* Extracts the six monsters from assets/raw/bestiary.png into 2-row animation
   sheets (row0 = idle, row1 = attack). Detects the grey frame cells, keys out
   the cell background, blanks the number label, isolates the sprite (largest
   connected blob), then packs frames at one uniform scale per monster. */
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

const results = await page.evaluate(async ()=>{
  const img=await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src='assets/raw/bestiary.png';});
  const W=img.width,H=img.height;
  const c=document.createElement('canvas');c.width=W;c.height=H;const gx=c.getContext('2d');gx.drawImage(img,0,0);
  const A=gx.getImageData(0,0,W,H).data;
  const at=(x,y,k)=>A[(y*W+x)*4+k];
  const isGrey=(r,g,b)=>{const mx=Math.max(r,g,b),mn=Math.min(r,g,b);const br=(r+g+b)/3;return (mx-mn)<28 && br>34 && br<96;};

  // ---- detect grey cells ----
  const lab=new Int32Array(W*H).fill(-1);const comps=[];let id=0;
  for(let sy=0;sy<H;sy++)for(let sx=0;sx<W;sx++){
    const si=sy*W+sx;if(!isGrey(at(sx,sy,0),at(sx,sy,1),at(sx,sy,2))||lab[si]!==-1)continue;
    const cid=id++;let area=0,x0=sx,x1=sx,y0=sy,y1=sy;const st=[si];lab[si]=cid;
    while(st.length){const p=st.pop();const py=(p/W)|0,pxx=p-py*W;area++;if(pxx<x0)x0=pxx;if(pxx>x1)x1=pxx;if(py<y0)y0=py;if(py>y1)y1=py;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=pxx+dx,ny=py+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const ni=ny*W+nx;if(isGrey(at(nx,ny,0),at(nx,ny,1),at(nx,ny,2))&&lab[ni]===-1){lab[ni]=cid;st.push(ni);}}}
    comps.push({area,x0,y0,x1,y1,w:x1-x0+1,h:y1-y0+1});
  }
  const cells=comps.filter(c=>c.area>1500&&c.w>28&&c.h>28&&c.w<170&&c.h<170);

  // ---- monster + anim by region (from layout) ----
  function assign(cx,cy){
    const col = cx<595 ? 'L' : 'R';
    const band = (a,b)=>cy>=a&&cy<b;
    if(col==='L'){
      if(band(120,216))return['dragon','idle']; if(band(216,330))return['dragon','attack'];
      if(band(380,481))return['elderghost','idle']; if(band(481,595))return['elderghost','attack'];
      if(band(630,720))return['slime','idle']; if(band(720,806))return['slime','attack'];
      return null; // slime split row -> ignore
    } else {
      if(band(120,216))return['skeleton','idle']; if(band(216,330))return['skeleton','attack'];
      if(band(380,481))return['zombie','idle']; if(band(481,595))return['zombie','attack'];
      if(band(630,720))return['specter','idle']; if(band(720,840))return['specter','attack'];
      return null;
    }
  }

  // ---- extract a sprite from one cell ----
  function extract(cell){
    const inx=cell.x0+2, iny=cell.y0+2, iw=cell.w-4, ih=cell.h-4;
    // sample background grey (edge pixels)
    let br=0,bg2=0,bb=0,bn=0;
    for(let x=inx;x<inx+iw;x+=3){ for(const y of [iny,iny+ih-1]){ br+=at(x,y,0);bg2+=at(x,y,1);bb+=at(x,y,2);bn++; } }
    const BR=br/bn, BG=bg2/bn, BB=bb/bn;
    const cw=iw,ch=ih;
    // mask: keep pixels far from bg grey; blank number corner (top-left)
    const keep=new Uint8Array(cw*ch);
    for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){
      if(x<20&&y<16) continue;                       // number label
      const gxp=inx+x, gyp=iny+y;
      const r=at(gxp,gyp,0),g=at(gxp,gyp,1),b=at(gxp,gyp,2),al=at(gxp,gyp,3);
      if(al<40) continue;
      const d=Math.abs(r-BR)+Math.abs(g-BG)+Math.abs(b-BB);
      if(d>64) keep[y*cw+x]=1;                        // sprite pixel
    }
    // largest connected blob among kept
    const lb=new Int32Array(cw*ch).fill(-1);let best=null,cid=0;
    for(let sy=0;sy<ch;sy++)for(let sx=0;sx<cw;sx++){
      const si=sy*cw+sx;if(!keep[si]||lb[si]!==-1)continue;const my=cid++;
      let area=0,x0=sx,x1=sx,y0=sy,y1=sy;const st=[si];lb[si]=my;
      while(st.length){const p=st.pop();const py=(p/cw)|0,pxx=p-py*cw;area++;if(pxx<x0)x0=pxx;if(pxx>x1)x1=pxx;if(py<y0)y0=py;if(py>y1)y1=py;
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=pxx+dx,ny=py+dy;if(nx<0||ny<0||nx>=cw||ny>=ch)continue;const ni=ny*cw+nx;if(keep[ni]&&lb[ni]===-1){lb[ni]=my;st.push(ni);}}}
      if(!best||area>best.area)best={id:my,area,x0,y0,x1,y1};
    }
    if(!best||best.area<120) return null;             // empty cell
    const sw=best.x1-best.x0+1, sh=best.y1-best.y0+1;
    const oc=document.createElement('canvas');oc.width=sw;oc.height=sh;const octx=oc.getContext('2d');
    const md=octx.createImageData(sw,sh);
    for(let y=best.y0;y<=best.y1;y++)for(let x=best.x0;x<=best.x1;x++){
      if(lb[y*cw+x]!==best.id)continue;
      const di=((y-best.y0)*sw+(x-best.x0))*4, gxp=inx+x, gyp=iny+y, gj=(gyp*W+gxp)*4;
      md.data[di]=A[gj];md.data[di+1]=A[gj+1];md.data[di+2]=A[gj+2];md.data[di+3]=A[gj+3];
    }
    octx.putImageData(md,0,0);
    return {canvas:oc, w:sw, h:sh, cx:cell.x0};
  }

  // ---- gather frames per monster/anim ----
  const mons={};
  for(const cell of cells){
    const a=assign(cell.x0, cell.y0); if(!a) continue;
    const [m,anim]=a; const sp=extract(cell); if(!sp) continue;
    (mons[m] ||= {idle:[],attack:[]})[anim].push(sp);
  }
  for(const m in mons){ mons[m].idle.sort((p,q)=>p.cx-q.cx); mons[m].attack.sort((p,q)=>p.cx-q.cx); }

  // ---- pack each monster into a 2-row sheet (idle, attack) ----
  const TH={dragon:210, elderghost:180, skeleton:150, zombie:150, slime:120, specter:150};
  const out={};
  for(const m in mons){
    const idle=mons[m].idle, atk=mons[m].attack.length?mons[m].attack:idle;
    const all=idle.concat(atk); if(!all.length) continue;
    const refH=all.map(s=>s.h).sort((a,b)=>a-b)[Math.floor(all.length/2)]||1;
    const th=TH[m]||150, sc=th/refH;
    const maxW=Math.max(...all.map(s=>s.w*sc)), maxH=Math.max(...all.map(s=>s.h*sc));
    const CW=Math.round(maxW+18), CH=Math.round(maxH+14);
    const cols=Math.max(idle.length, atk.length);
    const o=document.createElement('canvas');o.width=CW*cols;o.height=CH*2;const oc=o.getContext('2d');oc.imageSmoothingEnabled=true;
    const rowDraw=(frames,row)=>frames.forEach((s,c)=>{
      const dw=s.w*sc,dh=s.h*sc, dx=c*CW+(CW-dw)/2, dy=row*CH+(CH-dh)-4;
      oc.save();oc.beginPath();oc.rect(c*CW,row*CH,CW,CH);oc.clip();
      oc.drawImage(s.canvas,0,0,s.w,s.h,dx,dy,dw,dh);oc.restore();
    });
    rowDraw(idle,0); rowDraw(atk,1);
    out[m]={url:o.toDataURL('image/png'), idle:idle.length, attack:atk.length, cols, cw:CW, ch:CH};
  }
  return out;
});

for(const [m,r] of Object.entries(results)){
  fs.writeFileSync(path.join(dir,'assets',m+'.png'),Buffer.from(r.url.split(',')[1],'base64'));
  console.log(m.padEnd(11),'idle='+r.idle,'attack='+r.attack,'cols='+r.cols,'cell='+r.cw+'x'+r.ch);
}
await browser.close();server.close();
console.log('done');
