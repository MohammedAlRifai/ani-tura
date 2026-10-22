import React from "react";
import { SearchX } from "lucide-react";

export function SearchEmptyState({ onReset }: { onReset: () => void }) {
  return <div className="workspace-empty" role="status">
    <span className="workspace-empty-icon"><SearchX size={28} /></span>
    <h3>لا توجد نتائج مطابقة</h3>
    <p>جرّب اسمًا أقصر أو أزل الفلاتر لعرض جميع الأصناف.</p>
    <button onClick={onReset}>عرض جميع الأصناف</button>
  </div>;
}
