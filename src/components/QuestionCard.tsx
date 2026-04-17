import React, { useCallback } from "react";
import { Copy, Check } from "lucide-react";
import type { QuizQuestion } from "../types";
import {
  parseOptions,
  parseAnswers,
  extractLabel,
  isCorrect,
  getFeedback,
} from "../utils";

interface QuestionCardProps {
  question: QuizQuestion;
  questionIndex: number;
  total: number;
  userSelectedLabels: string[];
  isChecked: boolean;
  onSelectionChange: (labels: string[]) => void;
  onCheck: (correct: boolean) => void;
  isCopied?: boolean;
  onCopy?: () => void;
  onActivate?: () => void;
}

// 問題カードコンポーネント
export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionIndex,
  total,
  userSelectedLabels,
  isChecked,
  onSelectionChange,
  onCheck,
  isCopied = false,
  onCopy,
  onActivate,
}) => {
  // 新フォーマット: 選択肢オプション配列（"a. テキスト" 形式）
  const options = parseOptions(question);
  // 正解ラベル配列（"a", "b", "c"...）
  const correctLabels = parseAnswers(question);

  // 複数選択かどうかの判定
  const isMultiple = correctLabels.length > 1;

  // showResultはisCheckedから直接派生
  const showResult = isChecked;

  // オプション選択ハンドラ
  const handleOptionClick = (label: string) => {
    if (isChecked) return;
    onActivate?.();
    if (isMultiple) {
      const updated = userSelectedLabels.includes(label)
        ? userSelectedLabels.filter((l) => l !== label)
        : [...userSelectedLabels, label];
      onSelectionChange(updated);
    } else {
      onSelectionChange([label]);
    }
  };

  // チェックハンドラ
  const handleCheck = () => {
    if (userSelectedLabels.length === 0) return;
    const correct = isCorrect(question, userSelectedLabels);
    onCheck(correct);
  };

  // クリップボードにコピーする関数
  const copyToClipboard = useCallback(() => {
    const optionsText = options.join("\n");
    const textToCopy = `${question.question_plain}\n\n[Options]\n${optionsText}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      if (onCopy) onCopy();
    });
  }, [question, options, onCopy]);

  // オプションのスタイルを取得
  const getOptionStyle = (label: string) => {
    const isSelected = userSelectedLabels.includes(label);
    const isCorrectOption = correctLabels.includes(label);

    if (showResult) {
      if (isCorrectOption) {
        return {
          background: "rgba(34, 197, 94, 0.15)",
          border: "1.5px solid #22c55e",
          color: "#86efac",
        };
      }
      if (isSelected && !isCorrectOption) {
        return {
          background: "rgba(239, 68, 68, 0.15)",
          border: "1.5px solid #ef4444",
          color: "#fca5a5",
        };
      }
      return {
        background: "rgba(30, 33, 48, 0.5)",
        border: "1.5px solid #2e3248",
        color: "#64748b",
      };
    }

    if (isSelected) {
      return {
        background: "rgba(99, 102, 241, 0.2)",
        border: "1.5px solid #6366f1",
        color: "#a5b4fc",
      };
    }

    return {
      background: "rgba(30, 33, 48, 0.6)",
      border: "1.5px solid #2e3248",
      color: "#cbd5e1",
    };
  };

  const currentIsCorrect = isCorrect(question, userSelectedLabels);

  // 問題テキスト: HTMLタグまたはHTMLエンティティを含む場合はdangerouslySetInnerHTMLで描画
  const questionHasHtml =
    /<[a-z][\s\S]*>/i.test(question.prompt.question) ||
    /&(?:[a-z]+|#\d+|#x[\da-f]+);/i.test(question.prompt.question);

  return (
    <div
      className="question-card"
      onMouseDown={() => onActivate?.()}
      style={{
        position: "relative",
        background: "linear-gradient(135deg, #1e2130 0%, #1a1d27 100%)",
        border: showResult
          ? currentIsCorrect
            ? "1px solid rgba(34,197,94,0.4)"
            : "1px solid rgba(239,68,68,0.4)"
          : "1px solid #2e3248",
        borderRadius: "20px",
        padding: "28px",
        transition: "border-color 0.3s",
      }}
    >
      {/* コピー完了トースト通知 */}
      {isCopied && (
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "rgba(34, 197, 94, 0.15)",
            border: "1px solid rgba(34, 197, 94, 0.4)",
            borderRadius: "8px",
            padding: "6px 14px",
            fontSize: "12px",
            fontWeight: 600,
            color: "#22c55e",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            animation: "fadeIn 0.15s ease",
            zIndex: 10,
          }}
        >
          Copied!
        </div>
      )}

      {/* ヘッダー: 問題番号 */}
      <div className="flex items-center gap-3 mb-5">
        <div
          style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            borderRadius: "10px",
            padding: "6px 14px",
            fontSize: "13px",
            fontWeight: 700,
            color: "#fff",
            letterSpacing: "0.05em",
            flexShrink: 0,
          }}
        >
          Q {questionIndex + 1} / {total}
        </div>
        {isMultiple && (
          <span
            style={{
              background: "rgba(245, 158, 11, 0.15)",
              border: "1px solid rgba(245, 158, 11, 0.4)",
              borderRadius: "8px",
              padding: "3px 10px",
              fontSize: "11px",
              fontWeight: 600,
              color: "#fbbf24",
            }}
          >
            Choose {correctLabels.length}
          </span>
        )}
        {isChecked && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: "13px",
              fontWeight: 700,
              color: currentIsCorrect ? "#22c55e" : "#ef4444",
              background: currentIsCorrect
                ? "rgba(34,197,94,0.1)"
                : "rgba(239,68,68,0.1)",
              border: `1px solid ${currentIsCorrect ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
              borderRadius: "8px",
              padding: "4px 12px",
            }}
          >
            {currentIsCorrect ? "Correct!" : "Wrong!"}
          </span>
        )}
      </div>

      {/* 問題テキストとコピーボタン */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          marginBottom: "20px",
          marginTop: "10px",
        }}
      >
        {questionHasHtml ? (
          /* HTMLタグを含む問題テキストを描画 */
          <div
            style={{
              flex: 1,
              fontSize: "15px",
              lineHeight: "1.7",
              color: "#e2e8f0",
              fontWeight: 500,
              margin: 0,
            }}
            dangerouslySetInnerHTML={{ __html: question.prompt.question }}
          />
        ) : (
          <p
            style={{
              flex: 1,
              fontSize: "15px",
              lineHeight: "1.7",
              color: "#e2e8f0",
              fontWeight: 500,
              margin: 0,
            }}
          >
            {question.prompt.question}
          </p>
        )}
        <button
          onClick={copyToClipboard}
          style={{
            background: isCopied
              ? "rgba(34, 197, 94, 0.15)"
              : "rgba(255, 255, 255, 0.05)",
            border: isCopied
              ? "1px solid rgba(34, 197, 94, 0.4)"
              : "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "6px",
            padding: "8px",
            color: isCopied ? "#22c55e" : "#94a3b8",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "all 0.2s",
          }}
          title="Copy (C)"
        >
          {isCopied ? (
            // コピー完了アイコン
            <Check size={16} />
          ) : (
            // コピーアイコン
            <Copy size={16} />
          )}
        </button>
      </div>

      {/* 選択肢 */}
      <div className="flex flex-col gap-2 mb-5">
        {options.map((option, i) => {
          const label = extractLabel(option);
          const style = getOptionStyle(label);
          const isSelected = userSelectedLabels.includes(label);
          const isCorrectOption = correctLabels.includes(label);

          const shouldShowFeedback = showResult;
          const feedback = shouldShowFeedback
            ? getFeedback(question, label)
            : null;

          return (
            <div key={i} className="flex flex-col gap-2">
              <div
                id={`q${questionIndex}-opt-${label}`}
                className="question-option"
                tabIndex={0}
                onClick={() => {
                  const selection = window.getSelection();
                  if (selection && selection.type === "Range") {
                    return; // テキスト選択中はクリックを無視
                  }
                  handleOptionClick(label);
                }}
                style={{
                  ...style,
                  borderRadius: "12px",
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: "14px",
                  lineHeight: "1.5",
                  cursor: isChecked ? "default" : "pointer",
                  transition: "all 0.2s",
                  width: "100%",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  userSelect: "text",
                }}
              >
                {/* チェックインジケーター */}
                <span
                  style={{
                    width: "20px",
                    height: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: "1px",
                    color: style.color,
                  }}
                >
                  {isSelected ? (
                    <Check size={16} strokeWidth={2.5} />
                  ) : (
                    <span
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: isMultiple ? "4px" : "50%",
                        border: `2px solid ${style.color}`,
                        display: "inline-block",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </span>
                <span dangerouslySetInnerHTML={{ __html: option }} />
              </div>

              {/* フィードバック表示（選択肢のすぐ下） */}
              {feedback && (
                <div
                  style={{
                    background: isCorrectOption
                      ? "rgba(34, 197, 94, 0.06)"
                      : "rgba(239, 68, 68, 0.06)",
                    border: isCorrectOption
                      ? "1px solid rgba(34, 197, 94, 0.2)"
                      : "1px solid rgba(239, 68, 68, 0.2)",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    marginLeft: "30px", // 少しインデントして選択肢に属していることを強調
                  }}
                >
                  <p
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: isCorrectOption ? "#22c55e" : "#ef4444",
                      marginBottom: "4px",
                    }}
                  >
                    {label.toUpperCase()}.{" "}
                    {isCorrectOption ? "Correct" : "Wrong"}
                  </p>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#94a3b8",
                      lineHeight: "1.6",
                      margin: 0,
                    }}
                    dangerouslySetInnerHTML={{ __html: feedback }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* チェックボタン */}
      {!isChecked && (
        <button
          id={`check-btn-${questionIndex}`}
          className="check-button"
          onClick={handleCheck}
          disabled={userSelectedLabels.length === 0}
          style={{
            background:
              userSelectedLabels.length > 0
                ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                : "#2e3248",
            border: "none",
            borderRadius: "12px",
            padding: "12px 24px",
            color: userSelectedLabels.length > 0 ? "#fff" : "#475569",
            fontWeight: 600,
            fontSize: "14px",
            cursor: userSelectedLabels.length > 0 ? "pointer" : "not-allowed",
            transition: "all 0.2s",
            width: "100%",
            marginTop: "10px",
          }}
        >
          Check Answer
        </button>
      )}

      {/* 正解表示とフィードバック（チェック後） */}
      {showResult && (
        <div
          style={{
            marginTop: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        />
      )}
    </div>
  );
};
