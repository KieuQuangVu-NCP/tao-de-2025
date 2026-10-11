import React, { useState } from 'react';
import { QuizQuestion, ViewMode, BloomLevel } from '../types/quiz';
import QuestionCard from './QuestionCard';
import { calculateMatrixSummary, exportToWord, exportToExcel, copyQuizToClipboard } from '../utils/exportUtils';
import {
  FileText,
  FileSpreadsheet,
  Copy,
  Shuffle,
  Plus,
  Eye,
  CheckCircle,
  BarChart2,
  AlertCircle,
  Check,
  ChevronDown,
  Layers,
  BookOpen,
} from 'lucide-react';

interface QuizResultsPanelProps {
  questions: QuizQuestion[];
  examInfo: {
    title: string;
    subject: string;
    grade: string;
    examCode: string;
    durationMinutes: number;
  };
  onEditQuestion: (question: QuizQuestion) => void;
  onDeleteQuestion: (id: string) => void;
  onDuplicateQuestion: (question: QuizQuestion) => void;
  onUpdateBloom: (id: string, newBloom: BloomLevel) => void;
  onAddNewQuestion: () => void;
  onOpenShuffle: () => void;
  onUpdateTitle: (title: string) => void;
}

export const QuizResultsPanel: React.FC<QuizResultsPanelProps> = ({
  questions,
  examInfo,
  onEditQuestion,
  onDeleteQuestion,
  onDuplicateQuestion,
  onUpdateBloom,
  onAddNewQuestion,
  onOpenShuffle,
  onUpdateTitle,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('full');
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);
  const [copyDropdownOpen, setCopyDropdownOpen] = useState(false);
  const [showMatrixCard, setShowMatrixCard] = useState(true);

  const summary = calculateMatrixSummary(questions);

  // Group questions by parts for clean educational structure
  const part1Questions = questions.filter((q) => q.part === 'PART_1');
  const part2Questions = questions.filter((q) => q.part === 'PART_2');
  const part3Questions = questions.filter((q) => q.part === 'PART_3');
  const part4Questions = questions.filter((q) => q.part === 'PART_4');

  const handleCopy = async (mode: 'full' | 'questions_only' | 'answers_only') => {
    const success = await copyQuizToClipboard(questions, examInfo, mode);
    if (success) {
      const modeLabel =
        mode === 'full'
          ? 'Đã sao chép toàn bộ đề & lời giải!'
          : mode === 'questions_only'
          ? 'Đã sao chép đề bài học sinh!'
          : 'Đã sao chép bảng đáp án!';
      setCopiedStatus(modeLabel);
      setTimeout(() => setCopiedStatus(null), 3000);
    }
    setCopyDropdownOpen(false);
  };

  const handleExportWord = () => {
    exportToWord(questions, examInfo);
  };

  const handleExportExcel = () => {
    exportToExcel(questions, examInfo);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 space-y-4">
      {/* 1. Top Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Title & Exam Code */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                value={examInfo.title}
                onChange={(e) => onUpdateTitle(e.target.value)}
                className="font-extrabold text-slate-800 text-base sm:text-lg border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none bg-transparent max-w-xl transition-colors"
                title="Nhấp để sửa tiêu đề đề thi"
              />
              <span className="text-xs px-2.5 py-0.5 rounded-md font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                Mã đề: {examInfo.examCode || '101'}
              </span>
            </div>
            <div className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-2">
              <span>{examInfo.subject}</span>
              <span>•</span>
              <span>{examInfo.grade}</span>
              <span>•</span>
              <span>Thời gian: {examInfo.durationMinutes} phút</span>
              <span>•</span>
              <span className="text-emerald-600 font-semibold">{summary.totalScore} điểm</span>
            </div>
          </div>

          {/* Action Buttons: Export Word, Export Excel, Copy, Shuffle, Add */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('full')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  viewMode === 'full'
                    ? 'bg-white text-slate-800 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Hiển thị đề thi kèm đáp án và lời giải"
              >
                Đầy đủ
              </button>
              <button
                type="button"
                onClick={() => setViewMode('questions_only')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  viewMode === 'questions_only'
                    ? 'bg-white text-slate-800 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Chỉ hiển thị đề bài để phát cho học sinh"
              >
                Chỉ đề thi
              </button>
              <button
                type="button"
                onClick={() => setViewMode('answers_only')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  viewMode === 'answers_only'
                    ? 'bg-white text-slate-800 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Chỉ xem bảng đáp án"
              >
                Đáp án
              </button>
            </div>

            {/* Trộn đề button */}
            <button
              type="button"
              onClick={onOpenShuffle}
              disabled={questions.length === 0}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
              title="Tạo mã đề thi mới bằng cách đảo câu hỏi và phương án"
            >
              <Shuffle className="w-3.5 h-3.5 text-indigo-600" />
              <span>Trộn đề</span>
            </button>

            {/* Xuất Word */}
            <button
              type="button"
              onClick={handleExportWord}
              disabled={questions.length === 0}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
              title="Xuất file Word (.doc) kèm bảng ma trận và lời giải chi tiết"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Xuất Word</span>
            </button>

            {/* Xuất Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={questions.length === 0}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
              title="Xuất file Excel (.xlsx) phân tách các cột dữ liệu"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Xuất Excel</span>
            </button>

            {/* Sao chép Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setCopyDropdownOpen(!copyDropdownOpen)}
                disabled={questions.length === 0}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
                title="Sao chép đề thi vào bộ nhớ tạm"
              >
                <Copy className="w-3.5 h-3.5 text-slate-600" />
                <span>Sao chép</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {copyDropdownOpen && (
                <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 text-xs">
                  <button
                    type="button"
                    onClick={() => handleCopy('full')}
                    className="w-full px-3.5 py-2 text-left hover:bg-slate-50 text-slate-700 font-medium flex items-center justify-between"
                  >
                    <span>Toàn bộ đề thi + Lời giải</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy('questions_only')}
                    className="w-full px-3.5 py-2 text-left hover:bg-slate-50 text-slate-700 font-medium flex items-center justify-between"
                  >
                    <span>Chỉ đề thi (Học sinh)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy('answers_only')}
                    className="w-full px-3.5 py-2 text-left hover:bg-slate-50 text-slate-700 font-medium flex items-center justify-between"
                  >
                    <span>Chỉ bảng đáp án (Key)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Thêm câu hỏi thủ công */}
            <button
              type="button"
              onClick={onAddNewQuestion}
              className="p-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors"
              title="Thêm câu hỏi mới thủ công"
            >
              <Plus className="w-4 h-4 text-blue-600" />
            </button>
          </div>
        </div>

        {/* Toast Alert for copy */}
        {copiedStatus && (
          <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{copiedStatus}</span>
          </div>
        )}
      </div>

      {/* 2. Educational Matrix Summary Card */}
      {questions.length > 0 && showMatrixCard && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Ma trận đề thi chuẩn GDPT 2018
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Tổng số: <b>{summary.totalQuestions} câu</b> ({summary.totalScore} điểm)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            {/* Nhận biết */}
            <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-100 flex flex-col justify-between">
              <div className="flex items-center justify-between text-sky-800 font-bold">
                <span>Nhận biết</span>
                <span className="text-sm font-extrabold">{summary.bloomCounts['Nhận biết']}</span>
              </div>
              <div className="text-[11px] text-sky-600 mt-1">
                {((summary.bloomCounts['Nhận biết'] / (summary.totalQuestions || 1)) * 100).toFixed(0)}% đề thi
              </div>
            </div>

            {/* Thông hiểu */}
            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-800 font-bold">
                <span>Thông hiểu</span>
                <span className="text-sm font-extrabold">{summary.bloomCounts['Thông hiểu']}</span>
              </div>
              <div className="text-[11px] text-emerald-600 mt-1">
                {((summary.bloomCounts['Thông hiểu'] / (summary.totalQuestions || 1)) * 100).toFixed(0)}% đề thi
              </div>
            </div>

            {/* Vận dụng */}
            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100 flex flex-col justify-between">
              <div className="flex items-center justify-between text-amber-800 font-bold">
                <span>Vận dụng</span>
                <span className="text-sm font-extrabold">{summary.bloomCounts['Vận dụng']}</span>
              </div>
              <div className="text-[11px] text-amber-600 mt-1">
                {((summary.bloomCounts['Vận dụng'] / (summary.totalQuestions || 1)) * 100).toFixed(0)}% đề thi
              </div>
            </div>

            {/* Vận dụng cao */}
            <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100 flex flex-col justify-between">
              <div className="flex items-center justify-between text-purple-800 font-bold">
                <span>Vận dụng cao</span>
                <span className="text-sm font-extrabold">{summary.bloomCounts['Vận dụng cao']}</span>
              </div>
              <div className="text-[11px] text-purple-600 mt-1">
                {((summary.bloomCounts['Vận dụng cao'] / (summary.totalQuestions || 1)) * 100).toFixed(0)}% đề thi
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Questions Container */}
      {questions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">Chưa có câu hỏi nào</h3>
          <p className="text-slate-500 text-xs max-w-md leading-relaxed">
            Hãy chọn môn học, số lượng câu hỏi và nhấn nút <b>"Sinh câu hỏi"</b> ở cột bên trái để AI tự động tạo đề thi chuẩn cấu trúc GDPT 2018!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* PHẦN I: Trắc nghiệm 1 lựa chọn */}
          {part1Questions.length > 0 && (
            <div className="space-y-3">
              <div className="bg-slate-100/80 px-4 py-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div className="font-bold text-slate-800 text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>PHẦN I: Câu hỏi trắc nghiệm nhiều phương án lựa chọn</span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                  {part1Questions.length} câu (0.25đ/câu)
                </span>
              </div>

              <div className="space-y-3">
                {part1Questions.map((q, idx) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    index={questions.findIndex((item) => item.id === q.id)}
                    viewMode={viewMode}
                    onEdit={onEditQuestion}
                    onDelete={onDeleteQuestion}
                    onDuplicate={onDuplicateQuestion}
                    onUpdateBloom={onUpdateBloom}
                  />
                ))}
              </div>
            </div>
          )}

          {/* PHẦN II: Đúng / Sai */}
          {part2Questions.length > 0 && (
            <div className="space-y-3">
              <div className="bg-slate-100/80 px-4 py-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div className="font-bold text-slate-800 text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span>PHẦN II: Câu hỏi trắc nghiệm Đúng / Sai (4 mệnh đề a, b, c, d)</span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                  {part2Questions.length} câu (1.0đ/câu)
                </span>
              </div>

              <div className="space-y-3">
                {part2Questions.map((q) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    index={questions.findIndex((item) => item.id === q.id)}
                    viewMode={viewMode}
                    onEdit={onEditQuestion}
                    onDelete={onDeleteQuestion}
                    onDuplicate={onDuplicateQuestion}
                    onUpdateBloom={onUpdateBloom}
                  />
                ))}
              </div>
            </div>
          )}

          {/* PHẦN III: Trả lời ngắn */}
          {part3Questions.length > 0 && (
            <div className="space-y-3">
              <div className="bg-slate-100/80 px-4 py-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div className="font-bold text-slate-800 text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-600" />
                  <span>PHẦN III: Câu hỏi trắc nghiệm trả lời ngắn (Điền đáp số)</span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                  {part3Questions.length} câu
                </span>
              </div>

              <div className="space-y-3">
                {part3Questions.map((q) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    index={questions.findIndex((item) => item.id === q.id)}
                    viewMode={viewMode}
                    onEdit={onEditQuestion}
                    onDelete={onDeleteQuestion}
                    onDuplicate={onDuplicateQuestion}
                    onUpdateBloom={onUpdateBloom}
                  />
                ))}
              </div>
            </div>
          )}

          {/* PHẦN IV: Tự luận */}
          {part4Questions.length > 0 && (
            <div className="space-y-3">
              <div className="bg-slate-100/80 px-4 py-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div className="font-bold text-slate-800 text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-600" />
                  <span>PHẦN IV: Câu hỏi tự luận & Barem điểm</span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                  {part4Questions.length} câu
                </span>
              </div>

              <div className="space-y-3">
                {part4Questions.map((q) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    index={questions.findIndex((item) => item.id === q.id)}
                    viewMode={viewMode}
                    onEdit={onEditQuestion}
                    onDelete={onDeleteQuestion}
                    onDuplicate={onDuplicateQuestion}
                    onUpdateBloom={onUpdateBloom}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizResultsPanel;
