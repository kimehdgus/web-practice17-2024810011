const byId = id => document.getElementById(id);
const fmt = n => Number(n).toLocaleString('ko-KR');
let rows=[];
const dateField=byId('date');
dateField.value='2026-10-31';
function render() {
  const line=byId('line').value.trim(), station=byId('station').value.trim();
  const filtered=rows.filter(r=>(!line||String(r.SBWY_ROUT_LN_NM).includes(line))&&(!station||String(r.SBWY_STNS_NM).includes(station)));
  byId('count').textContent=fmt(filtered.length);
  byId('ride').textContent=fmt(filtered.reduce((a,r)=>a+Number(r.GTON_TNOPE||0),0));
  byId('alight').textContent=fmt(filtered.reduce((a,r)=>a+Number(r.GTOFF_TNOPE||0),0));
  const body=byId('rows');body.replaceChildren();
  if (!filtered.length) {const tr=body.insertRow();const td=tr.insertCell();td.colSpan=4;td.textContent='조건에 맞는 역이 없습니다.';return;}
  for (const r of filtered) {const tr=body.insertRow();[r.SBWY_ROUT_LN_NM,r.SBWY_STNS_NM,fmt(r.GTON_TNOPE),fmt(r.GTOFF_TNOPE)].forEach(v=>{const td=tr.insertCell();td.textContent=v;});}
}
async function load(e) {
  e.preventDefault();
  const date=dateField.value.replaceAll('-','');
  const url=`/.netlify/functions/subway?date=${date}`;
  byId('jsonLink').href=url;
  byId('status').textContent=`${date} 데이터를 Netlify Function에서 요청 중...`;
  try {
    const response=await fetch(url,{cache:'no-store'});
    const data=await response.json();
    if (!response.ok) throw new Error(data.error||`HTTP ${response.status}`);
    rows=data.rows;
    if (!Array.isArray(rows)) throw new Error('행 목록이 배열이 아닙니다.');
    render();
    byId('status').textContent=`${date} 조회: ${rows.length}건 · ${data.keyMode==='sample'?'샘플 인증키(상위 5건)':'개인 인증키'} · 함수 응답`;
  } catch(err) {rows=[];render();byId('status').textContent=`조회 실패: ${err.message}`;}
}
byId('searchForm').addEventListener('submit',load);
byId('line').addEventListener('input',render);
byId('station').addEventListener('input',render);

