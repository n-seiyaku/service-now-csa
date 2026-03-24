import React, { useState, useCallback } from "react";
import questionsData from "./Question.json";
import type { QuizQuestion } from "./types";
import { QuestionCard } from "./components/QuestionCard";
import { isCorrect } from "./utils";

interface ReviewPageProps {
  // 間違えた問題のインデックスリスト
  wrongIndices: number[];
  // メインページへ戻るコールバック
  onBack: () => void;
  // 復習でクリアした問題インデックスを通知
  onClearWrong: (clearedIndex: number) => void;
}

const questions = questionsData as QuizQuestion[];

// 復習ページコンポーネント
export const ReviewPage: React.FC<ReviewPageProps> = ({
  wrongIndices,
  onBack,
  onClearWrong,
}) => {
  // 復習用回答状態（元のglobalIndex -> 選択ラベル）
  const [userAnswers, setUserAnswers] = useState<Record<number, string[]>>({});
  // チェック済みインデックスセット（globalIndex）
  const [checkedSet, setCheckedSet] = useState<Set<number>>(new Set());
  // 復習で正解した数
  const [masteredCount, setMasteredCount] = useState(0);
  // 正解済みインデックスセット（renderで使用するためrefではなくstate）
  const [masteredSet, setMasteredSet] = useState<Set<number>>(new Set());;

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
        // 正解したら親に通知（サイドバーのwrongリストから削除）
        onClearWrong(globalIndex);
      }
    },
    [checkedSet, onClearWrong],
  );

  const remainingWrong = wrongIndices.filter((idx) => !masteredSet.has(idx));

  const progress =
    wrongIndices.length > 0
      ? Math.round((masteredCount / wrongIndices.length) * 100)
      : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117" }}>
      {/* ヘッダー */}
      <header
        style={{
          background: "rgba(30, 33, 48, 0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #2e3248",
          padding: "16px 24px",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
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
            <h1
              style={{
                fontSize: "18px",
                fontWeight: 700,
                background: "linear-gradient(135deg, #ef4444, #f97316)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Review Wrong Questions
            </h1>
            <p style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
              {wrongIndices.length} questions to review
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
            }}
          >
            {masteredCount} / {wrongIndices.length} mastered
          </div>
        </div>

        {/* プログレスバー */}
        <div
          style={{
            maxWidth: "900px",
            margin: "12px auto 0",
          }}
        >
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
            }}
          >
            {progress}% complete
          </p>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "24px",
        }}
      >
        {wrongIndices.length === 0 ? (
          // 間違いがない場合
          <div
            style={{
              textAlign: "center",
              padding: "80px 24px",
              color: "#94a3b8",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎉</div>
            <p style={{ fontSize: "20px", fontWeight: 600, color: "#e2e8f0" }}>
              No wrong questions!
            </p>
            <p style={{ fontSize: "14px", marginTop: "8px" }}>
              Go back and practice more questions.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {wrongIndices.map((globalIndex) => {
              const isMastered =
                checkedSet.has(globalIndex) &&
                isCorrect(
                  questions[globalIndex],
                  userAnswers[globalIndex] ?? [],
                );
              return (
                <div
                  key={globalIndex}
                  id={`review-question-${globalIndex}`}
                  style={{
                    opacity: isMastered ? 0.5 : 1,
                    transition: "opacity 0.4s",
                  }}
                >
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
                    onSelectionChange={(labels) =>
                      handleSelectionChange(globalIndex, labels)
                    }
                    onCheck={(correct) => handleCheck(globalIndex, correct)}
                  />
                </div>
              );
            })}

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

            {/* まだ間違っている問題 */}
            {checkedSet.size > 0 && remainingWrong.length > 0 && (
              <div
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  fontSize: "13px",
                  color: "#fca5a5",
                }}
              >
                Still wrong: {remainingWrong.length} question
                {remainingWrong.length > 1 ? "s" : ""}. Keep trying!
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
