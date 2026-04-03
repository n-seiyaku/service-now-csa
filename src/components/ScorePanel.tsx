import React from "react";
import type { ScorePanelProps } from "../types";

// スコアパネルコンポーネント
export const ScorePanel: React.FC<ScorePanelProps> = ({
  correctCount,
  wrongCount,
  total,
  checkedCount,
  wrongIndices,
  checkedSet,
  onExportWrong,
  onJumpToQuestion,
  onReview,
}) => {
  const accuracy =
    checkedCount > 0 ? Math.round((correctCount / checkedCount) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* スコアカード */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e2130 0%, #252840 100%)",
          border: "1px solid #2e3248",
          borderRadius: "16px",
          padding: "24px",
        }}
      >
        <h2
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "20px",
          }}
        >
          Score Board
        </h2>

        {/* 正解数 */}
        <div className="flex items-center justify-between mb-3">
          <span style={{ color: "#94a3b8", fontSize: "14px" }}>Correct</span>
          <span
            style={{
              color: "#22c55e",
              fontSize: "24px",
              fontWeight: 700,
              fontFamily: "monospace",
            }}
          >
            {correctCount}
          </span>
        </div>

        {/* 不正解数 */}
        <div className="flex items-center justify-between mb-3">
          <span style={{ color: "#94a3b8", fontSize: "14px" }}>Wrong</span>
          <span
            style={{
              color: "#ef4444",
              fontSize: "24px",
              fontWeight: 700,
              fontFamily: "monospace",
            }}
          >
            {wrongCount}
          </span>
        </div>

        {/* チェック済み / 全体 */}
        <div className="flex items-center justify-between mb-4">
          <span style={{ color: "#94a3b8", fontSize: "14px" }}>Answered</span>
          <span
            style={{
              color: "#e2e8f0",
              fontSize: "18px",
              fontWeight: 600,
              fontFamily: "monospace",
            }}
          >
            {checkedCount} / {total}
          </span>
        </div>

        {/* 精度バー */}
        <div>
          <div className="flex justify-between mb-1">
            <span style={{ color: "#94a3b8", fontSize: "12px" }}>Accuracy</span>
            <span
              style={{
                color:
                  accuracy >= 70
                    ? "#22c55e"
                    : accuracy >= 50
                      ? "#f59e0b"
                      : "#ef4444",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              {accuracy}%
            </span>
          </div>
          <div
            style={{
              background: "#1a1d27",
              borderRadius: "9999px",
              height: "8px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${accuracy}%`,
                height: "100%",
                background:
                  accuracy >= 70
                    ? "linear-gradient(90deg, #22c55e, #16a34a)"
                    : accuracy >= 50
                      ? "linear-gradient(90deg, #f59e0b, #d97706)"
                      : "linear-gradient(90deg, #ef4444, #dc2626)",
                borderRadius: "9999px",
                transition: "width 0.5s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* 全問題ステータス概要 */}
      <div
        style={{
          background: "#1e2130",
          border: "1px solid #2e3248",
          borderRadius: "16px",
          padding: "16px",
        }}
      >
        <h3
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "12px",
          }}
        >
          All Questions
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "4px",
          }}
        >
          {Array.from({ length: total }, (_, idx) => {
            // 各問題のステータスを判定
            const isChecked = checkedSet.has(idx);
            const isWrong = wrongIndices.includes(idx);
            const isCorrect = isChecked && !isWrong;
            const isPending = !isChecked;

            // カラーを決定
            let bg: string;
            let border: string;
            let color: string;
            if (isCorrect) {
              bg = "rgba(34,197,94,0.15)";
              border = "rgba(34,197,94,0.45)";
              color = "#22c55e";
            } else if (isWrong) {
              bg = "rgba(239,68,68,0.15)";
              border = "rgba(239,68,68,0.45)";
              color = "#ef4444";
            } else {
              bg = "rgba(255,255,255,0.04)";
              border = "rgba(255,255,255,0.1)";
              color = "#475569";
            }

            return (
              <button
                key={idx}
                onClick={() => onJumpToQuestion(idx)}
                title={`Q${idx + 1}: ${
                  isCorrect ? "Correct" : isWrong ? "Wrong" : "Not answered"
                }`}
                style={{
                  background: bg,
                  border: `1px solid ${border}`,
                  borderRadius: "6px",
                  padding: "3px 7px",
                  height: "40px",
                  color,
                  fontSize: "11px",
                  fontWeight: isPending ? 400 : 600,
                  cursor: "pointer",
                  transition: "background 0.15s, transform 0.1s",
                  lineHeight: 1.4,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform =
                    "scale(1.08)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                }}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
        {/* 凡例 */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "12px",
            paddingTop: "10px",
            borderTop: "1px solid #2e3248",
          }}
        >
          <span style={{ fontSize: "10px", color: "#22c55e", fontWeight: 600 }}>
            Correct: {correctCount}
          </span>
          <span style={{ fontSize: "10px", color: "#ef4444", fontWeight: 600 }}>
            Wrong: {wrongCount}
          </span>
          <span style={{ fontSize: "10px", color: "#475569", fontWeight: 600 }}>
            Left: {total - checkedCount}
          </span>
        </div>
      </div>

      {/* 復習ボタン */}
      {wrongIndices.length > 0 && (
        <button
          onClick={onReview}
          style={{
            background: "linear-gradient(135deg, #ef4444, #f97316)",
            border: "none",
            borderRadius: "12px",
            padding: "12px 16px",
            color: "#fff",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
            transition: "opacity 0.2s, transform 0.1s",
            width: "100%",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = "0.9";
            (e.currentTarget as HTMLElement).style.transform =
              "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = "1";
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
          }}
        >
          Review Wrong ({wrongIndices.length})
        </button>
      )}

      {/* エクスポートボタン */}
      {wrongIndices.length > 0 && (
        <button
          onClick={onExportWrong}
          style={{
            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
            border: "none",
            borderRadius: "12px",
            padding: "12px 16px",
            color: "#fff",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
            transition: "opacity 0.2s, transform 0.1s",
            width: "100%",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.opacity = "0.9";
            (e.target as HTMLElement).style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.opacity = "1";
            (e.target as HTMLElement).style.transform = "translateY(0)";
          }}
        >
          Export Wrong ({wrongIndices.length})
        </button>
      )}
    </div>
  );
};
