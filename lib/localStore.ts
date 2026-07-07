'use client';
import {useEffect,useState} from 'react';
import type {Room} from './localGame';
const KEY='dm-v06-room', CH='dm-v06';
export function loadRoom():Room|null{if(typeof window==='undefined')return null;const raw=localStorage.getItem(KEY);return raw?JSON.parse(raw):null}
export function saveRoom(r:Room){localStorage.setItem(KEY,JSON.stringify(r));try{new BroadcastChannel(CH).postMessage('update')}catch{}}
export function clearRoom(){localStorage.removeItem(KEY);try{new BroadcastChannel(CH).postMessage('update')}catch{}}
export function useRoom(){const[room,setRoom]=useState<Room|null>(null);useEffect(()=>{setRoom(loadRoom());let bc:BroadcastChannel|null=null;try{bc=new BroadcastChannel(CH);bc.onmessage=()=>setRoom(loadRoom())}catch{}const id=setInterval(()=>setRoom(loadRoom()),500);return()=>{clearInterval(id);bc?.close()}},[]);return room}
