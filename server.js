const http = require('node:http');
const port=Number(process.env.PORT || 3000);
const key=process.env.SEOUL_API_KEY || 'sample';
const allowed=process.env.NETLIFY_ORIGIN || '';
const json=(res,status,data,origin='')=>{
  const cors = allowed ? (origin===allowed ? allowed : '') : (key==='sample' ? '*' : '');
  res.writeHead(status,{ 'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store', ...(cors ? {'Access-Control-Allow-Origin':cors,'Vary':'Origin'} : {}) });
  res.end(JSON.stringify(data));
};
const validDay=day=>{
  if(!/^\d{8}$/.test(day)) return false;
  const date=new Date(`${day.slice(0,4)}-${day.slice(4,6)}-${day.slice(6,8)}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0,10).replaceAll('-','')===day;
};
const server=http.createServer(async(req,res)=>{
  const origin=req.headers.origin || '';
  if (allowed && origin && origin!==allowed) return json(res,403,{error:'허용되지 않은 출처입니다.'},origin);
  if (req.method==='OPTIONS') {res.writeHead(204,{'Access-Control-Allow-Origin':allowed || '*','Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Content-Type'});return res.end();}
  const url=new URL(req.url,'http://localhost');
  if (url.pathname==='/health') return json(res,200,{status:'ok',student:'2024810011_김동현'},origin);
  if (url.pathname!=='/api/subway' || req.method!=='GET') return json(res,404,{error:'조회 경로를 확인하세요.'},origin);
  const day=url.searchParams.get('date') || '';
  if (!validDay(day)) return json(res,400,{error:'date 값은 YYYYMMDD 형식이어야 합니다.'},origin);
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),9000);
  try {
    const limit=key==='sample' ? 5 : 1000;
    const endpoint=`http://openapi.seoul.go.kr:8088/${encodeURIComponent(key)}/json/CardSubwayStatsNew/1/${limit}/${day}`;
    const result=await fetch(endpoint,{signal:controller.signal});
    if (!result.ok) return json(res,502,{error:`서울시 API가 HTTP ${result.status}를 반환했습니다.`},origin);
    const payload=await result.json();
    if (!payload.CardSubwayStatsNew?.row) return json(res,502,{error:payload.RESULT?.MESSAGE || payload.CardSubwayStatsNew?.RESULT?.MESSAGE || '해당 날짜에 데이터가 없습니다.'},origin);
    payload.keyMode=key==='sample'?'sample':'personal';
    return json(res,200,payload,origin);
  }catch(error){return json(res,502,{error:error.name==='AbortError'?'공공 API 응답 시간이 초과되었습니다.':'공공 API 연결 또는 JSON 해석에 실패했습니다.'},origin);}
  finally{clearTimeout(timeout);}
});
if(require.main===module) server.listen(port,()=>console.log(`Subway proxy listening on ${port}`));
module.exports={server,validDay};
