import React, { useState } from 'react';
import { QuizQuestion } from '../types/quiz';
import { Shuffle, X, Check, Copy } from 'lucide-react';

interface ShuffleModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: QuizQuestion[];
  currentExamCode: string;
  onApplyShuffledQuestions: (shuffled: QuizQuestion[], newExamCode: string) => void;
}

export const ShuffleModal: React.FC<ShuffleModalProps> = ({
  isOpen,
  onClose,
  questions,
  currentExamCode,
  onApplyShuffledQuestions,
}) => {
  const [examCode, setExamCode] = useState('102');
  const [shuffleQuestionsWithinPart, setShuffleQuestionsWithinPart] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);

  if (!isOpen) return null;

  const handleShuffle = () => {
    // Clone questions
    const cloned: QuizQuestion[] = JSON.parse(JSON.stringify(questions));

    // Group by parts to maintain GDPT 2018 structure (Part 1 -> Part 2 -> Part 3 -> Part 4)
    const part1 = cloned.filter((q) => q.part === 'PART_1');
    const part2 = cloned.filter((q) => q.part === 'PART_2');
    const part3 = cloned.filter((q) => q.part === 'PART_3');
    const part4 = cloned.filter((q) => q.part === 'PART_4');

    const shuffleArray = <T,>(arr: T[]): T[] => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };

    // Shuffle questions within each part if enabled
    const finalPart1 = shuffleQuestionsWithinPart ? shuffleArray(part1) : part1;
    const finalPart2 = shuffleQuestionsWithinPart ? shuffleArray(part2) : part2;
    const finalPart3 = shuffleQuestionsWithinPart ? shuffleArray(part3) : part3;
    const finalPart4 = shuffleQuestionsWithinPart ? shuffleArray(part4) : part4;

    // Shuffle options in Part 1 if enabled
    if (shuffleOptions) {
      finalPart1.forEach((q) => {
        if (q.options && q.options.length > 0) {
          const originalCorrectKey = q.correctAnswer;
          const correctText = q.options.find((o) => o.key === originalCorrectKey)?.text;

          // Shuffle texts
          const shuffledTexts = shuffleArray(q.options.map((o) => o.text));
          const keys = ['A', 'B', 'C', 'D'];

          const newOptions = keys.map((key, i) => ({
            key,
            text: shuffledTexts[i],
          }));

          // Find where the correct text ended up
          const newCorrectKey = newOptions.find((o) => o.text === correctText)?.key || 'A';

          q.options = newOptions;
          q.correctAnswer = newCorrectKey;
        }
      });
    }

    const finalQuestions = [...finalPart1, ...finalPart2, ...finalPart3, ...finalPart4];
    onApplyShuffledQuestions(finalQuestions, examCode.trim() || '102');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Shuffle className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-base">Trộn đề thi & Đảo phương án</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Hệ thống sẽ tự động xáo trộn vị trí câu hỏi theo từng phần (Phần I, II, III, IV) và đảo thứ tự 4 phương án A, B, C, D đồng thời cập nhật chính xác bảng đáp án!
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Mã đề thi mới
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={examCode}
                onChange={(e) => setExamCode(e.target.value)}
                placeholder="Ví dụ: 102, 103, 201..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
              />
              <button
                type="button"
                onClick={() => setExamCode(String(Math.floor(100 + Math.random() * 900)))}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded-lg text-slate-700 whitespace-nowrap"
              >
                Tạo ngẫu nhiên
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Mã đề hiện tại: {currentExamCode || '101'}</p>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={shuffleQuestionsWithinPart}
                onChange={(e) => setShuffleQuestionsWithinPart(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span>Xáo trộn thứ tự các câu hỏi trong từng phần</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={shuffleOptions}
                onChange={(e) => setShuffleOptions(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span>Đảo vị trí 4 phương án A, B, C, D (Phần I)</span>
            </label>
          </div>
        </div>

        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleShuffle}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center gap-1.5"
          >
            <Shuffle className="w-3.5 h-3.5" />
            Tạo mã đề {examCode}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShuffleModal;
