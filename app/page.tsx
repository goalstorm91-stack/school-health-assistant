"use client";
import {useEffect,useState} from 'react';
import HealthApp from './health-app';
export default function Home(){const [ready,setReady]=useState(false);useEffect(()=>setReady(true),[]);return ready?<HealthApp/>:<main style={{padding:48}} role="status">보건실 업무 공간을 불러오고 있습니다…</main>}
