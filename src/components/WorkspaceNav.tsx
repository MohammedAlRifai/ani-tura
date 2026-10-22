import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Activity, FileText, Building2, Award, Boxes, Sparkles, Truck, DollarSign, ShoppingCart, Search, ArrowUpLeft, X } from "lucide-react";
import type { UserProfile } from "../types";

const sections = [
  { id: "dashboard", key: "dashboard", icon: Activity, group: 0 },
  { id: "reports", key: "reports", icon: FileText, group: 0 },
  { id: "assets", key: "assets", icon: Building2, group: 0 },
  { id: "ppm", key: "ppm", icon: Award, group: 0 },
  { id: "inventory", key: "inventory", icon: Boxes, group: 0 },
  { id: "logistics", key: "logistics", icon: Truck, group: 1 },
  { id: "finance", key: "finance", icon: DollarSign, group: 1 },
  { id: "marketplace", key: "marketplace", icon: ShoppingCart, group: 1 },
  { id: "manar", key: "manar", icon: Sparkles, group: 2 },
];

interface Props { activeTab: string; setActiveTab: (id: string) => void; currentUser: UserProfile; urgentCount: number }

export function WorkspaceNav({ activeTab, setActiveTab, currentUser, urgentCount }: Props) {
  const { t, i18n } = useTranslation();
  const ar = i18n.language.startsWith("ar");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const allowed = sections.filter(s => !["logistics", "manar"].includes(s.id) && (currentUser.role === "admin" || currentUser.allowedTabs.includes(s.id)));
  const label = (s: typeof sections[number]) => t(`nav.${s.key}`);
  const close = () => { setOpen(false); setQuery(""); trigger.current?.focus(); };
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen(v => !v); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);
  useEffect(() => { if (open) dialog.current?.showModal(); else dialog.current?.close(); }, [open]);
  const navigate = (id: string) => {
    setActiveTab(id); close();
    requestAnimationFrame(() => { document.getElementById("workspace-content")?.focus(); window.scrollTo({ top: 0, behavior: "instant" }); });
  };
  const results = allowed.filter(s => label(s).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  return <>
    <aside className="workspace-sidebar" aria-label={ar ? "قائمة الأقسام" : "Workspace navigation"}>
      <div className="workspace-brand"><span className="workspace-mark"><Activity size={25} /></span><div><strong>{t("app.title")}</strong><small>{ar ? "مساحة العمليات" : "Operations workspace"}</small></div></div>
      <button ref={trigger} className="workspace-search" onClick={() => setOpen(true)} aria-haspopup="dialog"><Search size={17} /><span>{ar ? "انتقل إلى قسم…" : "Go to section…"}</span><kbd>Ctrl K</kbd></button>
      <nav>
        {[0, 1, 2].map(group => <div className="workspace-nav-group" key={group}>
          {allowed.some(s => s.group === group) && <p>{(ar ? ["العمليات اليومية", "الإدارة والإمداد", "الأدوات والمساعدة"] : ["DAILY OPERATIONS", "MANAGEMENT", "TOOLS & SUPPORT"])[group]}</p>}
          {allowed.filter(s => s.group === group).map(s => <button key={s.id} data-module={s.id} onClick={() => navigate(s.id)} aria-current={activeTab === s.id ? "page" : undefined} className="workspace-nav-item"><s.icon size={19} /><span>{label(s)}</span>{s.id === "reports" && urgentCount > 0 && <b className="workspace-count">{urgentCount}</b>}{activeTab === s.id && <ArrowUpLeft size={15} className="workspace-nav-arrow" />}</button>)}
        </div>)}
      </nav>
      <div className="workspace-profile"><span>{currentUser.name.slice(0, 1)}</span><div><strong>{currentUser.name}</strong><small>{currentUser.roleTitle}</small></div></div>
    </aside>
    <dialog ref={dialog} className="workspace-command" onCancel={e => { e.preventDefault(); close(); }} onClick={e => { if (e.target === e.currentTarget) close(); }} aria-labelledby="workspace-search-title">
      <div className="workspace-command-heading"><h2 id="workspace-search-title">{ar ? "إلى أين تريد الانتقال؟" : "Where would you like to go?"}</h2><button onClick={close} aria-label={ar ? "إغلاق" : "Close"}><X size={20} /></button></div>
      <div className="workspace-command-input"><Search size={20} /><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder={ar ? "ابحث عن البلاغات، المخزون، المالية…" : "Search reports, inventory, finance…"} aria-label={ar ? "ابحث عن قسم" : "Search sections"} onKeyDown={e => { if (e.key === "Enter" && results[0]) navigate(results[0].id); }} /></div>
      <div className="workspace-command-results">{results.map(s => <button key={s.id} data-module={s.id} onClick={() => navigate(s.id)}><s.icon size={19} /><span>{label(s)}</span><ArrowUpLeft size={16} /></button>)}{results.length === 0 && <p role="status">{ar ? "لا توجد أقسام مطابقة. جرّب كلمة أخرى." : "No matching sections. Try another word."}</p>}</div>
      <small className="workspace-command-hint">{ar ? "Enter لفتح أول نتيجة · Esc للإغلاق" : "Enter to open first result · Esc to close"}</small>
    </dialog>
  </>;
}
