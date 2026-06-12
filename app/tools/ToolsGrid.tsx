"use client";

import { useState } from "react";
import Link from "next/link";

interface Tool {
  href: string;
  icon: string;
  name: string;
  desc: string;
  fee: string;
  category: string;
  comingSoon?: boolean;
}

interface Category {
  id: string;
  label: string;
}

export default function ToolsGrid({ tools, categories }: { tools: Tool[]; categories: Category[] }) {
  const [active, setActive] = useState("all");
  const visible = active === "all" ? tools : tools.filter((t) => t.category === active);

  return (
    <>
      <div className="tools-category-row" data-reveal="fade">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`tools-cat-chip${c.id === active ? " tools-cat-chip--active" : ""}`}
            onClick={() => setActive(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="tools-grid" data-stagger>
        {visible.map((t) => (
          <Link key={t.href} href={t.href} className="tool-card">
            <div className="tool-card-icon">{t.icon}</div>
            <div className="tool-card-body">
              <div className="tool-card-name">{t.name}</div>
              <div className="tool-card-desc">{t.desc}</div>
            </div>
            <div className="tool-card-footer">
              {t.comingSoon ? (
                <span className="coming-soon-badge">Coming soon</span>
              ) : (
                <span className={`tool-card-fee${t.fee === "Free" ? " tool-card-fee--free" : ""}`}>{t.fee}</span>
              )}
              <span className="tool-card-arrow">→</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
