export type Student = { id:string; name:string; grade:number; room:number; number:number };
export type Allocation = { batchId:string; quantity:number };
export type Visit = { id:string; studentId:string; at:string; createdAt:string; symptoms:string[]; place:string; temperature:number|null; treatments:string[]; usage:Record<string,number>; allocations:Allocation[]; status:'관찰 중'|'교실 복귀'|'귀가'|'기타'; exitAt:string; contacted:string; contactAt:string; guardian:string; note:string; cancelled?:boolean };
export type Item = { id:string; name:string; unit:string; minimum:number };
export type Batch = { id:string; itemId:string; lot:string; expires:string; quantity:number };
export type Movement = { id:string; at:string; batchId:string; quantity:number; reason:string; visitId?:string };
export type Task = {id:string; title:string; date:string; category:string; done:boolean; series?:string};
export type State = { students:Student[]; visits:Visit[]; items:Item[]; batches:Batch[]; movements:Movement[]; tasks:Task[] };
export const symptoms=['두통','복통','찰과상','타박상','어지러움','발열','기타'];
export const treatments=['안정','상처 처치','냉찜질','온찜질','관찰','보호자 연락','기타'];
export const day=(d:Date|string=new Date())=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(d));
export const time=(s:string)=>s?new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(s)): '—';
export const localInput=(s:string=new Date().toISOString())=>day(s)+'T'+new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(s));
export const toISO=(s:string)=>s?new Date(s+'+09:00').toISOString():'';
export const shiftDay=(s:string,n:number)=>day(new Date(new Date(s+'T12:00:00+09:00').getTime()+n*86400000));
export const studentLabel=(s:Student)=>`${s.name} · ${s.grade}학년 ${s.room}반 ${s.number}번`;
export function blankVisit():Visit{return {id:crypto.randomUUID(),studentId:'',at:new Date().toISOString(),createdAt:new Date().toISOString(),symptoms:[],place:'미확인',temperature:null,treatments:[],usage:{},allocations:[],status:'관찰 중',exitAt:'',contacted:'미연락',contactAt:'',guardian:'',note:''}}
export const activeVisits=(s:State)=>s.visits.filter(v=>!v.cancelled);
export function seed(now=new Date()):State {
 const today=day(now);const students:Student[]=['김하늘','이서준','박지우','최서연','정도윤','강민서','윤지호','김하늘','한예린','오수빈','조유준','임다은'].map((name,i)=>({id:'s'+i,name,grade:i%6+1,room:i%3+1,number:i+1}));
 const items=[{id:'band',name:'일회용 밴드',unit:'매',minimum:20},{id:'gauze',name:'멸균 거즈',unit:'매',minimum:15},{id:'ice',name:'냉찜질 팩',unit:'개',minimum:5},{id:'swab',name:'소독용 솜',unit:'매',minimum:30}];
 const batches:Batch[]=[{id:'b1',itemId:'band',lot:'B-2026-01',expires:shiftDay(today,180),quantity:86},{id:'b2',itemId:'gauze',lot:'G-2026-01',expires:shiftDay(today,25),quantity:12},{id:'b3',itemId:'ice',lot:'I-2026-01',expires:'',quantity:8},{id:'b4',itemId:'swab',lot:'S-2026-01',expires:shiftDay(today,90),quantity:120}];
 const visits:Visit[]=Array.from({length:36},(_,i)=>{const at=i<12?new Date(now.getTime()-(i+1)*7*60000).toISOString():new Date(new Date(shiftDay(today,-(i%21+1))+'T10:20:00+09:00')).toISOString();const status=i<2?'관찰 중':i===2?'귀가':'교실 복귀';return {id:'v'+i,studentId:'s'+(i<12?i:i%4),at,createdAt:at,symptoms:[symptoms[i%5]],place:i%2?'교실':'운동장',temperature:null,treatments:[i%2?'안정':'상처 처치'],usage:{},allocations:[],status,exitAt:status==='관찰 중'?'':new Date(new Date(at).getTime()+5*60000).toISOString(),contacted:status==='귀가'?'연락 완료':'미연락',contactAt:status==='귀가'?at:'',guardian:status==='귀가'?'보호자':'',note:''}});
 const tasks:Task[]=[{id:'t1',title:'건강검사 안내문 검토',date:today,category:'건강검사',done:false},{id:'t2',title:'2학기 감염병 예방교육 준비',date:today,category:'교육',done:false},{id:'t3',title:'보건실 소모품 점검',date:today,category:'기타',done:true},{id:'t4',title:'월간 보건실 운영 보고 제출',date:shiftDay(today,3),category:'제출',done:false},{id:'t5',title:'신체발달상황 검사 일정 확인',date:shiftDay(today,-1),category:'건강검사',done:false}];
 return {students,items,batches,visits,tasks,movements:batches.map(b=>({id:'m'+b.id,at:now.toISOString(),batchId:b.id,quantity:b.quantity,reason:'데모 초기 입고'}))};
}
export function saveVisit(state:State,input:Visit,now=new Date()):State {
 const v=structuredClone(input); const old=state.visits.find(x=>x.id===v.id);
 if(old?.cancelled)throw Error('취소된 방문은 수정할 수 없습니다.');
 if(!state.students.some(s=>s.id===v.studentId))throw Error('학생을 선택해 주세요.');
 if(!v.symptoms.length)throw Error('증상을 하나 이상 선택해 주세요.');
 if(!Number.isFinite(Date.parse(v.at))||Date.parse(v.at)>now.getTime()+60000)throw Error('방문 시각을 확인해 주세요. 미래 시각은 저장할 수 없습니다.');
 if(v.temperature!==null&&(!Number.isFinite(v.temperature)||v.temperature<0||v.temperature>50))throw Error('체온 입력값을 확인해 주세요 (0–50°C).');
 if(v.status!=='관찰 중'&&(!v.exitAt||!Number.isFinite(Date.parse(v.exitAt))||Date.parse(v.exitAt)<Date.parse(v.at)||Date.parse(v.exitAt)>now.getTime()+60000))throw Error('퇴실 시각은 방문 이후, 현재 시각 이전이어야 합니다.');
 if(v.status==='귀가'&&(!v.guardian.trim()||!v.contactAt||!Number.isFinite(Date.parse(v.contactAt))||v.contacted==='미연락'))throw Error('귀가 처리에는 연락 시각과 인계 대상을 입력해 주세요.');
 if(v.status==='귀가'&&(Date.parse(v.contactAt)<Date.parse(v.at)||Date.parse(v.contactAt)>Date.parse(v.exitAt)))throw Error('연락 시각은 방문과 퇴실 시각 사이여야 합니다.');
 if(v.status==='관찰 중'&&activeVisits(state).some(x=>x.id!==v.id&&x.studentId===v.studentId&&x.status==='관찰 중'))throw Error('이미 보건실에 있는 학생입니다. 기존 방문을 수정해 주세요.');
 const batches=state.batches.map(b=>({...b}));const before=new Map(batches.map(b=>[b.id,b.quantity]));
 for(const a of old?.allocations??[]){const b=batches.find(b=>b.id===a.batchId);if(b)b.quantity+=a.quantity;}
 const allocations:Allocation[]=[];
 for(const [itemId,quantity]of Object.entries(v.usage)){
  if(!Number.isInteger(quantity)||quantity<0)throw Error('사용 수량은 0 이상의 정수로 입력해 주세요.');
  if(!state.items.some(i=>i.id===itemId))throw Error('등록되지 않은 품목입니다.');
  let remaining=quantity;
  const candidates=batches.filter(b=>b.itemId===itemId).sort((a,b)=>(a.expires||'9999').localeCompare(b.expires||'9999'));
  // Existing use can remain allocated to an expired lot; new use cannot.
  for(const b of candidates){const retained=(old?.allocations??[]).find(a=>a.batchId===b.id)?.quantity??0;const allowed=b.expires&&b.expires<day(now)?Math.min(b.quantity,retained):b.quantity;const used=Math.min(remaining,allowed);if(used){b.quantity-=used;allocations.push({batchId:b.id,quantity:used});remaining-=used;}}
  if(remaining>0)throw Error(`${state.items.find(i=>i.id===itemId)?.name} 재고가 부족합니다. 사용 수량 또는 입고 내역을 확인해 주세요.`);
 }
 const movements=state.movements.concat(batches.filter(b=>b.quantity!==before.get(b.id)).map(b=>({id:crypto.randomUUID(),at:now.toISOString(),batchId:b.id,quantity:b.quantity-before.get(b.id)!,reason:old?'방문 사용량 수정':'방문 사용',visitId:v.id})));
 v.allocations=allocations;v.createdAt=old?.createdAt??now.toISOString();if(v.status==='관찰 중')v.exitAt='';
 return {...state,batches,movements,visits:old?state.visits.map(x=>x.id===v.id?v:x):[v,...state.visits]};
}
export function cancelVisit(s:State,id:string):State{const old=s.visits.find(v=>v.id===id);if(!old||old.cancelled)return s;const batches=s.batches.map(b=>({...b,quantity:b.quantity+(old.allocations.find(a=>a.batchId===b.id)?.quantity??0)}));return {...s,batches,visits:s.visits.map(v=>v.id===id?{...v,cancelled:true}:v),movements:[...s.movements,...old.allocations.map(a=>({id:crypto.randomUUID(),at:new Date().toISOString(),batchId:a.batchId,quantity:a.quantity,reason:'방문 취소 반환',visitId:id}))]}}
export function adjustStock(s:State,batchId:string,delta:number,reason:string):State{const b=s.batches.find(b=>b.id===batchId);if(!b||!Number.isInteger(delta)||delta===0||!reason.trim())throw Error('입출고 수량과 사유를 확인해 주세요.');if(b.quantity+delta<0)throw Error('재고보다 많은 수량을 출고할 수 없습니다.');return {...s,batches:s.batches.map(x=>x.id===batchId?{...x,quantity:x.quantity+delta}:x),movements:[...s.movements,{id:crypto.randomUUID(),at:new Date().toISOString(),batchId,quantity:delta,reason}]}}
export function selectVisits(s:State,start:string,end:string,grade='전체'){return activeVisits(s).filter(v=>day(v.at)>=start&&day(v.at)<=end&&(grade==='전체'||s.students.find(x=>x.id===v.studentId)?.grade===Number(grade)));}
export function aggregate(s:State,visits:Visit[]){const count=(key:'symptoms'|'treatments')=>Object.fromEntries([...new Set(visits.flatMap(v=>v[key]))].map(k=>[k,visits.filter(v=>v[key].includes(k)).length]));return {visits:visits.length,students:new Set(visits.map(v=>v.studentId)).size,home:new Set(visits.filter(v=>v.status==='귀가').map(v=>v.studentId)).size,symptoms:count('symptoms'),treatments:count('treatments'),grades:Object.fromEntries([1,2,3,4,5,6].map(g=>[g,visits.filter(v=>s.students.find(x=>x.id===v.studentId)?.grade===g).length]))};}
export function patterns(s:State,days:number,threshold:number,same:boolean,now=new Date()){const rows=selectVisits(s,shiftDay(day(now),-(days-1)),day(now));return s.students.flatMap(student=>{const own=rows.filter(v=>v.studentId===student.id);const groups=same?[...new Set(own.flatMap(v=>v.symptoms))].map(symptom=>({symptom,visits:own.filter(v=>v.symptoms.includes(symptom))})):[{symptom:'전체 증상',visits:own}];return groups.filter(g=>g.visits.length>=threshold).map(g=>({student,...g}));});}
// Only these safe, suppressed aggregate fields may cross the future AI boundary.
export const AI_ALLOWLIST=['period','target','visitCount','studentCount','homeCount'] as const;
export function safeSummary(s:State,rows:Visit[],start:string,end:string,grade:string,minimum:number){const a=aggregate(s,rows);const allowed=a.students>=Math.max(3,minimum);return {period:`${start} ~ ${end}`,target:grade==='전체'?'전 학년':`${grade}학년`,visitCount:allowed?a.visits:null,studentCount:allowed?a.students:null,homeCount:allowed&&a.home>=Math.max(3,minimum)?a.home:null};}
export interface CalendarConnector{connected:boolean;listEvents(start:string,end:string):Promise<Task[]>;pushEvent(task:Task):Promise<void>}
export const googleCalendar:CalendarConnector={connected:false,async listEvents(){throw Error('Google Calendar 미연결');},async pushEvent(){throw Error('Google Calendar 미연결');}};
