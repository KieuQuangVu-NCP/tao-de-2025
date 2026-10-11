import React, { useState, useRef } from 'react';
import {
  GradeLevel,
  BloomLevel,
  QuizConfig,
  UploadedFileItem,
  FileCategory,
} from '../types/quiz';
import { SUBJECT_PRESETS } from '../utils/sampleData';
import {
  FILE_CATEGORIES,
  detectFileCategory,
  SAMPLE_MULTI_FILES,
} from '../utils/fileCategoryUtils';
import {
  BookOpen,
  GraduationCap,
  Sparkles,
  UploadCloud,
  FileText,
  FileSpreadsheet,
  X,
  Languages,
  Layers,
  ChevronDown,
  Sliders,
  CheckSquare,
  Square,
  Paperclip,
  CheckCircle2,
  Trash2,
  FolderOpen,
  FileCheck2,
  HelpCircle,
} from 'lucide-react';

interface QuizConfigSidebarProps {
  config: QuizConfig;
  onChangeConfig: (newConfig: QuizConfig) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const GRADES_BY_LEVEL: Record<GradeLevel, string[]> = {
  THPT: ['Lớp 12', 'Lớp 11', 'Lớp 10'],
  THCS: ['Lớp 9', 'Lớp 8', 'Lớp 7', 'Lớp 6'],
};

const SUBJECTS_BY_LEVEL: Record<GradeLevel, string[]> = {
  THPT: [
    'Vật lý',
    'Toán học',
    'Hóa học',
    'Sinh học',
    'Lịch sử',
    'Địa lí',
    'Giáo dục kinh tế và pháp luật',
    'Tin học',
    'Tiếng Anh',
    'Ngữ văn',
    'Công nghệ',
  ],
  THCS: [
    'Khoa học tự nhiên',
    'Toán học',
    'Lịch sử và Địa lí',
    'Ngữ văn',
    'Tin học',
    'Tiếng Anh',
    'Giáo dục công dân',
    'Công nghệ',
  ],
};

const BLOOM_ALL: { id: BloomLevel; label: string; desc: string; color: string }[] = [
  { id: 'Nhận biết', label: 'Nhận biết', desc: 'Tái hiện kiến thức, định nghĩa, công thức', color: 'text-sky-700 bg-sky-50 border-sky-200' },
  { id: 'Thông hiểu', label: 'Thông hiểu', desc: 'Giải thích, phân biệt, suy luận trực tiếp', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { id: 'Vận dụng', label: 'Vận dụng thấp', desc: 'Áp dụng vào tình huống quen thuộc', color: 'text-amber-800 bg-amber-50 border-amber-200' },
  { id: 'Vận dụng cao', label: 'Vận dụng cao', desc: 'Bài toán thực tế, liên môn, tư duy sâu', color: 'text-purple-700 bg-purple-50 border-purple-200' },
];

export const QuizConfigSidebar: React.FC<QuizConfigSidebarProps> = ({
  config,
  onChangeConfig,
  onGenerate,
  isGenerating,
}) => {
  const [activeInputTab, setActiveInputTab] = useState<'files' | 'paste'>('files');
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalQuestions =
    config.questionCounts.multipleChoice +
    config.questionCounts.trueFalse +
    config.questionCounts.shortAnswer +
    config.questionCounts.essay;

  const handleGradeLevelChange = (level: GradeLevel) => {
    const defaultGrade = level === 'THPT' ? 'Lớp 12' : 'Lớp 9';
    const defaultSubject = level === 'THPT' ? 'Vật lý' : 'Khoa học tự nhiên';
    onChangeConfig({
      ...config,
      gradeLevel: level,
      grade: defaultGrade,
      subject: defaultSubject,
    });
  };

  const handleBloomToggle = (level: BloomLevel) => {
    const exists = config.bloomLevels.includes(level);
    let updated: BloomLevel[];
    if (exists) {
      if (config.bloomLevels.length === 1) return;
      updated = config.bloomLevels.filter((b) => b !== level);
    } else {
      updated = [...config.bloomLevels, level];
    }
    onChangeConfig({ ...config, bloomLevels: updated });
  };

  const handleCountChange = (
    key: 'multipleChoice' | 'trueFalse' | 'shortAnswer' | 'essay',
    val: number
  ) => {
    const nextVal = Math.max(0, Math.min(val, 40));
    onChangeConfig({
      ...config,
      questionCounts: {
        ...config.questionCounts,
        [key]: nextVal,
      },
    });
  };

  const applyPresetStructure = (preset: 'standard_graduation' | 'test_45m' | 'test_15m' | 'quick_mix') => {
    if (preset === 'standard_graduation') {
      onChangeConfig({
        ...config,
        questionCounts: {
          multipleChoice: 18,
          trueFalse: 4,
          shortAnswer: 6,
          essay: 0,
        },
      });
    } else if (preset === 'test_45m') {
      onChangeConfig({
        ...config,
        questionCounts: {
          multipleChoice: 12,
          trueFalse: 2,
          shortAnswer: 4,
          essay: 1,
        },
      });
    } else if (preset === 'test_15m') {
      onChangeConfig({
        ...config,
        questionCounts: {
          multipleChoice: 6,
          trueFalse: 1,
          shortAnswer: 2,
          essay: 0,
        },
      });
    } else if (preset === 'quick_mix') {
      onChangeConfig({
        ...config,
        questionCounts: {
          multipleChoice: 4,
          trueFalse: 2,
          shortAnswer: 2,
          essay: 1,
        },
      });
    }
  };

  // MULTIPLE FILES UPLOAD HANDLER
  const handleMultipleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingFiles(true);
    const newItems: UploadedFileItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      const initialCat = detectFileCategory(file.name);
      const catInfo = FILE_CATEGORIES.find((c) => c.id === initialCat);

      const item: UploadedFileItem = {
        id: `file_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        category: initialCat,
        categoryLabel: catInfo?.label || 'Tài liệu',
        status: 'uploading',
      };

      try {
        if (extension === 'docx') {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          const response = await fetch('/api/parse-docx', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileBase64: base64 }),
          });
          const data = await response.json();
          item.extractedText = data.text || '';
          item.status = 'ready';
        } else if (['xlsx', 'xls', 'csv'].includes(extension)) {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          const response = await fetch('/api/parse-excel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileBase64: base64 }),
          });
          const data = await response.json();
          item.extractedText = data.text || '';
          item.status = 'ready';
        } else if (extension === 'pdf') {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          item.base64 = base64;
          item.mimeType = 'application/pdf';
          item.status = 'ready';
        } else {
          // Plain text file
          const text = await file.text();
          item.extractedText = text;
          item.mimeType = 'text/plain';
          item.status = 'ready';
        }
      } catch (err: any) {
        console.error('File parsing error:', file.name, err);
        item.status = 'error';
        item.errorMessage = err.message || 'Không thể trích xuất nội dung';
      }

      newItems.push(item);
    }

    onChangeConfig({
      ...config,
      fileAttachments: [...config.fileAttachments, ...newItems],
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsProcessingFiles(false);
  };

  // Change category of an uploaded file
  const handleFileCategoryChange = (fileId: string, newCategory: FileCategory) => {
    const catInfo = FILE_CATEGORIES.find((c) => c.id === newCategory);
    const updated = config.fileAttachments.map((f) =>
      f.id === fileId
        ? {
            ...f,
            category: newCategory,
            categoryLabel: catInfo?.label || 'Tài liệu',
          }
        : f
    );
    onChangeConfig({
      ...config,
      fileAttachments: updated,
    });
  };

  // Remove single file
  const handleRemoveFile = (fileId: string) => {
    onChangeConfig({
      ...config,
      fileAttachments: config.fileAttachments.filter((f) => f.id !== fileId),
    });
  };

  // Clear all files
  const handleClearAllFiles = () => {
    onChangeConfig({
      ...config,
      fileAttachments: [],
    });
  };

  // Load sample multi-files (Ma trận, Đặc tả, CSDL bài tập mẫu)
  const handleLoadSampleFiles = () => {
    onChangeConfig({
      ...config,
      fileAttachments: [...SAMPLE_MULTI_FILES],
      topicTitle: 'Dao động cơ học (Chuẩn Ma trận & Đặc tả)',
      customPrompt: 'Bám sát chặt chẽ ma trận đề thi và bản đặc tả yêu cầu cần đạt đã nạp.',
    });
  };

  const applySubjectPreset = (preset: (typeof SUBJECT_PRESETS)[0]) => {
    onChangeConfig({
      ...config,
      gradeLevel: preset.gradeLevel as GradeLevel,
      grade: preset.grade,
      subject: preset.subject,
      topicTitle: preset.topicTitle,
      customPrompt: preset.sampleNotes,
    });
  };

  // Helper format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full lg:w-96 shrink-0 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col overflow-hidden">
      {/* Sidebar Header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-base leading-tight">
                Cấu hình đề thi
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">Chuẩn GDPT 2018</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            {totalQuestions} câu hỏi
          </span>
        </div>
      </div>

      {/* Configuration Body */}
      <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(100vh-210px)]">
        {/* 1. Khối & Lớp */}
        <div className="space-y-2">
          <label className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
            <span>Cấp học & Khối lớp</span>
            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[11px] text-slate-500 font-medium block mb-1">Cấp học:</span>
              <select
                value={config.gradeLevel}
                onChange={(e) => handleGradeLevelChange(e.target.value as GradeLevel)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="THPT">THPT (Cấp 3)</option>
                <option value="THCS">THCS (Cấp 2)</option>
              </select>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium block mb-1">Khối lớp:</span>
              <select
                value={config.grade}
                onChange={(e) => onChangeConfig({ ...config, grade: e.target.value })}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {GRADES_BY_LEVEL[config.gradeLevel].map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 2. Môn học */}
        <div className="space-y-1.5">
          <label className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
            <span>Môn học</span>
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
          </label>
          <select
            value={config.subject}
            onChange={(e) => onChangeConfig({ ...config, subject: e.target.value })}
            className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SUBJECTS_BY_LEVEL[config.gradeLevel].map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Ngôn ngữ sinh câu hỏi (Radio) */}
        <div className="space-y-1.5">
          <label className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
            <span>Ngôn ngữ sinh câu hỏi</span>
            <Languages className="w-3.5 h-3.5 text-slate-400" />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label
              className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                config.language === 'vi'
                  ? 'bg-blue-50/80 border-blue-400 text-blue-900 font-semibold shadow-2xs'
                  : 'bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-100/60'
              }`}
            >
              <input
                type="radio"
                name="language"
                checked={config.language === 'vi'}
                onChange={() => onChangeConfig({ ...config, language: 'vi' })}
                className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span className="text-xs">Tiếng Việt (Chuẩn)</span>
            </label>
            <label
              className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                config.language === 'en'
                  ? 'bg-blue-50/80 border-blue-400 text-blue-900 font-semibold shadow-2xs'
                  : 'bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-100/60'
              }`}
            >
              <input
                type="radio"
                name="language"
                checked={config.language === 'en'}
                onChange={() => onChangeConfig({ ...config, language: 'en' })}
                className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span className="text-xs">English (Tiếng Anh)</span>
            </label>
          </div>
        </div>

        {/* 4. Chọn dạng câu hỏi kèm số lượng câu */}
        <div className="space-y-2.5 pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Dạng câu hỏi & Số lượng</span>
            </label>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => applyPresetStructure('quick_mix')}
              className="text-[11px] px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              Bộ tổng hợp (9 câu)
            </button>
            <button
              type="button"
              onClick={() => applyPresetStructure('standard_graduation')}
              className="text-[11px] px-2 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition-colors"
            >
              Chuẩn Tốt nghiệp 2025
            </button>
            <button
              type="button"
              onClick={() => applyPresetStructure('test_45m')}
              className="text-[11px] px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              Đề 45 phút (19 câu)
            </button>
          </div>

          {/* Part 1 */}
          <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
            <div className="flex-1">
              <div className="text-xs font-bold text-slate-800">
                Phần I: Trắc nghiệm 1 lựa chọn
              </div>
              <div className="text-[11px] text-slate-500">
                4 lựa chọn A, B, C, D (0.25đ/câu)
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() =>
                  handleCountChange(
                    'multipleChoice',
                    config.questionCounts.multipleChoice - 1
                  )
                }
                className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center text-sm"
              >
                -
              </button>
              <input
                type="number"
                min="0"
                max="40"
                value={config.questionCounts.multipleChoice}
                onChange={(e) =>
                  handleCountChange('multipleChoice', parseInt(e.target.value) || 0)
                }
                className="w-12 text-center py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white"
              />
              <button
                type="button"
                onClick={() =>
                  handleCountChange(
                    'multipleChoice',
                    config.questionCounts.multipleChoice + 1
                  )
                }
                className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center text-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* Part 2 */}
          <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
            <div className="flex-1">
              <div className="text-xs font-bold text-slate-800">
                Phần II: Đúng / Sai
              </div>
              <div className="text-[11px] text-slate-500">
                Mỗi câu gồm 4 ý a, b, c, d (1.0đ/câu)
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() =>
                  handleCountChange('trueFalse', config.questionCounts.trueFalse - 1)
                }
                className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center text-sm"
              >
                -
              </button>
              <input
                type="number"
                min="0"
                max="10"
                value={config.questionCounts.trueFalse}
                onChange={(e) =>
                  handleCountChange('trueFalse', parseInt(e.target.value) || 0)
                }
                className="w-12 text-center py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white"
              />
              <button
                type="button"
                onClick={() =>
                  handleCountChange('trueFalse', config.questionCounts.trueFalse + 1)
                }
                className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center text-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* Part 3 */}
          <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
            <div className="flex-1">
              <div className="text-xs font-bold text-slate-800">
                Phần III: Trả lời ngắn
              </div>
              <div className="text-[11px] text-slate-500">
                Điền đáp số số học (0.25đ - 0.5đ)
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() =>
                  handleCountChange('shortAnswer', config.questionCounts.shortAnswer - 1)
                }
                className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center text-sm"
              >
                -
              </button>
              <input
                type="number"
                min="0"
                max="15"
                value={config.questionCounts.shortAnswer}
                onChange={(e) =>
                  handleCountChange('shortAnswer', parseInt(e.target.value) || 0)
                }
                className="w-12 text-center py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white"
              />
              <button
                type="button"
                onClick={() =>
                  handleCountChange('shortAnswer', config.questionCounts.shortAnswer + 1)
                }
                className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center text-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* Part 4 */}
          <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
            <div className="flex-1">
              <div className="text-xs font-bold text-slate-800">
                Phần IV: Câu tự luận
              </div>
              <div className="text-[11px] text-slate-500">
                Barem chấm điểm chi tiết
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() =>
                  handleCountChange('essay', config.questionCounts.essay - 1)
                }
                className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center text-sm"
              >
                -
              </button>
              <input
                type="number"
                min="0"
                max="10"
                value={config.questionCounts.essay}
                onChange={(e) =>
                  handleCountChange('essay', parseInt(e.target.value) || 0)
                }
                className="w-12 text-center py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white"
              />
              <button
                type="button"
                onClick={() =>
                  handleCountChange('essay', config.questionCounts.essay + 1)
                }
                className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center text-sm"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* 5. Chọn Mức độ nhận thức (Bloom) */}
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Mức độ nhận thức (Bloom GDPT 2018)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {BLOOM_ALL.map((b) => {
              const checked = config.bloomLevels.includes(b.id);
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleBloomToggle(b.id)}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    checked
                      ? `${b.color} font-semibold ring-1 ring-blue-300/60 shadow-2xs`
                      : 'bg-slate-50/50 border-slate-200 text-slate-500 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {checked ? (
                      <CheckSquare className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                    ) : (
                      <Square className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    )}
                    <span className="text-xs">{b.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 6. KHU VỰC TẢI NHIỀU FILE TÀI LIỆU NGUỒN (Ma trận, Bản đặc tả, CSDL bài tập mẫu...) */}
        <div className="space-y-2.5 pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>Học liệu nguồn ({config.fileAttachments.length} tệp)</span>
            </label>
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-medium">
              <button
                type="button"
                onClick={() => setActiveInputTab('files')}
                className={`px-2.5 py-0.5 rounded-md transition-all ${
                  activeInputTab === 'files'
                    ? 'bg-white text-slate-800 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Tải nhiều file
              </button>
              <button
                type="button"
                onClick={() => setActiveInputTab('paste')}
                className={`px-2.5 py-0.5 rounded-md transition-all ${
                  activeInputTab === 'paste'
                    ? 'bg-white text-slate-800 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Dán văn bản
              </button>
            </div>
          </div>

          {activeInputTab === 'files' ? (
            <div className="space-y-3">
              {/* File Upload Box (Multiple) */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt"
                  onChange={handleMultipleFilesUpload}
                  className="hidden"
                  id="multi-file-upload-input"
                />
                <label
                  htmlFor="multi-file-upload-input"
                  className="w-full p-3.5 border-2 border-dashed border-blue-200 hover:border-blue-500 hover:bg-blue-50/40 bg-blue-50/15 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all text-center group"
                >
                  <UploadCloud className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-slate-700">
                    {isProcessingFiles
                      ? 'Đang nạp và phân tích các tệp tin...'
                      : '+ Tải lên nhiều file tài liệu nguồn'}
                  </div>
                  <div className="text-[11px] text-slate-500 leading-tight">
                    Hỗ trợ Word (.docx), Excel (.xlsx, .csv), PDF, Text (.txt)
                  </div>
                </label>
              </div>

              {/* Sample Files Preload Button & Clear */}
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={handleLoadSampleFiles}
                  className="text-blue-600 hover:text-blue-800 font-semibold hover:underline flex items-center gap-1"
                  title="Nạp bộ dữ liệu mẫu gồm 1 Ma trận đề thi, 1 Bản đặc tả và 1 CSDL bài tập mẫu"
                >
                  <Paperclip className="w-3 h-3" />
                  <span>Nạp mẫu: Ma trận + Đặc tả + CSDL</span>
                </button>

                {config.fileAttachments.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllFiles}
                    className="text-rose-500 hover:text-rose-700 font-medium hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Xóa tất cả</span>
                  </button>
                )}
              </div>

              {/* Uploaded Files List */}
              {config.fileAttachments.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
                  {config.fileAttachments.map((file) => {
                    const extension = file.fileName.split('.').pop()?.toLowerCase();
                    const isExcel = ['xlsx', 'xls', 'csv'].includes(extension || '');
                    const isWord = extension === 'docx';
                    const isPdf = extension === 'pdf';

                    const currentCat = FILE_CATEGORIES.find((c) => c.id === file.category);

                    return (
                      <div
                        key={file.id}
                        className="p-2.5 bg-slate-50/90 rounded-xl border border-slate-200/90 hover:border-slate-300 transition-all space-y-2 text-xs shadow-2xs"
                      >
                        {/* Top row: Icon, Name, Size, Delete */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 overflow-hidden flex-1">
                            <div className="mt-0.5 shrink-0">
                              {isExcel ? (
                                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                              ) : isWord ? (
                                <FileText className="w-4 h-4 text-blue-600" />
                              ) : isPdf ? (
                                <FileText className="w-4 h-4 text-rose-600" />
                              ) : (
                                <Paperclip className="w-4 h-4 text-slate-500" />
                              )}
                            </div>
                            <div className="overflow-hidden flex-1">
                              <div
                                className="font-semibold text-slate-800 truncate"
                                title={file.fileName}
                              >
                                {file.fileName}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {formatFileSize(file.fileSize)}
                                {file.extractedText && ` • ~${file.extractedText.length} ký tự`}
                                {isPdf && ' • Tệp PDF nguyên bản'}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveFile(file.id)}
                            className="text-slate-400 hover:text-rose-600 p-0.5 shrink-0 rounded"
                            title="Xóa tệp này"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Bottom row: Category Tag Selector */}
                        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60">
                          <span className="text-[10px] text-slate-500 font-medium shrink-0">
                            Loại tài liệu:
                          </span>
                          <select
                            value={file.category}
                            onChange={(e) =>
                              handleFileCategoryChange(file.id, e.target.value as FileCategory)
                            }
                            className={`text-[11px] font-semibold py-1 px-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white ${
                              currentCat?.color || 'text-slate-700'
                            }`}
                          >
                            {FILE_CATEGORIES.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div>
              <textarea
                rows={4}
                value={config.sourceText}
                onChange={(e) => onChangeConfig({ ...config, sourceText: e.target.value })}
                placeholder="Dán nội dung bài giảng, tóm tắt lý thuyết SGK, hoặc các yêu cầu cần đạt..."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 px-1">
                <span>Số ký tự: {config.sourceText.length}</span>
                {config.sourceText && (
                  <button
                    type="button"
                    onClick={() => onChangeConfig({ ...config, sourceText: '' })}
                    className="text-rose-500 hover:underline"
                  >
                    Xóa văn bản
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 7. Tên bài học / Chương (Tùy chọn) & Quick Topic Presets */}
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Tên bài học / Chương (Tùy chọn)
            </label>
          </div>
          <input
            type="text"
            value={config.topicTitle}
            onChange={(e) => onChangeConfig({ ...config, topicTitle: e.target.value })}
            placeholder="Ví dụ: Dao động cơ học, Este - Lipit..."
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Quick preset chips */}
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-medium">Hoặc chọn nhanh chủ đề SGK mẫu:</span>
            <div className="flex flex-wrap gap-1">
              {SUBJECT_PRESETS.slice(0, 4).map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applySubjectPreset(preset)}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 border border-slate-200/80 transition-colors"
                >
                  {preset.subject}: {preset.topicTitle.slice(0, 18)}...
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 8. Yêu cầu bổ sung của giáo viên */}
        <div className="space-y-1.5 pt-1 border-t border-slate-100">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Ghi chú / Yêu cầu thêm (Tùy chọn)
          </label>
          <input
            type="text"
            value={config.customPrompt}
            onChange={(e) => onChangeConfig({ ...config, customPrompt: e.target.value })}
            placeholder="Ví dụ: Tăng cường các câu hỏi liên hệ thực tế, bài toán đồ thị..."
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Action Button Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/90">
        <button
          type="button"
          disabled={isGenerating || totalQuestions === 0}
          onClick={onGenerate}
          className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-white shadow-md transition-all flex items-center justify-center gap-2 ${
            isGenerating || totalQuestions === 0
              ? 'bg-slate-300 cursor-not-allowed text-slate-500 shadow-none'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] shadow-blue-500/20'
          }`}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Đang phân tích tài liệu & sinh {totalQuestions} câu hỏi...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Sinh câu hỏi ({totalQuestions} câu)</span>
            </>
          )}
        </button>
        {config.fileAttachments.length > 0 && (
          <div className="text-center text-[10px] text-slate-400 mt-1.5 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Đã kết nối {config.fileAttachments.length} tài liệu nguồn (Ma trận / Đặc tả / CSDL)</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizConfigSidebar;
