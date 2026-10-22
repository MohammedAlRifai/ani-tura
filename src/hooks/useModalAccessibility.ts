import { useEffect } from 'react';

/** Standard keyboard behaviour for the legacy overlay components. Native dialogs keep browser behaviour. */
export function useModalAccessibility() {
  useEffect(()=>{
    let active:HTMLElement|null=null;let previous:HTMLElement|null=null;
    const visible=(element:HTMLElement)=>Boolean(element.getClientRects().length)&&getComputedStyle(element).visibility!=='hidden';
    const focusables=(element:HTMLElement)=>Array.from(element.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')).filter(visible);
    const sync=()=>{
      const overlays=Array.from(document.querySelectorAll<HTMLElement>('.fixed.inset-0')).filter(visible);
      const next=overlays.at(-1)||null;
      if(next!==active){if(active&&!next){document.body.style.overflow='';previous?.focus();previous=null;}if(next){previous=document.activeElement as HTMLElement;next.setAttribute('role','dialog');next.setAttribute('aria-modal','true');if(!next.hasAttribute('aria-label')&&!next.hasAttribute('aria-labelledby')){next.setAttribute('aria-label',next.querySelector('h2,h3')?.textContent||'نافذة النظام');}next.tabIndex=-1;(focusables(next)[0]||next).focus();document.body.style.overflow='hidden';}active=next;}
      document.querySelectorAll<HTMLElement>('input,select,textarea').forEach(control=>{if(!control.getAttribute('aria-label')&&!control.getAttribute('aria-labelledby')&&!control.id){const label=control.parentElement?.querySelector('label');if(label?.textContent)control.setAttribute('aria-label',label.textContent.trim());}});
    };
    const key=(event:KeyboardEvent)=>{if(!active)return;if(event.key==='Tab'){const list=focusables(active);const first=list[0],last=list.at(-1);if(!first){event.preventDefault();active.focus();}else if(event.shiftKey&&(document.activeElement===first||document.activeElement===active)){event.preventDefault();last?.focus();}else if(!event.shiftKey&&(document.activeElement===last||!active.contains(document.activeElement))){event.preventDefault();first.focus();}}if(event.key==='Escape'){const close=focusables(active).find(el=>/إغلاق|إلغاء/.test(el.getAttribute('aria-label')||el.getAttribute('title')||el.textContent||''));if(close){event.preventDefault();close.click();}}};
    const observer=new MutationObserver(sync);observer.observe(document.body,{childList:true,subtree:true});document.addEventListener('keydown',key);sync();
    return()=>{observer.disconnect();document.removeEventListener('keydown',key);document.body.style.overflow='';};
  },[]);
}
