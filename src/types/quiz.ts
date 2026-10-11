export type GradeLevel = 'THPT' | 'THCS';

export type BloomLevel = 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao';

export type QuestionPart = 'PART_1' | 'PART_2' | 'PART_3' | 'PART_4';

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';

export interface MultipleChoiceOption {
  key: string; // 'A' | 'B' | 'C' | 'D'
  text: string;
}

export interface TrueFalseStatement {
  key: string; // 'a' | 'b' | 'c' | 'd'
  statement: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface QuizQuestion {
  id: string;
  part: QuestionPart;
  type: QuestionType;
  bloomLevel: BloomLevel;
  content: string; // May include LaTeX $...$
  options?: MultipleChoiceOption[]; // For PART_1
  correctAnswer?: string; // For PART_1 (A/B/C/D), PART_3 (12.5), PART_4
  subQuestions?: TrueFalseStatement[]; // For PART_2 (a, b, c, d)
  explanation: string;
  score: number;
}

export type FileCategory =
  | 'matrix' // Ma trận đề thi
  | 'specification' // Bản đặc tả đề thi
  | 'question_bank' // Cơ sở dữ liệu bài tập mẫu / Ngân hàng câu hỏi
  | 'textbook' // Tài liệu SGK / Chuyên đề
  | 'general'; // Tài liệu khác

export interface UploadedFileItem {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  category: FileCategory;
  categoryLabel: string;
  base64?: string;
  extractedText?: string;
  status: 'uploading' | 'ready' | 'error';
  errorMessage?: string;
}

export interface QuizConfig {
  gradeLevel: GradeLevel;
  grade: string;
  subject: string;
  language: 'vi' | 'en';
  questionCounts: {
    multipleChoice: number;
    trueFalse: number;
    shortAnswer: number;
    essay: number;
  };
  bloomLevels: BloomLevel[];
  topicTitle: string;
  sourceText: string;
  fileAttachments: UploadedFileItem[];
  customPrompt: string;
}

export interface ExamMatrixSummary {
  totalQuestions: number;
  totalScore: number;
  part1Count: number;
  part2Count: number;
  part3Count: number;
  part4Count: number;
  bloomCounts: {
    'Nhận biết': number;
    'Thông hiểu': number;
    'Vận dụng': number;
    'Vận dụng cao': number;
  };
}

export type ViewMode = 'full' | 'questions_only' | 'answers_only';
