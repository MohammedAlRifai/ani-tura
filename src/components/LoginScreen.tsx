import React, { useState } from 'react';
import { initialUsers } from '../data/initialData';

export function LoginScreen({ onLogin }: { onLogin: () => Promise<void> }) {
  const [userId,setUserId]=useState(initialUsers[0].id);
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  return <main dir="rtl" className="workspace-login"><form onSubmit={async e=>{e.preventDefault();setError('');setBusy(true);try{const res=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId,password})});const data=await res.json();if(!res.ok)throw new Error(data.error);setPassword('');await onLogin();}catch(e:any){setError(e.message||'تعذر الاتصال');}finally{setBusy(false);}}}>
    <h1>عين المستشفى</h1><p>تسجيل الدخول إلى مساحة التشغيل المحلية</p>
    <label htmlFor="login-user">الحساب</label><select id="login-user" value={userId} onChange={e=>setUserId(e.target.value)}>{initialUsers.map(u=><option key={u.id} value={u.id}>{u.name} — {u.roleTitle}</option>)}</select>
    <label htmlFor="login-password">كلمة المرور</label><input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} />
    {error&&<p role="alert">{error}</p>}<button disabled={busy} type="submit">{busy?'جارٍ التحقق…':'دخول'}</button>
    <small>لكل حساب صلاحيات مستقلة. بيانات الدخول الأولية موجودة في ملف الوصول المحلي لدى مسؤول النسخة.</small>
  </form></main>;
}
