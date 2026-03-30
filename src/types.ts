// 問題データの型定義

export interface QuizQuestion {
  // 設問タイプ: "multiple-choice" or "multi-select"
  assessment_type: "multiple-choice" | "multi-select";
  // プロンプトオブジェクト
  prompt: {
    // 問題テキスト（HTMLタグを含む場合あり）
    question: string;
    // 各選択肢へのフィードバック（インデックス順）
    feedbacks: string[];
    // 選択肢テキスト配列
    answers: string[];
  };
  // 正解ラベル配列（"a", "b", "c"...）
  correct_response: string[];
  // プレーンテキスト版の問題文
  question_plain: string;
}

export interface QuizState {
  // 現在の問題インデックス
  currentIndex: number;
  // ユーザーが選択した回答（question index -> option labels）
  userAnswers: Record<number, string[]>;
  // チェック済みの問題インデックスセット
  checkedQuestions: Set<number>;
  // 正解数
  correctCount: number;
  // 不正解数
  wrongCount: number;
  // 不正解問題のインデックスリスト
  wrongIndices: number[];
}

export interface ScorePanelProps {
  correctCount: number;
  wrongCount: number;
  total: number;
  checkedCount: number;
  wrongIndices: number[];
  onExportWrong: () => void;
  onJumpToQuestion: (index: number) => void;
  // 復習ページへの遷移コールバック
  onReview: () => void;
}
