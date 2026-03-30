import React, { useEffect, useRef, useState } from "react";

// キーボードショートカット一覧
const SHORTCUTS = [
  { keys: ["←", "→"], label: "Navigate pages" },
  { keys: ["↑", "↓"], label: "Move between options" },
  { keys: ["Space"], label: "Select option" },
  { keys: ["Enter"], label: "Check answer" },
  { keys: ["C"], label: "Copy question text (last interacted)" },
];

// ショートカット情報ボタンコンポーネント
export const ShortcutInfo: React.FC = () => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 外側クリックで閉じる
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* 情報ボタン */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="Keyboard Shortcuts"
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          background: open ? "rgba(99,102,241,0.3)" : "rgba(99,102,241,0.1)",
          border: `1px solid ${open ? "rgba(99,102,241,0.7)" : "rgba(99,102,241,0.3)"}`,
          color: open ? "#c4b5fd" : "#a5b4fc",
          fontSize: "14px",
          fontWeight: 700,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s",
          flexShrink: 0,
        }}
      >
        i
      </button>

      {/* ショートカットポップアップパネル */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            background: "rgba(20, 22, 35, 0.98)",
            border: "1px solid #3e4260",
            borderRadius: "14px",
            padding: "18px 20px",
            width: "280px",
            boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
            animation: "infoFadeIn 0.18s ease",
            zIndex: 500,
          }}
        >
          <p
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#a5b4fc",
              marginBottom: "14px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Keyboard Shortcuts
          </p>
          {SHORTCUTS.map(({ keys, label }) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "10px",
              }}
            >
              <span style={{ fontSize: "13px", color: "#94a3b8" }}>
                {label}
              </span>
              <div style={{ display: "flex", gap: "4px" }}>
                {keys.map((k) => (
                  <kbd
                    key={k}
                    style={{
                      background: "#1e2130",
                      border: "1px solid #3e4260",
                      borderRadius: "5px",
                      padding: "2px 7px",
                      fontFamily: "monospace",
                      fontSize: "11px",
                      color: "#c4b5fd",
                      fontWeight: 600,
                    }}
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* アニメーション定義 */}
      <style>{`
        @keyframes infoFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
