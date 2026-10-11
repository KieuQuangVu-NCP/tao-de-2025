import React, { useState, useEffect } from 'react';
import { QuizQuestion, BloomLevel, QuestionPart } from '../types/quiz';
import { X, Save, Plus, Trash2, Check, Sparkles } from 'lucide-react';
import MathRenderer from './MathRenderer';

interface EditQuestionModalProps {
  question: QuizQuestion | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedQuestion: QuizQuestion) => void;
}

export const EditQuestionModal: React.FC<EditQuestionModalProps> = ({
  question,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<QuizQuestion | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  useEffect(() => {
    if (question) {
      setFormData(JSON.parse(JSON.stringify(question)));
    }
  }, [question]);

  if (!isOpen || !formData) return null;

  const handleBloomChange = (level: BloomLevel) => {
    setFormData((prev) => (prev ? { ...prev, bloomLevel: level } : null));
  };

  const handleOptionTextChange = (key: string, text: string) => {
    setFormData((prev) => {
      if (!prev || !prev.options) return prev;
      return {
        ...prev,
        options: prev.options.map((opt) => (opt.key === key ? { ...opt, text } : opt)),
      };
    });
  };

  const handleSubQuestionChange = (key: string, statement: string, isCorrect: boolean, explanation = '') => {
    setFormData((prev) => {
      if (!prev || !prev.subQuestions) return prev;
      return {
        ...prev,
        subQuestions: prev.subQuestions.map((sq) =>
          sq.key === key ? { ...sq, statement, isCorrect, explanation } : sq
        ),
      };
    });
  };

  const handleSave = () => {
    if (formData) {
      onSave(formData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-900 text-lg">Biên tập câu hỏi</span>
            <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeTab === 'edit'
                    ? 'bg-white text-slate-800 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Chỉnh sửa
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeTab === 'preview'
                    ? 'bg-white text-slate-800 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Xem trước LaTeX
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'preview' ? (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Xem trước giao diện hiển thị:
              </div>
              <div className="p-4 bg-white rounded-lg border border-slate-200 text-slate-800 leading-relaxed font-medium">
                <MathRenderer content={formData.content} />
              </div>

              {formData.part === 'PART_1' && formData.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  {formData.options.map((opt) => (
                    <div
                      key={opt.key}
                      className={`p-3 rounded-lg border text-sm flex items-start gap-2 ${
                        formData.correctAnswer === opt.key
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <span className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center font-bold text-xs">
                        {opt.key}
                      </span>
                      <MathRenderer content={opt.text} />
                    </div>
                  ))}
                </div>
              )}

              {formData.part === 'PART_2' && formData.subQuestions && (
                <div className="space-y-2 pt-2">
                  {formData.subQuestions.map((sq) => (
                    <div
                      key={sq.key}
                      className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{sq.key})</span>
                        <MathRenderer content={sq.statement} />
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded font-bold ${
                          sq.isCorrect
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {sq.isCorrect ? 'ĐÚNG' : 'SAI'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2">
                <div className="text-xs font-bold text-slate-500 mb-1">Hướng dẫn giải:</div>
                <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed">
                  <MathRenderer content={formData.explanation} asBlock />
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Top Row: Bloom Level & Score */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mức độ nhận thức (Bloom)
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'] as BloomLevel[]).map(
                      (level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => handleBloomChange(level)}
                          className={`text-xs py-2 px-2.5 rounded-lg border font-medium transition-all text-center ${
                            formData.bloomLevel === level
                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-semibold'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {level}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Điểm số của câu
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formData.score}
                    onChange={(e) =>
                      setFormData({ ...formData, score: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Chuẩn GDPT 2018: TN 1 lựa chọn: 0.25đ | Đúng/Sai: 1.0đ | Trả lời ngắn: 0.25đ-0.5đ
                  </p>
                </div>
              </div>

              {/* Question Content */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Nội dung câu hỏi / Đề bài
                  </label>
                  <span className="text-[11px] text-slate-400">Hỗ trợ LaTeX: $...$ hoặc $$...$$</span>
                </div>
                <textarea
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Nhập nội dung câu hỏi (sử dụng $E = mc^2$ để viết công thức)..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-normal leading-relaxed"
                />
              </div>

              {/* Options for PART_1 */}
              {formData.part === 'PART_1' && formData.options && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Các phương án lựa chọn & Đáp án đúng (Chọn nút tròn để chỉ định đáp án đúng)
                  </label>
                  <div className="space-y-2">
                    {formData.options.map((opt) => {
                      const isCorrect = formData.correctAnswer === opt.key;
                      return (
                        <div key={opt.key} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, correctAnswer: opt.key })}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                              isCorrect
                                ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-300'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                            title={isCorrect ? 'Đáp án đúng' : 'Nhấp để chọn làm đáp án đúng'}
                          >
                            {opt.key}
                          </button>
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => handleOptionTextChange(opt.key, e.target.value)}
                            className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={`Phương án ${opt.key}...`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sub-questions for PART_2 (True/False) */}
              {formData.part === 'PART_2' && formData.subQuestions && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    4 Mệnh đề Đúng / Sai (Bộ GD&ĐT chuẩn 4 ý a, b, c, d)
                  </label>
                  <div className="space-y-2.5">
                    {formData.subQuestions.map((sq) => (
                      <div
                        key={sq.key}
                        className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 w-6 text-sm">{sq.key})</span>
                          <input
                            type="text"
                            value={sq.statement}
                            onChange={(e) =>
                              handleSubQuestionChange(
                                sq.key,
                                e.target.value,
                                sq.isCorrect,
                                sq.explanation
                              )
                            }
                            className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={`Nội dung mệnh đề ${sq.key}...`}
                          />
                          <div className="flex gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                handleSubQuestionChange(sq.key, sq.statement, true, sq.explanation)
                              }
                              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                                sq.isCorrect
                                  ? 'bg-emerald-600 text-white shadow-2xs'
                                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              Đúng
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleSubQuestionChange(sq.key, sq.statement, false, sq.explanation)
                              }
                              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                                !sq.isCorrect
                                  ? 'bg-rose-600 text-white shadow-2xs'
                                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              Sai
                            </button>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={sq.explanation || ''}
                          onChange={(e) =>
                            handleSubQuestionChange(
                              sq.key,
                              sq.statement,
                              sq.isCorrect,
                              e.target.value
                            )
                          }
                          placeholder="Lý do đúng/sai cho mệnh đề này (tùy chọn)..."
                          className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Short Answer (PART_3) */}
              {formData.part === 'PART_3' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Đáp số chuẩn (Học sinh điền)
                  </label>
                  <input
                    type="text"
                    value={formData.correctAnswer || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, correctAnswer: e.target.value })
                    }
                    placeholder="Ví dụ: 12,5 hoặc 40 hoặc H2SO4..."
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-emerald-800"
                  />
                </div>
              )}

              {/* Essay Sample Answer (PART_4) */}
              {formData.part === 'PART_4' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Định hướng bài giải mẫu tóm tắt
                  </label>
                  <textarea
                    rows={3}
                    value={formData.correctAnswer || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, correctAnswer: e.target.value })
                    }
                    placeholder="Tóm tắt đáp số chính của các câu hỏi thành phần..."
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-normal"
                  />
                </div>
              )}

              {/* Explanation & Rubric */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Hướng dẫn giải chi tiết & Barem chấm
                </label>
                <textarea
                  rows={4}
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  placeholder="Giải thích từng bước, công thức áp dụng và suy luận..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-normal leading-relaxed"
                />
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditQuestionModal;
