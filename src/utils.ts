import type { QuizQuestion } from "./types";

// 問題オプションをパース（パイプ区切り -> 配列）
export const parseOptions = (optionStr: string): string[] => {
  return optionStr
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
};

// 正解をパース（パイプ区切り -> ラベル配列）
export const parseAnswers = (answerStr: string): string[] => {
  return answerStr
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
};

// オプション文字列からラベル（a, b, c...またはA, B, C...）を抽出
export const extractLabel = (option: string): string => {
  const match = option.match(/^([a-zA-Z])\./);
  return match ? match[1].toLowerCase() : option.trim().toLowerCase();
};

// ユーザーの回答が正解かどうかを判定
export const isCorrect = (
  question: QuizQuestion,
  selectedLabels: string[],
): boolean => {
  const correctLabels = parseAnswers(question.Answer).map((a) =>
    extractLabel(a),
  );
  if (correctLabels.length !== selectedLabels.length) return false;
  const sortedCorrect = [...correctLabels].sort();
  const sortedSelected = [...selectedLabels].sort();
  return sortedCorrect.every((v, i) => v === sortedSelected[i]);
};

// 不正解問題をGeminiのCanvasプロンプト付きで書き出す
export const exportWrongQuestionsForGemini = (
  indices: number[],
  allQuestions: QuizQuestion[],
): void => {
  const wrongQuestions = indices.map((idx) => allQuestions[idx]);

  const prompt = `Bạn là một chuyên gia về ServiceNow CSA.
Dưới đây là danh sách các câu hỏi tôi đã làm sai.
Hãy sử dụng tính năng Artifacts hoặc Canvas của bạn để tạo ra một ứng dụng Quiz tương tác siêu đẹp (dùng React + Tailwind CSS).
Yêu cầu cho ứng dụng:
1. Hiển thị từng câu hỏi một (One by one), không hiển thị danh sách.
2. Có nút cho tôi chọn các lựa chọn đáp án.
3. Sau khi tôi nộp đáp án, lập tức báo ĐÚNG/SAI và đặc biệt: HIỂN THỊ GIẢI THÍCH CHI TIẾT vì sao đáp án đúng lại đúng, và vì sao các lựa chọn còn lại bị sai (hãy giải thích thật dễ hiểu).
4. Có nút điều hướng "Next Question".
5. Chỉ sử dụng dữ liệu JSON dưới đây làm nguồn câu hỏi duy 
[DATA START]
${JSON.stringify(wrongQuestions, null, 2)}
[DATA END]
`;

  const blob = new Blob([prompt], { type: "text/plain;charset=utf-8" });
  const dataUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = "Gemini_Prompt_Wrong_Questions.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(dataUrl);
};

// ============================================================
// 進捗保存用の型とストレージ関数
// ============================================================

export interface SavedProgress {
  // 回答済みの選択肢（インデックス -> ラベル配列）
  userAnswers: Record<number, string[]>;
  // チェック済みインデックス配列（Set -> Array）
  checkedIndices: number[];
  // 正解数
  correctCount: number;
  // 不正解数
  wrongCount: number;
  // 不正解インデックスリスト
  wrongIndices: number[];
  // 現在のページ
  page: number;
  // ページあたり表示数
  pageSize?: number;
  // 最終保存日時（ISO 8601）
  savedAt: string;
}

const PROGRESS_KEY = "csa_quiz_progress";

// 進捗をlocalStorageに保存
export const saveProgress = (progress: SavedProgress): void => {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
};

// localStorageから進捗を読み込む
export const loadProgress = (): SavedProgress | null => {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedProgress;
  } catch {
    return null;
  }
};

// 進捗データをすべてクリア
export const clearProgress = (): void => {
  localStorage.removeItem(PROGRESS_KEY);
};

// 保存日時を読みやすい形式に変換
export const formatSavedAt = (iso: string): string => {
  try {
    return new Date(iso).toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};
