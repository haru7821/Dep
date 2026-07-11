import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import http from 'http';
const dir = path.dirname(fileURLToPath(import.meta.url));
const server = http.createServer((req,res)=>{
  const p = path.join(dir, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p,(e,b)=>{ if(e){res.writeHead(404);res.end();return;}
    const ext=path.extname(p);
    const ct = ext==='.js'?'application/javascript':ext==='.html'?'text/html':ext==='.png'?'image/png':'application/octet-stream';
    res.writeHead(200,{'Content-Type':ct}); res.end(b); });
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const PORT=server.address().port;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage();
await page.goto(`http://127.0.0.1:${PORT}/index.html`);
await page.evaluate(()=>{ ['garran','mira','faye','rai','boss'].forEach(id=>Sheets.load(id)); });
await page.waitForTimeout(700);

const out = await page.evaluate(async () => {
  // returns opaque-pixel bounding box height for a draw
  function bboxH(id, anim){
    const c=document.createElement('canvas'); c.width=400; c.height=320;
    const x=c.getContext('2d');
    const drew = Sheets.draw(x, id, 200, 300, 120, anim, 0); // targetH=120
    if(!drew) return null;
    const d=x.getImageData(0,0,c.width,c.height).data;
    let y0=c.height, y1=0, x0=c.width, x1=0;
    for(let y=0;y<c.height;y++)for(let xx=0;xx<c.width;xx++){ if(d[(y*c.width+xx)*4+3]>30){ if(y<y0)y0=y; if(y>y1)y1=y; if(xx<x0)x0=xx; if(xx>x1)x1=xx; } }
    return { h:y1-y0+1, w:x1-x0+1, top:y0, bottom:y1 };
  }
  const r={};
  for(const id of ['garran','mira','faye','rai','boss']){
    r[id]={};
    for(const a of ['idle','walk','attack','cast']) r[id][a]=bboxH(id,a);
  }
  return r;
});
console.log(JSON.stringify(out,null,1));
await browser.close(); server.close();
