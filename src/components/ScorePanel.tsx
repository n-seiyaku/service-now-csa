import React from 'react';
import type { ScorePanelProps } from '../types';

// スコアパネルコンポーネント
export const ScorePanel: React.FC<ScorePanelProps> = ({
  correctCount,
  wrongCount,
  total,
  checkedCount,
  wrongIndices,
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
          background: 'linear-gradient(135deg, #1e2130 0%, #252840 100%)',
          border: '1px solid #2e3248',
          borderRadius: '16px',
          padding: '24px',
        }}
      >
        <h2
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '20px',
          }}
        >
          Score Board
        </h2>

        {/* 正解数 */}
        <div className="flex items-center justify-between mb-3">
          <span style={{ color: '#94a3b8', fontSize: '14px' }}>Correct</span>
          <span
            style={{
              color: '#22c55e',
              fontSize: '24px',
              fontWeight: 700,
              fontFamily: 'monospace',
            }}
          >
            {correctCount}
          </span>
        </div>

        {/* 不正解数 */}
        <div className="flex items-center justify-between mb-3">
          <span style={{ color: '#94a3b8', fontSize: '14px' }}>Wrong</span>
          <span
            style={{
              color: '#ef4444',
              fontSize: '24px',
              fontWeight: 700,
              fontFamily: 'monospace',
            }}
          >
            {wrongCount}
          </span>
        </div>

        {/* チェック済み / 全体 */}
        <div className="flex items-center justify-between mb-4">
          <span style={{ color: '#94a3b8', fontSize: '14px' }}>Answered</span>
          <span
            style={{
              color: '#e2e8f0',
              fontSize: '18px',
              fontWeight: 600,
              fontFamily: 'monospace',
            }}
          >
            {checkedCount} / {total}
          </span>
        </div>

        {/* 精度バー */}
        <div>
          <div className="flex justify-between mb-1">
            <span style={{ color: '#94a3b8', fontSize: '12px' }}>Accuracy</span>
            <span
              style={{
                color: accuracy >= 70 ? '#22c55e' : accuracy >= 50 ? '#f59e0b' : '#ef4444',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              {accuracy}%
            </span>
          </div>
          <div
            style={{
              background: '#1a1d27',
              borderRadius: '9999px',
              height: '8px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${accuracy}%`,
                height: '100%',
                background:
                  accuracy >= 70
                    ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                    : accuracy >= 50
                    ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                    : 'linear-gradient(90deg, #ef4444, #dc2626)',
                borderRadius: '9999px',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* 任意の質問へジャンプ */}
      <div
        style={{
          background: '#1e2130',
          border: '1px solid #2e3248',
          borderRadius: '16px',
          padding: '16px',
        }}
      >
        <label
          htmlFor="jump-input"
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '12px',
            display: 'block',
          }}
        >
          Jump to Question
        </label>
        <div className="flex gap-2">
          <input
            id="jump-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder={`1 - ${total}`}
            style={{
              flex: 1,
              background: '#1a1d27',
              border: '1px solid #3e4260',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#fff',
              outline: 'none',
              fontSize: '14px',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = parseInt(e.currentTarget.value, 10);
                if (!isNaN(val) && val >= 1 && val <= total) {
                  onJumpToQuestion(val - 1);
                  e.currentTarget.value = '';
                }
              }
            }}
          />
          <button
            onClick={(e) => {
              const input = e.currentTarget.previousSibling as HTMLInputElement;
              const val = parseInt(input.value, 10);
              if (!isNaN(val) && val >= 1 && val <= total) {
                onJumpToQuestion(val - 1);
                input.value = '';
              }
            }}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none',
              borderRadius: '8px',
              padding: '0 16px',
              color: '#fff',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.opacity = '1';
            }}
          >
            Go
          </button>
        </div>
      </div>

      {/* 復習ボタン */}
      {wrongIndices.length > 0 && (
        <button
          onClick={onReview}
          style={{
            background: 'linear-gradient(135deg, #ef4444, #f97316)',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 16px',
            color: '#fff',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'opacity 0.2s, transform 0.1s',
            width: '100%',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = '0.9';
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = '1';
            (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
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
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 16px',
            color: '#fff',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'opacity 0.2s, transform 0.1s',
            width: '100%',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.opacity = '0.9';
            (e.target as HTMLElement).style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.opacity = '1';
            (e.target as HTMLElement).style.transform = 'translateY(0)';
          }}
        >
          Export Wrong ({wrongIndices.length})
        </button>
      )}

      {/* 不正解問題リスト */}
      {wrongIndices.length > 0 && (
        <div
          style={{
            background: '#1e2130',
            border: '1px solid #2e3248',
            borderRadius: '16px',
            padding: '16px',
            maxHeight: '300px',
            overflowY: 'auto',
          }}
        >
          <h3
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '12px',
            }}
          >
            Wrong Questions
          </h3>
          <div className="flex flex-wrap gap-2">
            {wrongIndices.map((idx) => (
              <button
                key={idx}
                onClick={() => onJumpToQuestion(idx)}
                title={`Jump to Question ${idx + 1}`}
                style={{
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.4)',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  color: '#ef4444',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.background = 'rgba(239,68,68,0.3)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.background = 'rgba(239,68,68,0.15)';
                }}
              >
                Q{idx + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
