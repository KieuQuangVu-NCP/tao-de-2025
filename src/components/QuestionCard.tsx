import React, { useState } from 'react';
import { QuizQuestion, ViewMode, BloomLevel } from '../types/quiz';
import MathRenderer from './MathRenderer';
import {
  Edit3,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface QuestionCardProps {
  question: QuizQuestion;
  index: number;
  viewMode: ViewMode;
  onEdit: (question: QuizQuestion) => void;
  onDelete: (id: string) => void;
  onDuplicate: (question: QuizQuestion) => void;
  onUpdateBloom: (id: string, newBloom: BloomLevel) => void;
}

const BLOOM_BADGES: Record<
  BloomLevel,
  { label: string; bg: string; text: string; border: string }
> = {
  'Nhận biết': {
    label: 'Nhận biết',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
  },
  'Thông hiểu': {
    label: 'Thông hiểu',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  'Vận dụng': {
    label: 'Vận dụng',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  'Vận dụng cao': {
    label: 'Vận dụng cao',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
};

const PART_LABELS: Record<string, { name: string; tag: string }> = {
  PART_1: { name: 'Phần I: Trắc nghiệm 1 lựa chọn', tag: 'Nhiều lựa chọn' },
  PART_2: { name: 'Phần II: Đúng / Sai (4 mệnh đề)', tag: 'Đúng / Sai' },
  PART_3: { name: 'Phần III: Trả lời ngắn', tag: 'Trả lời ngắn' },
  PART_4: { name: 'Phần IV: Câu hỏi tự luận', tag: 'Tự luận' },
};

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  viewMode,
  onEdit,
  onDelete,
  onDuplicate,
  onUpdateBloom,
}) => {
  const [showExplanation, setShowExplanation] = useState(true);

  const bloomStyle = BLOOM_BADGES[question.bloomLevel] || BLOOM_BADGES['Thông hiểu'];
  const showAnswers = viewMode === 'full' || viewMode === 'answers_only';

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden group">
      {/* Header bar */}
      <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-800 bg-white px-2.5 py-0.5 rounded-md border border-slate-200 text-sm shadow-2xs">
            Câu {index + 1}
          </span>

          <span className="text-xs px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-700 font-medium">
            {PART_LABELS[question.part]?.tag || question.part}
          </span>

          {/* Bloom Badge with selector dropdown */}
          <div className="relative inline-block">
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${bloomStyle.bg} ${bloomStyle.text} ${bloomStyle.border} flex items-center gap-1`}
            >
              <span>●</span> {question.bloomLevel}
            </span>
          </div>

          <span className="text-xs text-slate-500 font-medium">
            ({question.score} điểm)
          </span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onDuplicate(question)}
            title="Nhân bản câu hỏi"
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(question)}
            title="Chỉnh sửa câu hỏi"
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(question.id)}
            title="Xóa câu hỏi"
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Question Statement */}
        <div className="text-slate-800 font-medium text-[15px] leading-relaxed">
          <MathRenderer content={question.content} />
        </div>

        {/* Options for PART_1 (Multiple Choice) */}
        {question.part === 'PART_1' && question.options && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {question.options.map((opt) => {
              const isCorrect = question.correctAnswer === opt.key;
              const isHighlight = showAnswers && isCorrect;

              return (
                <div
                  key={opt.key}
                  className={`flex items-start gap-2.5 p-3 rounded-lg border text-sm transition-all ${
                    isHighlight
                      ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-medium ring-1 ring-emerald-300/60 shadow-2xs'
                      : 'bg-slate-50/60 hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-md font-bold text-xs shrink-0 ${
                      isHighlight
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-slate-300 text-slate-700'
                    }`}
                  >
                    {opt.key}
                  </span>
                  <div className="flex-1 pt-0.5">
                    <MathRenderer content={opt.text} />
                  </div>
                  {isHighlight && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Statements for PART_2 (True/False 4 sub-questions) */}
        {question.part === 'PART_2' && question.subQuestions && (
          <div className="space-y-2 pt-1">
            {question.subQuestions.map((sub) => (
              <div
                key={sub.key}
                className={`p-3 rounded-lg border text-sm transition-all ${
                  showAnswers
                    ? sub.isCorrect
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-rose-50/50 border-rose-200'
                    : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 flex-1">
                    <span className="font-bold text-slate-800 shrink-0">
                      {sub.key})
                    </span>
                    <div className="text-slate-700 flex-1">
                      <MathRenderer content={sub.statement} />
                    </div>
                  </div>

                  {showAnswers && (
                    <span
                      className={`text-xs px-2.5 py-1 rounded-md font-bold uppercase shrink-0 flex items-center gap-1 ${
                        sub.isCorrect
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-rose-600 text-white shadow-2xs'
                      }`}
                    >
                      {sub.isCorrect ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đúng
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" /> Sai
                        </>
                      )}
                    </span>
                  )}
                </div>

                {showAnswers && sub.explanation && (
                  <div className="mt-1.5 text-xs text-slate-500 pl-5 border-t border-slate-200/50 pt-1.5">
                    <span className="font-semibold text-slate-600">Lý do: </span>
                    <MathRenderer content={sub.explanation} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Short Answer (PART_3) */}
        {question.part === 'PART_3' && (
          <div className="pt-1">
            {showAnswers ? (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded">
                  Đáp số chuẩn:
                </span>
                <span className="text-base font-bold text-emerald-950">
                  <MathRenderer content={question.correctAnswer || '---'} />
                </span>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-slate-400 text-xs italic">
                (Thí sinh ghi đáp số ngắn vào ô tương ứng trên phiếu trả lời)
              </div>
            )}
          </div>
        )}

        {/* Essay (PART_4) */}
        {question.part === 'PART_4' && (
          <div className="pt-1">
            {showAnswers && question.correctAnswer && (
              <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-lg text-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-800 block mb-1">
                  Định hướng bài giải mẫu:
                </span>
                <div className="text-indigo-950 leading-relaxed">
                  <MathRenderer content={question.correctAnswer} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detailed Explanation / Solution Box */}
        {showAnswers && question.explanation && (
          <div className="pt-2">
            <div className="bg-slate-50/90 rounded-lg border border-slate-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowExplanation(!showExplanation)}
                className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 flex items-center justify-between hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-1.5 text-indigo-700">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Hướng dẫn giải chi tiết & Barem chấm</span>
                </div>
                {showExplanation ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>

              {showExplanation && (
                <div className="p-3.5 border-t border-slate-200 text-xs text-slate-700 leading-relaxed bg-white">
                  <MathRenderer content={question.explanation} asBlock />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionCard;
