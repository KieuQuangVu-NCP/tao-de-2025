/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { QuizConfig, QuizQuestion, BloomLevel, GradeLevel } from './types/quiz';
import { INITIAL_SAMPLE_QUESTIONS } from './utils/sampleData';
import QuizConfigSidebar from './components/QuizConfigSidebar';
import QuizResultsPanel from './components/QuizResultsPanel';
import EditQuestionModal from './components/EditQuestionModal';
import ShuffleModal from './components/ShuffleModal';
import {
  Sparkles,
  GraduationCap,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  BookOpenCheck,
} from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<QuizConfig>({
    gradeLevel: 'THPT',
    grade: 'Lớp 12',
    subject: 'Vật lý',
    language: 'vi',
    questionCounts: {
      multipleChoice: 4,
      trueFalse: 2,
      shortAnswer: 2,
      essay: 1,
    },
    bloomLevels: ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'],
    topicTitle: 'Dao động cơ học và sóng cơ',
    sourceText: '',
    fileAttachments: [],
    customPrompt: '',
  });

  const [questions, setQuestions] = useState<QuizQuestion[]>(INITIAL_SAMPLE_QUESTIONS);
  const [examInfo, setExamInfo] = useState({
    title: 'ĐỀ KIỂM TRA ĐÁNH GIÁ ĐỊNH KỲ - MÔN VẬT LÝ LỚP 12',
    subject: 'Vật lý',
    grade: 'Lớp 12',
    examCode: '101',
    durationMinutes: 50,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals state
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isShuffleModalOpen, setIsShuffleModalOpen] = useState(false);

  // Generate Questions via Server API
  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gradeLevel: config.gradeLevel,
          grade: config.grade,
          subject: config.subject,
          language: config.language,
          questionCounts: config.questionCounts,
          bloomLevels: config.bloomLevels,
          topicTitle: config.topicTitle,
          sourceText: config.sourceText,
          fileAttachments: config.fileAttachments.map((f) => ({
            fileName: f.fileName,
            category: f.category,
            categoryLabel: f.categoryLabel,
            mimeType: f.mimeType,
            base64: f.base64,
            extractedText: f.extractedText,
          })),
          customPrompt: config.customPrompt,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Có lỗi xảy ra trong quá trình sinh đề thi.');
      }

      setQuestions(data.questions || []);
      setExamInfo({
        title: data.examTitle || `ĐỀ KIỂM TRA MÔN ${config.subject.toUpperCase()} - ${config.grade.toUpperCase()}`,
        subject: config.subject,
        grade: config.grade,
        examCode: '101',
        durationMinutes: data.durationMinutes || 45,
      });

      setSuccessMessage(`Đã sinh thành công ${data.questions?.length || 0} câu hỏi chuẩn GDPT 2018!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Quiz generation error:', err);
      setErrorMessage(err.message || 'Không thể tạo câu hỏi. Vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Edit Question
  const handleOpenEdit = (q: QuizQuestion) => {
    setEditingQuestion(q);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (updated: QuizQuestion) => {
    setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
  };

  // Delete Question
  const handleDeleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  // Duplicate Question
  const handleDuplicateQuestion = (q: QuizQuestion) => {
    const newQuestion: QuizQuestion = {
      ...JSON.parse(JSON.stringify(q)),
      id: `q_${Date.now()}_copy`,
    };
    const index = questions.findIndex((item) => item.id === q.id);
    if (index >= 0) {
      const updated = [...questions];
      updated.splice(index + 1, 0, newQuestion);
      setQuestions(updated);
    } else {
      setQuestions([...questions, newQuestion]);
    }
  };

  // Update Bloom
  const handleUpdateBloom = (id: string, newBloom: BloomLevel) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, bloomLevel: newBloom } : q))
    );
  };

  // Add new blank question
  const handleAddNewQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: `q_${Date.now()}`,
      part: 'PART_1',
      type: 'multiple_choice',
      bloomLevel: 'Thông hiểu',
      content: 'Nhập nội dung câu hỏi mới tại đây...',
      options: [
        { key: 'A', text: 'Phương án A' },
        { key: 'B', text: 'Phương án B' },
        { key: 'C', text: 'Phương án C' },
        { key: 'D', text: 'Phương án D' },
      ],
      correctAnswer: 'A',
      explanation: 'Hướng dẫn giải chi tiết cho câu hỏi này.',
      score: 0.25,
    };
    setQuestions([...questions, newQuestion]);
    setEditingQuestion(newQuestion);
    setIsEditModalOpen(true);
  };

  // Apply shuffled questions
  const handleApplyShuffledQuestions = (shuffled: QuizQuestion[], newExamCode: string) => {
    setQuestions(shuffled);
    setExamInfo((prev) => ({ ...prev, examCode: newExamCode }));
    setSuccessMessage(`Đã tạo thành công đề thi mã ${newExamCode}!`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Reset to initial sample questions
  const handleResetSample = () => {
    setQuestions(INITIAL_SAMPLE_QUESTIONS);
    setExamInfo({
      title: 'ĐỀ KIỂM TRA ĐÁNH GIÁ ĐỊNH KỲ - MÔN VẬT LÝ LỚP 12',
      subject: 'Vật lý',
      grade: 'Lớp 12',
      examCode: '101',
      durationMinutes: 50,
    });
    setSuccessMessage('Đã tải lại bộ câu hỏi mẫu!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 1. Header Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <BookOpenCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">
                  AI - TẠO TRẮC NGHIỆM GDPT 2018
                </h1>
                <span className="hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                  Chuẩn BGD&ĐT 2025
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Hỗ trợ trắc nghiệm 4 lựa chọn, Đúng/Sai 4 ý, Trả lời ngắn, Tự luận & LaTeX
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetSample}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-600 font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Khôi phục lại bộ câu hỏi mẫu chuẩn"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Bộ đề mẫu</span>
            </button>

            <div className="text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              {questions.length} câu hỏi
            </div>
          </div>
        </div>
      </header>

      {/* 2. Notification Banners */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-3">
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-600 hover:text-rose-800 font-bold"
            >
              ×
            </button>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-600 hover:text-emerald-800 font-bold"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* 3. Main Application Workspace: Two-column layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col lg:flex-row items-start gap-6">
          {/* Left Column: Quiz Configuration Sidebar */}
          <QuizConfigSidebar
            config={config}
            onChangeConfig={setConfig}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />

          {/* Right Column: Quiz Results & Examination Studio */}
          <QuizResultsPanel
            questions={questions}
            examInfo={examInfo}
            onEditQuestion={handleOpenEdit}
            onDeleteQuestion={handleDeleteQuestion}
            onDuplicateQuestion={handleDuplicateQuestion}
            onUpdateBloom={handleUpdateBloom}
            onAddNewQuestion={handleAddNewQuestion}
            onOpenShuffle={() => setIsShuffleModalOpen(true)}
            onUpdateTitle={(title) => setExamInfo((prev) => ({ ...prev, title }))}
          />
        </div>
      </main>

      {/* 4. Edit Question Modal */}
      <EditQuestionModal
        question={editingQuestion}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingQuestion(null);
        }}
        onSave={handleSaveEdit}
      />

      {/* 5. Exam Shuffle Modal */}
      <ShuffleModal
        isOpen={isShuffleModalOpen}
        onClose={() => setIsShuffleModalOpen(false)}
        questions={questions}
        currentExamCode={examInfo.examCode}
        onApplyShuffledQuestions={handleApplyShuffledQuestions}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AI - TẠO TRẮC NGHIỆM GDPT 2018 © 2025 • Chuẩn cấu trúc đề thi Bộ Giáo dục và Đào tạo</span>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Phần I: 4 lựa chọn</span>
            <span>•</span>
            <span>Phần II: Đúng / Sai</span>
            <span>•</span>
            <span>Phần III: Trả lời ngắn</span>
            <span>•</span>
            <span>Phần IV: Tự luận</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
