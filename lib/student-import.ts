import type {Student} from './health.ts';
export type Columns = Record<'name'|'grade'|'room'|'number',number>;
const aliases = {name:['성명','이름','학생명','학생성명'],grade:['학년'],room:['반','학급'],number:['번호','출석번호','학생번호']};
const clean=(v:unknown)=>String(v??'').trim();
export function detectHeader(rows:unknown[][]){
 for(let row=0;row<Math.min(rows.length,40);row++){
  const columns={} as Columns;
  for(const key of Object.keys(aliases) as (keyof Columns)[])columns[key]=rows[row].findIndex(v=>aliases[key].includes(clean(v).replace(/\s/g,'')));
  if(columns.name>=0&&columns.number>=0)return {row,columns};
 }
 return {row:0,columns:{name:-1,grade:-1,room:-1,number:-1} as Columns};
}
export function previewStudents(rows:unknown[][],header:number,columns:Columns,grade:string,room:string,existing:Student[]){
 const students:Student[]=[];const errors:string[]=[];let skipped=0;
 const seen=new Map(existing.map(s=>[`${s.grade}/${s.room}/${s.number}`,s]));
 if(columns.name<0||columns.number<0)return {students,errors:['이름과 번호 열을 선택해 주세요.'],skipped};
 const selected=Object.values(columns).filter(n=>n>=0);
 if(new Set(selected).size!==selected.length)return {students,errors:['각 항목에 서로 다른 열을 선택해 주세요.'],skipped};
 for(let i=header+1;i<rows.length;i++){
  const row=rows[i];if(row.every(v=>!clean(v)))continue;
  const name=clean(row[columns.name]);
  const integer=(v:unknown,suffix:string)=>{const text=clean(v).replace(new RegExp(suffix+'$'),'').trim();return /^\d+$/.test(text)?Number(text):NaN};
  const g=integer(columns.grade<0?grade:row[columns.grade],'학년');const r=integer(columns.room<0?room:row[columns.room],'반');const n=integer(row[columns.number],'번');
  if(!name||name.length>50||!Number.isInteger(g)||g<1||g>6||!Number.isInteger(r)||r<1||r>100||!Number.isInteger(n)||n<1||n>999){errors.push(`${i+1}행: 이름·학년(1–6)·반·번호를 확인해 주세요.`);continue;}
  const key=`${g}/${r}/${n}`;const prior=seen.get(key);
  if(prior){if(prior.name===name)skipped++;else errors.push(`${i+1}행: 같은 학년·반·번호에 다른 이름이 있습니다. 원본을 확인해 주세요.`);continue;}
  const student={id:crypto.randomUUID(),name,grade:g,room:r,number:n};students.push(student);seen.set(key,student);
 }
 if(!students.length&&!skipped&&!errors.length)errors.push('가져올 학생이 없습니다. 제목 행을 확인해 주세요.');
 return {students,errors,skipped};
}
