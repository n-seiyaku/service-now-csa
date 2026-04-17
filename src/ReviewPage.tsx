import React, { useState, useCallback } from "react";
import type { QuizQuestion } from "./types";
import { QuestionCard } from "./components/QuestionCard";
import { isCorrect } from "./utils";

interface ReviewPageProps {
  // すべての問題データー
  questions: QuizQuestion[];
  // 間違えた問題のインデックスリスト
  wrongIndices: number[];
  // メインページへ戻るコールバック
  onBack: () => void;
  // 初期化した正解済みインデックス
  initialMasteredIndices: number[];
  // 初期化した回答
  initialUserAnswers: Record<number, string[]>;
  // 正解したときに通知するコールバック
  onMastered: (globalIndex: number, answers: string[]) => void;
  // ページネーション用
  page: number;
  pageSize: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  // フィルター
  filter: "all" | "mastered" | "unmastered";
  setFilter: React.Dispatch<
    React.SetStateAction<"all" | "mastered" | "unmastered">
  >;
  // ショートカット・コピー用
  copiedIndex: number | null;
  onCopy: (idx: number) => void;
  onActivate: (idx: number) => void;
}

// 復習ページコンポーネント
export const ReviewPage: React.FC<ReviewPageProps> = ({
  questions,
  wrongIndices,
  initialMasteredIndices,
  initialUserAnswers,
  onBack,
  onMastered,
  page,
  pageSize,
  setPage,
  filter,
  setFilter,
  copiedIndex,
  onCopy,
  onActivate,
}) => {
  // 復習用回答状態（元のglobalIndex -> 選択ラベル）
  const [userAnswers, setUserAnswers] =
    useState<Record<number, string[]>>(initialUserAnswers);
  // チェック済みインデックスセット（globalIndex）
  const [checkedSet, setCheckedSet] = useState<Set<number>>(
    new Set(initialMasteredIndices),
  );
  // 復習で正解した数
  const [masteredCount, setMasteredCount] = useState(
    initialMasteredIndices.length,
  );
  // 正解済みインデックスセット（renderで使用するためrefではなくstate）
  const [masteredSet, setMasteredSet] = useState<Set<number>>(
    new Set(initialMasteredIndices),
  );

  const handleSelectionChange = useCallback(
    (globalIndex: number, labels: string[]) => {
      setUserAnswers((prev) => ({ ...prev, [globalIndex]: labels }));
    },
    [],
  );

  const handleCheck = useCallback(
    (globalIndex: number, correct: boolean) => {
      if (checkedSet.has(globalIndex)) return;
      setCheckedSet((prev) => {
        const next = new Set(prev);
        next.add(globalIndex);
        return next;
      });
      if (correct) {
        setMasteredCount((c) => c + 1);
        setMasteredSet((prev) => {
          const next = new Set(prev);
          next.add(globalIndex);
          return next;
        });
        onMastered(globalIndex, userAnswers[globalIndex] ?? []);
      }
    },
    [checkedSet, userAnswers, onMastered],
  );

  const handleResetStillWrong = useCallback(() => {
    setCheckedSet((prev) => {
      const next = new Set<number>();
      for (const id of prev) {
        if (masteredSet.has(id)) {
          next.add(id);
        }
      }
      return next;
    });
    setUserAnswers((prev) => {
      const next = { ...prev };
      for (const keyStr in next) {
        const id = parseInt(keyStr, 10);
        if (!masteredSet.has(id)) {
          delete next[id];
        }
      }
      return next;
    });
  }, [masteredSet]);

  const remainingWrong = wrongIndices.filter((idx) => !masteredSet.has(idx));

  const filteredIndices = React.useMemo(() => {
    switch (filter) {
      case "mastered":
        return wrongIndices.filter((idx) => masteredSet.has(idx));
      case "unmastered":
        return wrongIndices.filter((idx) => !masteredSet.has(idx));
      case "all":
      default:
        return wrongIndices;
    }
  }, [wrongIndices, filter, masteredSet]);

  const progress =
    wrongIndices.length > 0
      ? Math.round((masteredCount / wrongIndices.length) * 100)
      : 0;

  const totalPages = Math.ceil(filteredIndices.length / pageSize);
  const startIdx = page * pageSize;
  const endIdx = Math.min(startIdx + pageSize, filteredIndices.length);
  const currentQuestions = filteredIndices.slice(startIdx, endIdx);

  return (
    <div className="flex flex-col gap-5">
      {/* スマホレイアウト用ヘッダー的な部分（元々のヘッダーをここに入れる） */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e2130 0%, #252840 100%)",
          border: "1px solid #2e3248",
          borderRadius: "16px",
          padding: "16px 24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          {/* 戻るボタン */}
          <button
            onClick={onBack}
            style={{
              background: "rgba(99,102,241,0.15)",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: "10px",
              padding: "8px 16px",
              color: "#a5b4fc",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "rgba(99,102,241,0.3)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "rgba(99,102,241,0.15)";
            }}
          >
            Back
          </button>

          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
                marginBottom: "4px",
              }}
            >
              <h1
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #ef4444, #f97316)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  margin: 0,
                }}
              >
                Review Wrong Questions
              </h1>
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(
                    e.target.value as "all" | "mastered" | "unmastered",
                  );
                  setPage(0);
                }}
                style={{
                  background: "#1e2130",
                  color: "#e2e8f0",
                  border: "1px solid #2e3248",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="all">All</option>
                <option value="unmastered">Still wrong</option>
                <option value="mastered">Mastered</option>
              </select>
            </div>
            <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
              {filteredIndices.length} filtered ({wrongIndices.length} total)
            </p>
          </div>

          {/* 進捗バッジ */}
          <div
            style={{
              background: "rgba(34,197,94,0.15)",
              border: "1px solid rgba(34,197,94,0.3)",
              borderRadius: "10px",
              padding: "8px 16px",
              color: "#86efac",
              fontWeight: 700,
              fontSize: "14px",
              fontFamily: "monospace",
              whiteSpace: "nowrap",
            }}
          >
            {masteredCount} / {wrongIndices.length} mastered
          </div>
        </div>

        {/* プログレスバー */}
        <div style={{ marginTop: "16px" }}>
          <div
            style={{
              background: "#1a1d27",
              borderRadius: "9999px",
              height: "6px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "linear-gradient(90deg, #22c55e, #16a34a)",
                borderRadius: "9999px",
                transition: "width 0.5s ease",
              }}
            />
          </div>
          <p
            style={{
              textAlign: "right",
              fontSize: "11px",
              color: "#64748b",
              marginTop: "4px",
              marginBottom: 0,
            }}
          >
            {progress}% complete
          </p>
        </div>
      </div>

      {/* まだ間違っている問題 */}
      {checkedSet.size > 0 && remainingWrong.length > 0 && (
        <div
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "12px",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: "13px", color: "#fca5a5" }}>
            Still wrong: {remainingWrong.length} question
            {remainingWrong.length > 1 ? "s" : ""}. Keep trying!
          </div>
          {Array.from(checkedSet).some((id) => !masteredSet.has(id)) && (
            <button
              onClick={handleResetStillWrong}
              style={{
                background: "rgba(239,68,68,0.2)",
                border: "1px solid rgba(239,68,68,0.4)",
                color: "#fca5a5",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "rgba(239,68,68,0.3)")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.background = "rgba(239,68,68,0.2)")
              }
            >
              Reset Check
            </button>
          )}
        </div>
      )}

      {wrongIndices.length === 0 ? (
        // 間違いがない場合
        <div
          style={{
            textAlign: "center",
            padding: "80px 24px",
            color: "#94a3b8",
            background: "#1e2130",
            border: "1px solid #2e3248",
            borderRadius: "16px",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎉</div>
          <p
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "#e2e8f0",
              margin: "0 0 8px 0",
            }}
          >
            No wrong questions!
          </p>
          <p style={{ fontSize: "14px", margin: 0 }}>
            Go back and practice more questions.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {currentQuestions.map((globalIndex) => {
            const isMastered =
              checkedSet.has(globalIndex) &&
              isCorrect(questions[globalIndex], userAnswers[globalIndex] ?? []);
            return (
              <div key={globalIndex} id={`review-question-${globalIndex}`}>
                {isMastered && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "6px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#22c55e",
                      marginBottom: "4px",
                      letterSpacing: "0.05em",
                    }}
                  >
                    MASTERED
                  </div>
                )}
                <QuestionCard
                  question={questions[globalIndex]}
                  questionIndex={globalIndex}
                  total={questions.length}
                  userSelectedLabels={userAnswers[globalIndex] ?? []}
                  isChecked={checkedSet.has(globalIndex)}
                  isCopied={copiedIndex === globalIndex}
                  onCopy={() => onCopy(globalIndex)}
                  onActivate={() => onActivate(globalIndex)}
                  onSelectionChange={(labels) =>
                    handleSelectionChange(globalIndex, labels)
                  }
                  onCheck={(correct) => handleCheck(globalIndex, correct)}
                />
              </div>
            );
          })}

          {/* ページネーション */}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "16px 0",
              }}
            >
              <button
                onClick={() => {
                  setPage((p) => Math.max(0, p - 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={page === 0}
                style={{
                  background: page === 0 ? "#1e2130" : "rgba(99,102,241,0.2)",
                  border: "1px solid",
                  borderColor: page === 0 ? "#2e3248" : "rgba(99,102,241,0.4)",
                  borderRadius: "10px",
                  padding: "8px 16px",
                  color: page === 0 ? "#475569" : "#a5b4fc",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: page === 0 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i).map((p) => {
                if (
                  p === 0 ||
                  p === totalPages - 1 ||
                  Math.abs(p - page) <= 2
                ) {
                  return (
                    <button
                      key={p}
                      onClick={() => {
                        setPage(p);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      style={{
                        background:
                          p === page
                            ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                            : "#1e2130",
                        border: "1px solid",
                        borderColor: p === page ? "#6366f1" : "#2e3248",
                        borderRadius: "10px",
                        padding: "8px 14px",
                        color: p === page ? "#fff" : "#94a3b8",
                        fontWeight: 600,
                        fontSize: "14px",
                        cursor: "pointer",
                      }}
                    >
                      {p + 1}
                    </button>
                  );
                }
                if (Math.abs(p - page) === 3) {
                  return (
                    <span
                      key={p}
                      style={{ color: "#475569", fontSize: "14px" }}
                    >
                      ...
                    </span>
                  );
                }
                return null;
              })}

              <button
                onClick={() => {
                  setPage((p) => Math.min(totalPages - 1, p + 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={page === totalPages - 1}
                style={{
                  background:
                    page === totalPages - 1
                      ? "#1e2130"
                      : "rgba(99,102,241,0.2)",
                  border: "1px solid",
                  borderColor:
                    page === totalPages - 1
                      ? "#2e3248"
                      : "rgba(99,102,241,0.4)",
                  borderRadius: "10px",
                  padding: "8px 16px",
                  color: page === totalPages - 1 ? "#475569" : "#a5b4fc",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: page === totalPages - 1 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                Next
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          )}

          {/* 全問マスターバナー */}
          {masteredCount === wrongIndices.length && wrongIndices.length > 0 && (
            <div
              style={{
                background:
                  "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.15))",
                border: "1px solid rgba(34,197,94,0.4)",
                borderRadius: "20px",
                padding: "32px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#86efac",
                  marginBottom: "8px",
                }}
              >
                All mastered!
              </p>
              <p style={{ color: "#94a3b8", fontSize: "14px" }}>
                You got all {wrongIndices.length} previously wrong questions
                correct.
              </p>
              <button
                onClick={onBack}
                style={{
                  marginTop: "20px",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  border: "none",
                  borderRadius: "12px",
                  padding: "12px 32px",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "15px",
                  cursor: "pointer",
                }}
              >
                Back to Quiz
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
