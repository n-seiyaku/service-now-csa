// 問題データの型定義

export interface QuizQuestion {
  // 問題テキスト
  Question: string;
  // 選択肢文字列（パイプ区切り）
  Option: string;
  // 正解文字列（パイプ区切り）
  Answer: string;
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
