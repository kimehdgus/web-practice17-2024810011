const json=(statusCode,data)=>({statusCode,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'},body:JSON.stringify(data)});
function validDate(value) {
  if (!/^\d{8}$/.test(value)) return false;
  const d=new Date(`${value.slice(0,4)}-${value.slice(4,6)}-${value.slice(6,8)}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0,10).replaceAll('-','')===value;
}
exports.handler=async(event)=>{
  const date=event.queryStringParameters?.date || '';
  if (!validDate(date)) return json(400,{student:'2024810011_김동현',error:'date 값은 유효한 YYYYMMDD 날짜여야 합니다.'});
  const key=process.env.SEOUL_API_KEY || 'sample';
  const limit=key==='sample'?5:1000;
  const url=`http://openapi.seoul.go.kr:8088/${encodeURIComponent(key)}/json/CardSubwayStatsNew/1/${limit}/${date}`;
  const ctrl=new AbortController(), timer=setTimeout(()=>ctrl.abort(),9000);
  try {
    const response=await fetch(url,{signal:ctrl.signal});
    if (!response.ok) return json(502,{student:'2024810011_김동현',error:`서울시 API HTTP ${response.status}`});
    const body=await response.json();
    const record=body.CardSubwayStatsNew;
    if (!record || !Array.isArray(record.row)) return json(502,{student:'2024810011_김동현',date,error:body.RESULT?.MESSAGE || record?.RESULT?.MESSAGE || '데이터 없음 또는 API 오류'});
    return json(200,{student:'2024810011_김동현',date,service:'CardSubwayStatsNew',keyMode:key==='sample'?'sample':'personal',total:record.list_total_count,rows:record.row});
  } catch(error) {
    return json(502,{student:'2024810011_김동현',date,error:error.name==='AbortError'?'서울시 API 응답 시간 초과':'서버에서 서울시 API를 호출하지 못했습니다.'});
  } finally { clearTimeout(timer); }
};
exports.validDate=validDate;
