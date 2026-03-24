import React from "react";
import type { QuizQuestion } from "../types";
import { parseOptions, parseAnswers, extractLabel, isCorrect } from "../utils";

interface QuestionCardProps {
  question: QuizQuestion;
  questionIndex: number;
  total: number;
  userSelectedLabels: string[];
  isChecked: boolean;
  onSelectionChange: (labels: string[]) => void;
  onCheck: (correct: boolean) => void;
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
}) => {
  const options = parseOptions(question.Option);
  const correctAnswers = parseAnswers(question.Answer);
  const correctLabels = correctAnswers.map(extractLabel);

  // 複数選択かどうかの判定
  const isMultiple = correctLabels.length > 1;

  // showResultはisCheckedから直接派生（stateを不要にする）
  const showResult = isChecked;

  // オプション選択ハンドラ
  const handleOptionClick = (label: string) => {
    if (isChecked) return;
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

  return (
    <div
      style={{
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

      {/* 問題テキスト */}
      <p
        style={{
          fontSize: "15px",
          lineHeight: "1.7",
          color: "#e2e8f0",
          marginBottom: "20px",
          fontWeight: 500,
        }}
      >
        {question.Question}
      </p>

      {/* 選択肢 */}
      <div className="flex flex-col gap-2 mb-5">
        {options.map((option, i) => {
          const label = extractLabel(option);
          const style = getOptionStyle(label);
          const isSelected = userSelectedLabels.includes(label);
          return (
            <div
              key={i}
              id={`q${questionIndex}-opt-${label}`}
              onClick={() => {
                const selection = window.getSelection();
                if (selection && selection.type === 'Range') {
                  return; // Don't trigger click if user is selecting text
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
                  borderRadius: isMultiple ? "5px" : "50%",
                  border: `2px solid ${style.color}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: "11px",
                  fontWeight: 700,
                  marginTop: "1px",
                  color: style.color,
                }}
              >
                {isSelected ? "✓" : ""}
              </span>
              <span>{option}</span>
            </div>
          );
        })}
      </div>

      {/* チェックボタン */}
      {!isChecked && (
        <button
          id={`check-btn-${questionIndex}`}
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

      {/* 正解表示（チェック後） */}
      {showResult && (
        <div
          style={{
            marginTop: "16px",
            background: "rgba(99, 102, 241, 0.08)",
            border: "1px solid rgba(99, 102, 241, 0.2)",
            borderRadius: "12px",
            padding: "14px 16px",
          }}
        >
          <p
            style={{
              fontSize: "12px",
              color: "#94a3b8",
              marginBottom: "6px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Correct Answer{correctLabels.length > 1 ? "s" : ""}:
          </p>
          <div className="flex flex-col gap-1">
            {correctAnswers.map((ans, i) => (
              <p
                key={i}
                style={{ fontSize: "14px", color: "#86efac", fontWeight: 500 }}
              >
                {ans}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
