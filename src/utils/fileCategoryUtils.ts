import { FileCategory, UploadedFileItem } from '../types/quiz';

export const FILE_CATEGORIES: {
  id: FileCategory;
  label: string;
  shortLabel: string;
  desc: string;
  color: string;
  badgeBg: string;
}[] = [
  {
    id: 'matrix',
    label: 'Ma trận đề thi',
    shortLabel: 'Ma trận',
    desc: 'Phân bố mạch nội dung, số câu và tỷ lệ % điểm theo chuẩn Bộ GD&ĐT',
    color: 'text-indigo-700 border-indigo-200 bg-indigo-50',
    badgeBg: 'bg-indigo-600 text-white',
  },
  {
    id: 'specification',
    label: 'Bản đặc tả đề thi',
    shortLabel: 'Bản đặc tả',
    desc: 'Yêu cầu cần đạt (YCCĐ) và mức độ nhận thức cụ thể của từng câu',
    color: 'text-emerald-700 border-emerald-200 bg-emerald-50',
    badgeBg: 'bg-emerald-600 text-white',
  },
  {
    id: 'question_bank',
    label: 'CSDL bài tập mẫu / Ngân hàng câu hỏi',
    shortLabel: 'Bài tập mẫu',
    desc: 'Ngân hàng đề thi, bài tập nguồn và dạng toán tham khảo phát triển',
    color: 'text-amber-800 border-amber-200 bg-amber-50',
    badgeBg: 'bg-amber-600 text-white',
  },
  {
    id: 'textbook',
    label: 'Tài liệu SGK / Chuyên đề',
    shortLabel: 'SGK / Chuyên đề',
    desc: 'Nội dung sách giáo khoa, hiện tượng khoa học và lý thuyết',
    color: 'text-sky-700 border-sky-200 bg-sky-50',
    badgeBg: 'bg-sky-600 text-white',
  },
  {
    id: 'general',
    label: 'Tài liệu khác',
    shortLabel: 'Tài liệu khác',
    desc: 'Tài liệu bổ trợ chung hoặc ghi chú',
    color: 'text-slate-700 border-slate-200 bg-slate-100',
    badgeBg: 'bg-slate-600 text-white',
  },
];

export function detectFileCategory(fileName: string): FileCategory {
  const lower = fileName.toLowerCase();
  if (lower.includes('ma tran') || lower.includes('matran') || lower.includes('matrix')) {
    return 'matrix';
  }
  if (lower.includes('dac ta') || lower.includes('dacta') || lower.includes('spec')) {
    return 'specification';
  }
  if (
    lower.includes('ngan hang') ||
    lower.includes('cau hoi') ||
    lower.includes('bai tap') ||
    lower.includes('csdl') ||
    lower.includes('bank') ||
    lower.includes('de thi')
  ) {
    return 'question_bank';
  }
  if (lower.includes('sgk') || lower.includes('chuyen de') || lower.includes('ly thuyet')) {
    return 'textbook';
  }
  return 'general';
}

export const SAMPLE_MULTI_FILES: UploadedFileItem[] = [
  {
    id: 'sample_matrix_1',
    fileName: 'Ma_tran_Kiem_tra_Dinh_ky_GDPT2018.xlsx',
    fileSize: 45200,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    category: 'matrix',
    categoryLabel: 'Ma trận đề thi',
    extractedText: `BẢNG MA TRẬN ĐỀ KIỂM TRA ĐỊNH KỲ CHƯƠNG DAO ĐỘNG CƠ - VẬT LÝ 12
- Mạch 1: Dao động điều hòa (Phương trình dao động, vận tốc, gia tốc): 2 câu Nhận biết (Phần I), 1 câu Thông hiểu (Phần I).
- Mạch 2: Con lắc lò xo và con lắc đơn (Chu kì, lực đàn hồi, năng lượng): 1 câu Thông hiểu (Phần I), 1 câu Vận dụng (Phần I), 1 câu Đúng/Sai 4 ý (Phần II).
- Mạch 3: Dao động tắt dần, dao động cưỡng bức, cộng hưởng: 1 câu Đúng/Sai 4 ý (Phần II), 1 câu Trả lời ngắn (Phần III).
- Mạch 4: Bài toán đồ thị và bài toán thực tế dao động cơ: 1 câu Trả lời ngắn (Phần III), 1 câu Tự luận vận dụng cao (Phần IV).
Tỷ lệ nhận thức mục tiêu: Nhận biết 30%, Thông hiểu 30%, Vận dụng 30%, Vận dụng cao 10%.`,
    status: 'ready',
  },
  {
    id: 'sample_spec_2',
    fileName: 'Ban_dac_ta_Chi_tiet_De_thi_GDPT2018.docx',
    fileSize: 68400,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    category: 'specification',
    categoryLabel: 'Bản đặc tả đề thi',
    extractedText: `BẢN ĐẶC TẢ ĐỀ THI - MÔN VẬT LÝ 12 (CHƯƠNG TRÌNH GDPT 2018)
1. YÊU CẦU CẦN ĐẠT (YCCĐ):
- Nhận biết: Nêu được định nghĩa dao động điều hòa, li độ, biên độ, chu kì, tần số, tần số góc, pha ban đầu.
- Thông hiểu: Viết và giải thích được mối liên hệ giữa $x, v, a$; so sánh pha giữa li độ, vận tốc và gia tốc; phân biệt được dao động riêng và dao động cưỡng bức.
- Vận dụng: Vận dụng được hệ thức độc lập thời gian $A^2 = x^2 + v^2/\\omega^2$, tính được cơ năng, thế năng, động năng tại một li độ nhất định.
- Vận dụng cao: Vận dụng bảo toàn năng lượng giải quyết bài toán dao động tắt dần, bài toán con lắc lò xo treo thẳng đứng với lực đàn hồi và đồ thị phức hợp.`,
    status: 'ready',
  },
  {
    id: 'sample_bank_3',
    fileName: 'CSDL_Bai_tap_mau_va_Ngan_hang_cau_hoi.docx',
    fileSize: 89100,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    category: 'question_bank',
    categoryLabel: 'CSDL bài tập mẫu / Ngân hàng câu hỏi',
    extractedText: `CƠ SỞ DỮ LIỆU CÂU HỎI & BÀI TẬP MẪU THAM KHẢO:
Bài tập mẫu 1: Một vật dao động điều hòa có chu kì $T = 0,2\\text{ s}$, biên độ $A = 5\\text{ cm}$. Tại thời điểm $t = 0$, vật đi qua vị trí cân bằng theo chiều dương. Tính tốc độ cực đại và gia tốc cực đại của vật.
Bài tập mẫu 2 (Dạng Đúng/Sai): Cho con lắc lò xo treo thẳng đứng, độ cứng $k = 100\\text{ N/m}$, khối lượng $m = 250\\text{ g}$. Kéo vật xuống dưới vị trí cân bằng $2\\text{ cm}$ rồi truyền vận tốc $40\\pi\\text{ cm/s}$ hướng về VTCB. Lấy $g = 10\\text{ m/s}^2, \\pi^2 = 10$.
Bài tập mẫu 3 (Dạng Trả lời ngắn): Một chất điểm dao động điều hòa trên đoạn thẳng dài $12\\text{ cm}$. Tần số dao động là $5\\text{ Hz}$. Tính tốc độ trung bình của chất điểm trong một chu kì dao động (theo đơn vị m/s).`,
    status: 'ready',
  },
];
