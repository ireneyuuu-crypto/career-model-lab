/* Career Model Lab: deterministic GR/C aspect engine.
 * No success scores, event-type probabilities or speculative E/P/V/J/R labels.
 */
export const PLANETS=['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];
export const CN={sun:'太阳',moon:'月亮',mercury:'水星',venus:'金星',mars:'火星',jupiter:'木星',saturn:'土星',uranus:'天王星',neptune:'海王星',pluto:'冥王星'};
export const SIGN=['白羊','金牛','双子','巨蟹','狮子','处女','天秤','天蝎','射手','摩羯','水瓶','双鱼'];
export const RULERS=['mars','venus','mercury','moon','sun','mercury','venus','mars','jupiter','saturn','saturn','jupiter']; // traditional rulers, fixed for reproducibility
export const ASPECTS=[['conjunction',0,'合相'],['square',90,'刑相'],['opposition',180,'冲相']];
export const RULES={GR:{movers:['jupiter','saturn','uranus','neptune','pluto'],orb:3},C:{movers:['sun','moon','mercury','venus','mars'],orb:2}};
export const DEMO=`【Western Export For AI】\n盘型：本命盘\n出生时间：1992-12-21 22:35:00\n时区：东8区 / UTC+08:00\n经纬度：31.2304, 121.4737\n黄道：回归黄道\n宫制：Placidus\nMC：天蝎座 17°15′\n第二宫宫头：水瓶座 9°20′\n（本数据仅用于演示，不代表真实个人星盘。MC 和宫头为虚构测试值。）`;
const norm=x=>((x%360)+360)%360;
export function delta(a,b){const d=Math.abs(norm(a)-norm(b));return Math.min(d,360-d)}
export function aspectOrb(a,b,angle){return Math.abs(delta(a,b)-angle)}
function jd(date){return date.getTime()/86400000+2440587.5}
function normalizeSign(t){return t.replace(/座/g,'').replace('牡羊','白羊').replace('室女','处女').replace('天秤','天秤').replace('魔羯','摩羯')}
export function zodiacToLongitude(str){
  if(!str)return null;
  const m=normalizeSign(str).match(/(白羊|金牛|双子|巨蟹|狮子|处女|天秤|天蝎|射手|摩羯|水瓶|双鱼)\s*(\d{1,2})(?:\s*[°度]\s*(\d{1,2}))?/);
  if(m)return SIGN.indexOf(m[1])*30+Number(m[2])+(Number(m[3]||0))/60;
  const n=str.match(/(?:^|[:：\s])([0-9]+(?:\.[0-9]+)?)\s*(?:°|度|$)/);
  if(n&&Number(n[1])<360)return Number(n[1]);
  return null;
}
export function parseChart(text){
  const errors=[], warnings=[], extracted={};
  const raw=text||'';
  const birthday=raw.match(/(?:出生(?:日期|时间)?|birth\s*(?:date|time)?|出生:)\s*[:：]?\s*(\d{4})[-/.年]\s*(\d{1,2})[-/.月]\s*(\d{1,2})[日\sT]*(\d{1,2})?:?(\d{2})?/i)
    ||raw.match(/(\d{4})[-/.年]\s*(\d{1,2})[-/.月]\s*(\d{1,2})[日\sT]+(\d{1,2}):(\d{2})/);
  if(birthday){if(!birthday[4]||!birthday[5])warnings.push('出生时间不完整，暂填 12:00，需手动核实。');extracted.date=`${birthday[1]}-${birthday[2].padStart(2,'0')}-${birthday[3].padStart(2,'0')}`;extracted.time=`${(birthday[4]||'12').padStart(2,'0')}:${(birthday[5]||'00').padStart(2,'0')}`;}
  const timeZone=raw.match(/UTC\s*([+-]\d{1,2})(?::?(\d{2}))?/i)||raw.match(/(?:时区|timezone)[^\n]{0,28}?东\s*(\d{1,2})\s*区/);
  if(timeZone){const hour=Number(timeZone[1]);extracted.tz=(hour>=0?'+':'-')+String(Math.abs(hour)).padStart(2,'0')+':'+(timeZone[2]||'00');}
  const coord=raw.match(/(?:经纬度|lat\s*\/\s*lng|latitude\s*\/\s*longitude|lat\s*,\s*lon)\s*[:：]?\s*([+-]?\d+(?:\.\d+)?)\s*[,，/\s]+\s*([+-]?\d+(?:\.\d+)?)/i);
  if(coord){extracted.lat=Number(coord[1]);extracted.long=Number(coord[2]);}
  const longOnly=raw.match(/(?:东经|longitude|经度)\s*[:：]?\s*([+-]?\d+(?:\.\d+)?)/i);
  if(!Number.isFinite(extracted.long)&&longOnly)extracted.long=Number(longOnly[1]);
  const lines=raw.split(/\r?\n/), natal={};
  let inOtherChart=false;
  for(const line of lines){
    if(/(?:===|【)[^\n]*(?:行运盘|次限盘|太阳弧盘|返照盘)/.test(line))inOtherChart=true;
    if(/(?:===|【)[^\n]*(?:本命盘|出生盘)/.test(line))inOtherChart=false;
    if(inOtherChart)continue;
    const mc=line.match(/(?:^|\s)(?:MC|天顶|中天)\s*[:：=]?\s*(.+)$/i);
    if(mc&&extracted.mc===undefined){const n=zodiacToLongitude(mc[1]);if(n!==null)extracted.mc=n;}
    const cusp2=line.match(/(?:第二宫宫头|二宫头|第\s*2\s*宫宫头|2nd\s*house\s*cusp)\s*[:：=]?\s*(.+)$/i);
    if(cusp2&&extracted.cusp2===undefined){const n=zodiacToLongitude(cusp2[1]);if(n!==null)extracted.cusp2=n;}
    for(const [en,zh] of Object.entries(CN)){
      const alias=en==='uranus'?'天王星':en==='neptune'?'海王星':en==='pluto'?'冥王星':zh;
      const re=new RegExp('(?:^|\\s)(?:'+alias+'|'+en+')\\s*[:：=\\s]+(.+)$','i');
      const match=line.match(re);
      if(match&&natal[en]===undefined){const n=zodiacToLongitude(match[1]);if(n!==null)natal[en]=n;}
    }
  }
  extracted.natal=natal;
  if(!extracted.date)errors.push('未识别到出生日期，请在下一步手动填写。');
  if(!extracted.time)warnings.push('未识别出生时间，默认输入中显示12:00，请核实。');
  if(!extracted.tz)warnings.push('未识别时区，请核实当地时间对应 UTC 偏移。');
  if(!Number.isFinite(extracted.long)&&extracted.mc===undefined)warnings.push('未识别天顶 MC 或出生地经度；至少需要其中一种。');
  if(extracted.cusp2===undefined)warnings.push('没有第二宫宫头：仍可计算主要职业信号，但会缺少部分财务相关目标点。');
  extracted.zodiac=/恒星黄道|sidereal|lahiri|拉希里/i.test(raw)?'lahiri':'tropical';
  return {extracted,errors,warnings};
}
export function parseOffset(offset){const m=String(offset).trim().match(/^([+-])(\d{1,2}):?(\d{2})$/);if(!m)return null;const v=(+m[2])*60+(+m[3]);return v<=14*60?(m[1]==='-'?-v:v):null}
export function utcFromLocal(dateStr,timeStr,tz){const mins=parseOffset(tz);if(mins===null)return null;const [y,m,d]=dateStr.split('-').map(Number);const [h,mi]=timeStr.split(':').map(Number);const t=new Date(Date.UTC(y,m-1,d,h,mi)-mins*60000);if(t.getUTCFullYear()===y||Math.abs(t.getUTCFullYear()-y)<=1)return t;return null;}
export function calculateMC(date,longitude){
  // Greenwich apparent sidereal time approximated with the mean sidereal expression;
  // ecliptic longitude at intersection with local meridian (tropical MC).
  const J=jd(date),T=(J-2451545)/36525;
  const theta=norm(280.46061837+360.98564736629*(J-2451545)+0.000387933*T*T-T*T*T/38710000+longitude);
  const eps=(23.439291-0.0130042*T)*Math.PI/180;
  const a=theta*Math.PI/180;
  return norm(Math.atan2(Math.sin(a)/Math.cos(eps),Math.cos(a))*180/Math.PI);
}
export function validateSettings({date,time,tz,long,mc,cusp2,startYear}){
 const errs=[];const parsed=utcFromLocal(date,time,tz);
 if(!parsed||!Number.isFinite(parsed.getTime()))errs.push('出生日期、时间或时区无效。');
 if(!Number.isInteger(+startYear)||+startYear<1900||+startYear>2060)errs.push('起始年份仅支持1900–2060。');
 if(parsed&&(parsed.getUTCFullYear()<1900||parsed.getUTCFullYear()>2050))errs.push('目前的出生日期支持1900–2050年。');
 if(mc!==''){if(!Number.isFinite(+mc)||+mc<0||+mc>=360)errs.push('MC 必须在0–360度之间。');}
 else if(long===''||!Number.isFinite(+long)||+long< -180||+long>180)errs.push('请提供有效出生经度，或填写 MC 度数。');
 if(cusp2!==''&&(!Number.isFinite(+cusp2)||+cusp2<0||+cusp2>=360))errs.push('第二宫宫头必须在0–360度之间。');
 return {errors:errs,utc:parsed};
}
const cache=new Map();
// Resolve relative to this module (not the browser's current page) and accept
// either the intended data/ directory or JSON files uploaded to repo root.
const baseURL=new URL('./',import.meta.url);
async function fetchYear(year){
 const paths=[`./${year}.json`,`./data/${year}.json`];
 const details=[];
 for(const path of paths){
  const url=new URL(path,baseURL);
  try{
   const response=await fetch(url.toString(),{cache:'no-store'});
   if(!response.ok){details.push(`${url.pathname} → HTTP ${response.status}`);continue;}
   const data=await response.json();
   if(!Array.isArray(data)||!Array.isArray(data[0]))throw new Error('JSON 结构不符合星历格式');
   return data;
  }catch(e){details.push(`${url.pathname} → ${e.message}`);}
 }
 throw new Error(`无法读取 ${year} 年星历。检查以下文件：${details.join('；')}。请确认 GitHub Pages 已完成最新部署。`);
}
export async function loadYear(year){
 if(year<1900||year>2070)throw new Error(`星历数据不支持 ${year} 年。`);
 if(!cache.has(year))cache.set(year,fetchYear(year).catch(e=>{cache.delete(year);throw e}));
 return cache.get(year);
}
function interpolate(a,b,f){let diff=(b-a+540)%360-180;return norm(a+f*diff)}
export async function ephemerisAt(date){const y=date.getUTCFullYear(),start=Date.UTC(y,0,1),day=(date.getTime()-start)/86400000,ix=Math.floor(day),f=day-ix;const current=await loadYear(y),next=ix+1<current.length?current[ix+1]:(await loadYear(y+1))[0];const a=current[ix];if(!a||!next)throw new Error('星历日期不在支持范围内。');return {...Object.fromEntries(PLANETS.map((p,i)=>[p,interpolate(a[i],next[i],f)])),ayanamsa:interpolate(a[10],next[10],f)};}
function targetList(natal,mc,cusp2){const p=[{id:'mc',name:'天顶（MC）',longitude:mc,priority:1},{id:'ruler10',name:'第十宫宫主星',longitude:natal[RULERS[Math.floor(mc/30)]],priority:1},{id:'sun',name:'本命太阳',longitude:natal.sun,priority:2},{id:'saturn',name:'本命土星',longitude:natal.saturn,priority:2}];if(cusp2!==null){p.push({id:'cusp2',name:'第二宫宫头',longitude:cusp2,priority:3});p.push({id:'ruler2',name:'第二宫宫主星',longitude:natal[RULERS[Math.floor(cusp2/30)]],priority:3});}return p.filter(t=>Number.isFinite(t.longitude));}
const dateKey=d=>d.toISOString().slice(0,10);
export async function forecast({birthUTC,startYear,mc,cusp2=null,natalOverrides={},zodiac="tropical"}){
 const begin=new Date(Date.UTC(startYear,0,1)),end=new Date(Date.UTC(startYear+10,0,1));
 const adjusted=raw=>Object.fromEntries(PLANETS.map(p=>[p,zodiac==="lahiri"?norm(raw[p]-raw.ayanamsa):raw[p]]));
 const natal={...adjusted(await ephemerisAt(birthUTC)),...natalOverrides};
 const targets=targetList(natal,mc,cusp2);const active=new Map(),events=[];
 let day=begin,processed=0;
 while(day<end){
  const transits=adjusted(await ephemerisAt(day)),ageDays=(day.getTime()-birthUTC.getTime())/86400000;
  const progDate=new Date(birthUTC.getTime()+ageDays/365.2422*86400000);
  const progressions=adjusted(await ephemerisAt(progDate));
  const alive=new Set();
  for(const [type,positions] of [['GR',transits],['C',progressions]]){
   const rule=RULES[type];
   for(const mover of rule.movers){
    for(const t of targets){if(type==='C'&&t.id==='cusp2')continue;
     for(const [aspect,angle,label] of ASPECTS){
      const orb=aspectOrb(positions[mover],t.longitude,angle);
      if(orb>rule.orb)continue;
      const key=`${type}:${mover}:${t.id}:${aspect}`;alive.add(key);
      if(!active.has(key))active.set(key,{id:key,type,mover,target:t.name,priority:t.priority,aspect,label,begin:dateKey(day),end:dateKey(day),best:dateKey(day),minOrb:orb});
      else{const e=active.get(key);e.end=dateKey(day);if(orb<e.minOrb){e.minOrb=orb;e.best=dateKey(day);}}
     }
    }
   }
  }
  for(const [key,e] of active){if(!alive.has(key)){events.push(e);active.delete(key);}}
  day=new Date(day.getTime()+86400000);processed++;
 }
 events.push(...active.values());events.sort((a,b)=>a.best.localeCompare(b.best)||a.priority-b.priority);
 const years=Array.from({length:10},(_,i)=>{const y=startYear+i;const subset=events.filter(e=>e.begin<=`${y}-12-31`&&e.end>=`${y}-01-01`);return {year:y,GR:subset.filter(e=>e.type==='GR').length,C:subset.filter(e=>e.type==='C').length,p1:subset.filter(e=>e.type==='GR'&&e.priority===1).length,events:subset};});
 return {birthUTC:birthUTC.toISOString(),mc,cusp2,natal,targets,years,events,settings:{zodiac,position:'geocentric',ephemeris:'Swiss Ephemeris Moshier, daily 00 UTC, linear circular interpolation',grOrb:3,cOrb:2,model:'Career V2.0 signal rules; no event-outcome prediction',daysProcessed:processed}};
}
export function dateHuman(s){return s.replace(/-/g,'/');}
