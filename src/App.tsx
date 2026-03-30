import React, { useState, useCallback, useEffect, useRef } from "react";
import type { QuizQuestion } from "./types";
import { QuestionCard } from "./components/QuestionCard";
import { ScorePanel } from "./components/ScorePanel";
import { ShortcutInfo } from "./components/ShortcutInfo";
import { ReviewPage } from "./ReviewPage";
import {
  parseOptions,
  exportWrongQuestionsForGemini,
  saveProgress,
  loadProgress,
  clearProgress,
  formatSavedAt,
} from "./utils";

// Load all assessments
const assessmentModules = import.meta.glob("./assessments/*.json", { eager: true });
const assessmentsMap: Record<string, QuizQuestion[]> = {};

for (const path in assessmentModules) {
  const match = path.match(/\/([^/]+)\.json$/);
  if (match) {
    const examId = match[1];
    assessmentsMap[examId] = (assessmentModules[path] as { default: QuizQuestion[] }).default;
  }
}

const availableExams = Object.keys(assessmentsMap).sort();

// デフォルトのページあたり表示数
const DEFAULT_PAGE_SIZE = 1;

// ビュー種別
type View = "quiz" | "review";

// 保存済み進捗から初期状態を復元するヘルパー
const initFromStorage = (examId: string) => {
  const saved = loadProgress(examId);
  if (!saved) {
    return {
      userAnswers: {} as Record<number, string[]>,
      checkedSet: new Set<number>(),
      correctCount: 0,
      wrongCount: 0,
      wrongIndices: [] as number[],
      page: 0,
      pageSize: DEFAULT_PAGE_SIZE,
      savedAt: null as string | null,
    };
  }
  return {
    userAnswers: saved.userAnswers,
    checkedSet: new Set<number>(saved.checkedIndices),
    correctCount: saved.correctCount,
    wrongCount: saved.wrongCount,
    wrongIndices: saved.wrongIndices,
    page: saved.page,
    pageSize: saved.pageSize ?? DEFAULT_PAGE_SIZE,
    savedAt: saved.savedAt,
  };
};

interface QuizAppProps {
  examId: string;
  questions: QuizQuestion[];
  availableExams: string[];
  onExamChange: (id: string) => void;
}

const QuizApp: React.FC<QuizAppProps> = ({ examId, questions, availableExams, onExamChange }) => {
  const initial = initFromStorage(examId);

  // ユーザーの回答状態（インデックス -> 選択ラベル配列）
  const [userAnswers, setUserAnswers] = useState<Record<number, string[]>>(
    initial.userAnswers,
  );
  // チェック済みインデックスセット
  const [checkedSet, setCheckedSet] = useState<Set<number>>(initial.checkedSet);
  // 正解数
  const [correctCount, setCorrectCount] = useState(initial.correctCount);
  // 不正解数
  const [wrongCount, setWrongCount] = useState(initial.wrongCount);
  // 不正解インデックスリスト
  const [wrongIndices, setWrongIndices] = useState<number[]>(
    initial.wrongIndices,
  );
  // 現在のページ
  const [page, setPage] = useState(initial.page);
  // 1ページあたりの表示数
  const [pageSize, setPageSize] = useState(initial.pageSize);
  // 現在のビュー
  const [view, setView] = useState<View>("quiz");
  // 進捗の最終保存日時
  const [savedAt, setSavedAt] = useState<string | null>(initial.savedAt);
  // リセット確認ダイアログ表示フラグ
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  // 保存トースト表示フラグ
  const [showSavedToast, setShowSavedToast] = useState(false);
  // コピー済み問題インデックス（Cキー用フィードバック）
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 最後にインタラクションした問題インデックス（Cキーコピー対象）
  const activeQuestionRef = useRef<number>(0);

  // 二重カウント防止
  const checkedResults = useRef<Record<number, boolean>>({});
  // デバウンスタイマー
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalPages = Math.ceil(questions.length / pageSize);
  const startIdx = page * pageSize;
  const endIdx = Math.min(startIdx + pageSize, questions.length);
  const currentPageQuestions = questions.slice(startIdx, endIdx);

  // ページあたり表示数変更ハンドラ
  const handlePageSizeChange = useCallback((newSize: number) => {
    const currentStartIdx = page * pageSize;
    setPageSize(newSize);
    setPage(Math.floor(currentStartIdx / newSize));
  }, [page, pageSize]);

  // 進捗を自動保存（500msデバウンス）
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const now = new Date().toISOString();
      saveProgress({
        userAnswers,
        checkedIndices: Array.from(checkedSet),
        correctCount,
        wrongCount,
        wrongIndices,
        page,
        pageSize,
        savedAt: now,
      }, examId);
      setSavedAt(now);
    }, 500);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [userAnswers, checkedSet, correctCount, wrongCount, wrongIndices, page, pageSize, examId]);

  // キーボード操作のサポート
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Input項目などで入力中の場合は無視
      if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) {
        return;
      }

      // Quizビューのみ: 左右キーでページ遷移
      if (view === "quiz") {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          setPage((p) => Math.max(0, p - 1));
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          setPage((p) => Math.min(totalPages - 1, p + 1));
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
      }

      // 上下/Space/Enter: 選択肢とチェックの操作
      if (["ArrowUp", "ArrowDown", " ", "Enter"].includes(e.key)) {
        // マウスでテキスト選択中の場合は誤作動を防ぐ
        const selection = window.getSelection();
        if (selection && selection.type === "Range" && e.key !== "Enter") return;

        const focusableElements = Array.from(
          document.querySelectorAll(".question-option")
        ) as HTMLElement[];

        if (focusableElements.length === 0) return;

        const activeIdx = focusableElements.findIndex(
          (el) => el === document.activeElement
        );

        if (e.key === "ArrowUp") {
          e.preventDefault();
          const nextIdx =
            activeIdx > 0 ? activeIdx - 1 : focusableElements.length - 1;
          focusableElements[nextIdx].focus();
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          const nextIdx =
            activeIdx !== -1 && activeIdx < focusableElements.length - 1
              ? activeIdx + 1
              : 0;
          focusableElements[nextIdx].focus();
        } else if (e.key === " ") {
          e.preventDefault();
          if (document.activeElement?.classList.contains("question-option")) {
            (document.activeElement as HTMLElement).click();
          }
        } else if (e.key === "Enter") {
          e.preventDefault();
          // アクティブな選択肢があれば、その問題のCheckボタンを押す
          if (document.activeElement?.classList.contains("question-option")) {
            const card = document.activeElement.closest(".question-card");
            if (card) {
              const checkBtn = card.querySelector(
                ".check-button:not([disabled])"
              ) as HTMLButtonElement | null;
              if (checkBtn) {
                checkBtn.click();
              }
            }
          } else {
            // そうでなければ、画面上の最初の有効なCheckボタンを押す
            const checkBtns = document.querySelectorAll(
              ".check-button:not([disabled])"
            ) as NodeListOf<HTMLButtonElement>;
            if (checkBtns.length > 0) {
              checkBtns[0].click();
            }
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [view, totalPages]);

  // 「c」キー: 最後にインタラクションした問題をコピー
  useEffect(() => {
    const handleCopyKey = (e: KeyboardEvent) => {
      if (e.key !== "c" || e.ctrlKey || e.metaKey) return;
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) return;

      const targetIndex = activeQuestionRef.current;
      const q = questions[targetIndex];
      // 新フォーマット: question_plainとprompt.answersを使用
      const opts = parseOptions(q);
      const textToCopy = `${q.question_plain}\n\n[Options]\n${opts.join("\n")}`;
      navigator.clipboard.writeText(textToCopy).then(() => {
        if (copiedTimer.current) clearTimeout(copiedTimer.current);
        setCopiedIndex(targetIndex);
        copiedTimer.current = setTimeout(() => setCopiedIndex(null), 2000);
      });
    };

    window.addEventListener("keydown", handleCopyKey);
    return () => window.removeEventListener("keydown", handleCopyKey);
  }, [questions]);

  // 選択肢変更ハンドラ
  const handleSelectionChange = useCallback(
    (questionIndex: number, labels: string[]) => {
      setUserAnswers((prev) => ({ ...prev, [questionIndex]: labels }));
    },
    [],
  );

  // チェックハンドラ（二重カウント防止）
  const handleCheck = useCallback(
    (questionIndex: number, correct: boolean) => {
      if (checkedSet.has(questionIndex)) return;

      setCheckedSet((prev) => {
        const next = new Set(prev);
        next.add(questionIndex);
        return next;
      });

      checkedResults.current[questionIndex] = correct;

      if (correct) {
        setCorrectCount((c) => c + 1);
      } else {
        setWrongCount((w) => w + 1);
        setWrongIndices((prev) =>
          prev.includes(questionIndex)
            ? prev
            : [...prev, questionIndex].sort((a, b) => a - b),
        );
      }
    },
    [checkedSet],
  );

  // 特定の問題へジャンプ
  const handleJumpToQuestion = useCallback((index: number) => {
    const targetPage = Math.floor(index / pageSize);
    setPage(targetPage);
    setView("quiz");
    setTimeout(() => {
      const el = document.getElementById(`question-${index}`);
      if (el) {
        const headerOffset = 90; // ヘッダーの高さ分オフセット
        const elementPosition = el.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    }, 100);
  }, [pageSize]);

  // エクスポートハンドラ
  const handleExportWrong = useCallback(() => {
    exportWrongQuestionsForGemini(wrongIndices, questions);
  }, [wrongIndices, questions]);

  // 復習でクリアされた問題を削除
  const handleClearWrong = useCallback((clearedIndex: number) => {
    setWrongIndices((prev) => prev.filter((i) => i !== clearedIndex));
  }, []);

  // リセット実行
  const handleReset = useCallback(() => {
    clearProgress(examId);
    setUserAnswers({});
    setCheckedSet(new Set());
    setCorrectCount(0);
    setWrongCount(0);
    setWrongIndices([]);
    setPage(0);
    setSavedAt(null);
    setShowResetConfirm(false);
    checkedResults.current = {};
  }, [examId]);

  // 手動保存（トースト表示）
  const handleManualSave = useCallback(() => {
    const now = new Date().toISOString();
    saveProgress({
      userAnswers,
      checkedIndices: Array.from(checkedSet),
      correctCount,
      wrongCount,
      wrongIndices,
      page,
      pageSize,
      savedAt: now,
    }, examId);
    setSavedAt(now);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2500);
  }, [userAnswers, checkedSet, correctCount, wrongCount, wrongIndices, page, pageSize, examId]);

  // 復習ページ表示
  if (view === "review") {
    return (
      <ReviewPage
        questions={questions}
        wrongIndices={wrongIndices}
        onBack={() => setView("quiz")}
        onClearWrong={handleClearWrong}
      />
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117" }}>
      {/* 保存トースト */}
      {showSavedToast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            borderRadius: "12px",
            padding: "12px 24px",
            color: "#fff",
            fontWeight: 600,
            fontSize: "14px",
            zIndex: 9999,
            boxShadow: "0 8px 32px rgba(34,197,94,0.3)",
            animation: "fadeInUp 0.3s ease",
          }}
        >
          Progress saved!
        </div>
      )}

      {/* リセット確認ダイアログ */}
      {showResetConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
            zIndex: 9998,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowResetConfirm(false)}
        >
          <div
            style={{
              background: "#1e2130",
              border: "1px solid #2e3248",
              borderRadius: "20px",
              padding: "32px",
              maxWidth: "360px",
              width: "90%",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "#e2e8f0",
                marginBottom: "8px",
              }}
            >
              Reset all progress?
            </p>
            <p
              style={{
                fontSize: "13px",
                color: "#94a3b8",
                marginBottom: "24px",
                lineHeight: "1.6",
              }}
            >
              All answers, scores, and wrong question data will be erased. This cannot be undone.
            </p>
            <div
              style={{ display: "flex", gap: "12px", justifyContent: "center" }}
            >
              <button
                onClick={() => setShowResetConfirm(false)}
                style={{
                  background: "#2e3248",
                  border: "1px solid #3e4260",
                  borderRadius: "10px",
                  padding: "10px 24px",
                  color: "#94a3b8",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                style={{
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  border: "none",
                  borderRadius: "10px",
                  padding: "10px 24px",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ヘッダー */}
      <header
        style={{
          background: "rgba(30, 33, 48, 0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #2e3248",
          padding: "12px 24px",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "20px",
                fontWeight: 700,
                background: "linear-gradient(135deg, #6366f1, #a78bfa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.02em",
              }}
            >
              CSA Quiz Practice
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
              <select
                value={examId}
                onChange={(e) => onExamChange(e.target.value)}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  color: "#fff",
                  fontSize: "12px",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {availableExams.map((exam) => {
                  const displayName = exam.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                  return (
                    <option key={exam} value={exam} style={{ background: "#1e2130", color: "#fff" }}>
                      {displayName}
                    </option>
                  );
                })}
              </select>
              {savedAt && (
                <span style={{ fontSize: "11px", color: "#475569" }}>
                  Auto-saved: {formatSavedAt(savedAt)}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* 手動保存ボタン */}
            <button
              id="save-btn"
              onClick={handleManualSave}
              title="Save progress"
              style={{
                background: "rgba(34,197,94,0.15)",
                border: "1px solid rgba(34,197,94,0.3)",
                borderRadius: "10px",
                padding: "7px 14px",
                color: "#86efac",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(34,197,94,0.25)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(34,197,94,0.15)";
              }}
            >
              Save
            </button>

            {/* リセットボタン */}
            <button
              id="reset-btn"
              onClick={() => setShowResetConfirm(true)}
              title="Reset all progress"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: "10px",
                padding: "7px 14px",
                color: "#fca5a5",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.2)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.1)";
              }}
            >
              Reset
            </button>

            {/* 復習ボタン */}
            {wrongIndices.length > 0 && (
              <button
                id="review-btn"
                onClick={() => setView("review")}
                style={{
                  background: "linear-gradient(135deg, #ef4444, #f97316)",
                  border: "none",
                  borderRadius: "10px",
                  padding: "7px 14px",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "opacity 0.2s, transform 0.1s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.opacity = "0.9";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.opacity = "1";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                Review ({wrongIndices.length})
              </button>
            )}

            {/* 表示件数切替 */}
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              style={{
                background: "rgba(99,102,241,0.15)",
                border: "1px solid rgba(99,102,241,0.3)",
                borderRadius: "8px",
                padding: "5px 12px",
                color: "#a5b4fc",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="1" style={{ background: "#1e2130" }}>1 Q/Page</option>
              <option value="5" style={{ background: "#1e2130" }}>5 Q/Page</option>
              <option value="10" style={{ background: "#1e2130" }}>10 Q/Page</option>
              <option value="20" style={{ background: "#1e2130" }}>20 Q/Page</option>
              <option value={questions.length} style={{ background: "#1e2130" }}>All ({questions.length})</option>
            </select>

            <span
              style={{
                background: "rgba(99,102,241,0.15)",
                border: "1px solid rgba(99,102,241,0.3)",
                borderRadius: "8px",
                padding: "5px 12px",
                color: "#a5b4fc",
                fontWeight: 600,
                fontSize: "13px",
              }}
            >
              Total: {questions.length} Q
            </span>

            {/* ショートカット情報ボタン */}
            <ShortcutInfo />
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "24px",
          display: "grid",
          gridTemplateColumns: "1fr 300px",
          gap: "24px",
          alignItems: "start",
        }}
        className="lg:grid-cols-[1fr_300px] md:grid-cols-1"
      >
        {/* 問題リスト */}
        <div className="flex flex-col gap-5">

          {currentPageQuestions.map((q, i) => {
            const globalIndex = startIdx + i;
            return (
              <div id={`question-${globalIndex}`} key={globalIndex}>
                <QuestionCard
                  question={q}
                  questionIndex={globalIndex}
                  total={questions.length}
                  userSelectedLabels={userAnswers[globalIndex] ?? []}
                  isChecked={checkedSet.has(globalIndex)}
                  isCopied={copiedIndex === globalIndex}
                  onCopy={() => {
                    if (copiedTimer.current) clearTimeout(copiedTimer.current);
                    setCopiedIndex(globalIndex);
                    copiedTimer.current = setTimeout(() => setCopiedIndex(null), 2000);
                  }}
                  onActivate={() => { activeQuestionRef.current = globalIndex; }}
                  onSelectionChange={(labels) =>
                    handleSelectionChange(globalIndex, labels)
                  }
                  onCheck={(correct) => handleCheck(globalIndex, correct)}
                />
              </div>
            );
          })}

          {/* ページネーション */}
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
              }}
            >
              Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i).map((p) => {
              if (p === 0 || p === totalPages - 1 || Math.abs(p - page) <= 2) {
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
                  <span key={p} style={{ color: "#475569", fontSize: "14px" }}>
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
                  page === totalPages - 1 ? "#1e2130" : "rgba(99,102,241,0.2)",
                border: "1px solid",
                borderColor:
                  page === totalPages - 1 ? "#2e3248" : "rgba(99,102,241,0.4)",
                borderRadius: "10px",
                padding: "8px 16px",
                color: page === totalPages - 1 ? "#475569" : "#a5b4fc",
                fontWeight: 600,
                fontSize: "14px",
                cursor: page === totalPages - 1 ? "not-allowed" : "pointer",
              }}
            >
              Next
            </button>
          </div>
        </div>

        {/* スコアパネル（右サイドバー） - スクロール時に固定 */}
        <aside
          className="scrollbar-hide"
          style={{
            position: "sticky",
            top: "100px",
            alignSelf: "start",
            maxHeight: "calc(100vh - 120px)",
            overflowY: "auto",
          }}
        >
          <ScorePanel
            correctCount={correctCount}
            wrongCount={wrongCount}
            total={questions.length}
            checkedCount={checkedSet.size}
            wrongIndices={wrongIndices}
            onExportWrong={handleExportWrong}
            onJumpToQuestion={handleJumpToQuestion}
            onReview={() => setView("review")}
          />
        </aside>
      </main>

      {/* フェードインアニメーションとフォーカススタイル */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate(-50%, 12px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        .question-option:focus {
          outline: 2px solid #818cf8;
          outline-offset: 3px;
        }
      `}</style>
    </div>
  );
};

export default function App() {
  const [examId, setExamId] = useState<string>(availableExams[0] || "");
  
  if (!examId) {
    return (
      <div style={{ padding: "40px", color: "white", textAlign: "center", background: "#0f1117", minHeight: "100vh" }}>
        <h2>No assessments found</h2>
        <p>Please place JSON files in the src/assessments/ directory.</p>
      </div>
    );
  }
  
  const questions = assessmentsMap[examId];
  return (
    <QuizApp
      key={examId}
      examId={examId}
      questions={questions}
      availableExams={availableExams}
      onExamChange={setExamId}
    />
  );
}
