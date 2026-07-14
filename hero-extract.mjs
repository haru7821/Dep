/* Extracts heroes from assets/raw/hero.png into 2-row sheets (row0 idle, row1
   attack). hero.png is a flat grey grid, so: per hero-row, segment frames by
   column density of non-grey pixels (robust to sprite fragmentation), split
   idle vs attack at the widest gap, then extract each frame by keying that
   frame-cell's sampled grey (preserves the sprite incl. armour) + largest blob.
   Writes to assets/_hero/ for preview. */
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
  const img=await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src='assets/raw/hero.png';});
  const W=img.width,H=img.height;
  const cvv=document.createElement('canvas');cvv.width=W;cvv.height=H;const gx=cvv.getContext('2d');gx.drawImage(img,0,0);
  const A=gx.getImageData(0,0,W,H).data;
  const at=(x,y,k)=>A[(y*W+x)*4+k];
  const isBG=(r,g,b)=>{const mx=Math.max(r,g,b),mn=Math.min(r,g,b);const br=(r+g+b)/3;return (mx-mn)<26 && br>=30 && br<=120;};
  const isWhite=(r,g,b)=>r>205&&g>205&&b>205;
  // broad mask for frame detection
  const mask=new Uint8Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const r=at(x,y,0),g=at(x,y,1),b=at(x,y,2),al=at(x,y,3);if(al>50&&!isBG(r,g,b)&&!isWhite(r,g,b))mask[y*W+x]=1;}
  const seg=(d,thr,gap)=>{const r=[];let s=-1,g=0;for(let i=0;i<d.length;i++){if(d[i]>=thr){if(s<0)s=i;g=0;}else if(s>=0){g++;if(g>=gap){r.push([s,i-g]);s=-1;}}}if(s>=0)r.push([s,d.length-1]);return r;};

  // per-frame fine extraction (key the frame's cell grey, keep sprite)
  function extract(rx0,rx1,by0,by1){
    const px0=Math.max(0,rx0-2),px1=Math.min(W-1,rx1+2);
    // sample cell background grey from the frame's top edge + side columns
    let br=0,bg=0,bb=0,bn=0;
    for(let x=px0;x<=px1;x+=2){ const y=by0; const r=at(x,y,0),g=at(x,y,1),b=at(x,y,2); if(isBG(r,g,b)){br+=r;bg+=g;bb+=b;bn++;} }
    for(let y=by0;y<=by1;y+=2){ for(const x of [px0,px1]){ const r=at(x,y,0),g=at(x,y,1),b=at(x,y,2); if(isBG(r,g,b)){br+=r;bg+=g;bb+=b;bn++;} } }
    const BR=bn?br/bn:70,BG=bn?bg/bn:70,BB=bn?bb/bn:70;
    const cw=px1-px0+1,ch=by1-by0+1,keep=new Uint8Array(cw*ch);
    for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){
      const gxp=px0+x,gyp=by0+y,r=at(gxp,gyp,0),g=at(gxp,gyp,1),b=at(gxp,gyp,2),al=at(gxp,gyp,3);
      if(al<50||isWhite(r,g,b))continue;
      if(Math.abs(r-BR)+Math.abs(g-BG)+Math.abs(b-BB)>60) keep[y*cw+x]=1;
    }
    // largest connected blob
    const lb=new Int32Array(cw*ch).fill(-1);let best=null,cid=0;
    for(let sy=0;sy<ch;sy++)for(let sx=0;sx<cw;sx++){const si=sy*cw+sx;if(!keep[si]||lb[si]!==-1)continue;const my=cid++;let area=0,x0=sx,x1=sx,y0=sy,y1=sy;const st=[si];lb[si]=my;
      while(st.length){const p=st.pop();const py=(p/cw)|0,pxx=p-py*cw;area++;if(pxx<x0)x0=pxx;if(pxx>x1)x1=pxx;if(py<y0)y0=py;if(py>y1)y1=py;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=pxx+dx,ny=py+dy;if(nx<0||ny<0||nx>=cw||ny>=ch)continue;const ni=ny*cw+nx;if(keep[ni]&&lb[ni]===-1){lb[ni]=my;st.push(ni);}}}
      if(!best||area>best.area)best={id:my,area,x0,y0,x1,y1};}
    if(!best||best.area<200)return null;
    const sw=best.x1-best.x0+1,sh=best.y1-best.y0+1;const oc=document.createElement('canvas');oc.width=sw;oc.height=sh;const octx=oc.getContext('2d');const md=octx.createImageData(sw,sh);
    for(let y=best.y0;y<=best.y1;y++)for(let x=best.x0;x<=best.x1;x++){if(lb[y*cw+x]!==best.id)continue;const di=((y-best.y0)*sw+(x-best.x0))*4,gxp=px0+x,gyp=by0+y,gj=(gyp*W+gxp)*4;md.data[di]=A[gj];md.data[di+1]=A[gj+1];md.data[di+2]=A[gj+2];md.data[di+3]=A[gj+3];}
    // reject label text: near-monochrome AND barely any saturated (coloured) pixels
    const set=new Set();let cn=0,colorful=0;
    for(let i=0;i<md.data.length;i+=8){ const a=md.data[i+3]; if(a<40)continue; const R=md.data[i],G=md.data[i+1],B=md.data[i+2];
      cn++; set.add(((R>>5)<<6)|((G>>5)<<3)|(B>>5)); if(Math.max(R,G,B)-Math.min(R,G,B)>30)colorful++; }
    if(cn>30 && (set.size<8 || colorful/cn < 0.14)) return null;
    octx.putImageData(md,0,0);return {canvas:oc,w:sw,h:sh,cx:px0};
  }

  const names=['warrior','archer','wizard','sorcerer','shadow'];
  const bandH=H/5, out={};
  for(let bi=0;bi<5;bi++){
    const by0=Math.round(bi*bandH)+34, by1=Math.round((bi+1)*bandH)-6;   // +34 skips the label row
    const colDen=new Array(W).fill(0);
    for(let x=0;x<W;x++){let n=0;for(let y=by0;y<=by1;y++)if(mask[y*W+x])n++;colDen[x]=n;}
    const maxD=Math.max(...colDen);
    let runs=seg(colDen,Math.max(3,maxD*0.09),12).filter(([a,b])=>b-a>=24 && b-a<=170);
    if(!runs.length)continue;
    // idle cells are on the left, attack cells on the right (consistent layout)
    const SPLIT=430;
    const doExtract=rs=>rs.map(([x0,x1])=>{
      let ty0=by1,ty1=by0;for(let y=by0;y<=by1;y++){let any=false;for(let x=x0;x<=x1;x++)if(mask[y*W+x]){any=true;break;}if(any){if(y<ty0)ty0=y;if(y>ty1)ty1=y;}}
      return extract(x0,x1,Math.max(by0,ty0-2),Math.min(by1,ty1+2));
    }).filter(Boolean);
    const idle=doExtract(runs.filter(r=>(r[0]+r[1])/2<SPLIT));
    const atk0=doExtract(runs.filter(r=>(r[0]+r[1])/2>=SPLIT));
    const atk=atk0.length?atk0:idle;
    const all=idle.concat(atk); if(!all.length)continue;
    const refH=all.map(s=>s.h).sort((a,b)=>a-b)[Math.floor(all.length/2)]||1;
    const th=150,sc=th/refH;
    const CW=Math.round(Math.max(...all.map(s=>s.w*sc))+16), CH=Math.round(Math.max(...all.map(s=>s.h*sc))+12), cols=Math.max(idle.length,atk.length);
    const o=document.createElement('canvas');o.width=CW*cols;o.height=CH*2;const oc=o.getContext('2d');oc.imageSmoothingEnabled=true;
    const row=(fr,r)=>fr.forEach((s,ci)=>{const dw=s.w*sc,dh=s.h*sc,dx=ci*CW+(CW-dw)/2,dy=r*CH+(CH-dh)-4;oc.save();oc.beginPath();oc.rect(ci*CW,r*CH,CW,CH);oc.clip();oc.drawImage(s.canvas,0,0,s.w,s.h,dx,dy,dw,dh);oc.restore();});
    row(idle,0);row(atk,1);
    out[names[bi]]={url:o.toDataURL('image/png'),idle:idle.length,attack:atk.length,cols,cw:CW,ch:CH};
  }
  return out;
});

fs.mkdirSync(path.join(dir,'assets','_hero'),{recursive:true});
for(const [h,r] of Object.entries(results)){
  fs.writeFileSync(path.join(dir,'assets','_hero',h+'.png'),Buffer.from(r.url.split(',')[1],'base64'));
  console.log(h.padEnd(9),'idle='+r.idle,'attack='+r.attack,'cols='+r.cols,'cell='+r.cw+'x'+r.ch);
}
await browser.close();server.close();
console.log('done');
