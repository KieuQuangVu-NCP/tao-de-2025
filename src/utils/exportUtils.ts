import * as XLSX from 'xlsx';
import { QuizQuestion, ExamMatrixSummary } from '../types/quiz';

// Clean LaTeX markup for simple plain text copy or Excel cells
export function stripLatexForText(str: string): string {
  if (!str) return '';
  return str
    .replace(/\$\$(.*?)\$\$/g, '$1')
    .replace(/\$(.*?)\$/g, '$1')
    .replace(/\\frac\{(.*?)\}\{(.*?)\}/g, '($1/$2)')
    .replace(/\\sqrt\{(.*?)\}/g, '√($1)')
    .replace(/\\pi/g, 'π')
    .replace(/\\omega/g, 'ω')
    .replace(/\\alpha/g, 'α')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\cos/g, 'cos')
    .replace(/\\sin/g, 'sin')
    .replace(/\\tan/g, 'tan')
    .replace(/\\cdot/g, '·')
    .replace(/\\times/g, '×')
    .replace(/\\text\{(.*?)\}/g, '$1')
    .replace(/\\vec\{(.*?)\}/g, 'vec($1)')
    .replace(/\\left\(/g, '(')
    .replace(/\\right\)/g, ')')
    .replace(/\\\\/g, '\n');
}

export function calculateMatrixSummary(questions: QuizQuestion[]): ExamMatrixSummary {
  let totalScore = 0;
  let part1Count = 0;
  let part2Count = 0;
  let part3Count = 0;
  let part4Count = 0;

  const bloomCounts = {
    'Nhận biết': 0,
    'Thông hiểu': 0,
    'Vận dụng': 0,
    'Vận dụng cao': 0,
  };

  questions.forEach((q) => {
    totalScore += q.score || 0;
    if (q.part === 'PART_1') part1Count++;
    else if (q.part === 'PART_2') part2Count++;
    else if (q.part === 'PART_3') part3Count++;
    else if (q.part === 'PART_4') part4Count++;

    if (bloomCounts[q.bloomLevel] !== undefined) {
      bloomCounts[q.bloomLevel]++;
    }
  });

  return {
    totalQuestions: questions.length,
    totalScore: Math.round(totalScore * 100) / 100,
    part1Count,
    part2Count,
    part3Count,
    part4Count,
    bloomCounts,
  };
}

/**
 * Xuất file Excel (.xlsx) chuẩn cấu trúc dữ liệu GDPT 2018
 */
export function exportToExcel(
  questions: QuizQuestion[],
  examInfo: {
    title: string;
    subject: string;
    grade: string;
    examCode?: string;
  }
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Danh sách chi tiết câu hỏi
  const rows: any[] = [];
  rows.push(['STT', 'Phần', 'Định dạng câu', 'Mức độ Bloom', 'Điểm', 'Nội dung câu hỏi', 'Phương án A / Ý a', 'Phương án B / Ý b', 'Phương án C / Ý c', 'Phương án D / Ý d', 'Đáp án đúng', 'Hướng dẫn giải chi tiết']);

  questions.forEach((q, idx) => {
    let optA = '';
    let optB = '';
    let optC = '';
    let optD = '';
    let ans = q.correctAnswer || '';

    if (q.part === 'PART_1' && q.options) {
      optA = q.options.find(o => o.key === 'A')?.text || '';
      optB = q.options.find(o => o.key === 'B')?.text || '';
      optC = q.options.find(o => o.key === 'C')?.text || '';
      optD = q.options.find(o => o.key === 'D')?.text || '';
    } else if (q.part === 'PART_2' && q.subQuestions) {
      const a = q.subQuestions.find(s => s.key === 'a');
      const b = q.subQuestions.find(s => s.key === 'b');
      const c = q.subQuestions.find(s => s.key === 'c');
      const d = q.subQuestions.find(s => s.key === 'd');
      optA = a ? `${a.statement} [${a.isCorrect ? 'ĐÚNG' : 'SAI'}]` : '';
      optB = b ? `${b.statement} [${b.isCorrect ? 'ĐÚNG' : 'SAI'}]` : '';
      optC = c ? `${c.statement} [${c.isCorrect ? 'ĐÚNG' : 'SAI'}]` : '';
      optD = d ? `${d.statement} [${d.isCorrect ? 'ĐÚNG' : 'SAI'}]` : '';
      ans = `a: ${a?.isCorrect ? 'Đ' : 'S'}, b: ${b?.isCorrect ? 'Đ' : 'S'}, c: ${c?.isCorrect ? 'Đ' : 'S'}, d: ${d?.isCorrect ? 'Đ' : 'S'}`;
    }

    const partName = q.part === 'PART_1' ? 'Phần I (Nhiều lựa chọn)' :
      q.part === 'PART_2' ? 'Phần II (Đúng/Sai 4 ý)' :
      q.part === 'PART_3' ? 'Phần III (Trả lời ngắn)' : 'Phần IV (Tự luận)';

    rows.push([
      idx + 1,
      partName,
      q.type,
      q.bloomLevel,
      q.score,
      stripLatexForText(q.content),
      stripLatexForText(optA),
      stripLatexForText(optB),
      stripLatexForText(optC),
      stripLatexForText(optD),
      ans,
      stripLatexForText(q.explanation),
    ]);
  });

  const wsQuestions = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths
  wsQuestions['!cols'] = [
    { wch: 6 },  // STT
    { wch: 22 }, // Phần
    { wch: 16 }, // Loại
    { wch: 14 }, // Bloom
    { wch: 8 },  // Điểm
    { wch: 45 }, // Nội dung
    { wch: 25 }, // A
    { wch: 25 }, // B
    { wch: 25 }, // C
    { wch: 25 }, // D
    { wch: 18 }, // Đáp án
    { wch: 50 }, // Giải thích
  ];

  XLSX.utils.book_append_sheet(wb, wsQuestions, 'Danh sách câu hỏi');

  // Sheet 2: Bảng đáp án nhanh (Key Matrix)
  const keyRows: any[] = [];
  keyRows.push(['MÃ ĐỀ: ' + (examInfo.examCode || '101'), 'BẢNG ĐÁP ÁN ĐỀ THI GDPT 2018', '']);
  keyRows.push(['Môn: ' + examInfo.subject, 'Lớp: ' + examInfo.grade, 'Ngày tạo: ' + new Date().toLocaleDateString('vi-VN')]);
  keyRows.push([]);
  keyRows.push(['Câu', 'Phần', 'Đáp án đúng', 'Điểm']);

  questions.forEach((q, idx) => {
    let ans = q.correctAnswer || '';
    if (q.part === 'PART_2' && q.subQuestions) {
      ans = q.subQuestions.map(s => `${s.key}: ${s.isCorrect ? 'Đ' : 'S'}`).join(' | ');
    }
    keyRows.push([idx + 1, q.part, ans, q.score]);
  });

  const wsKey = XLSX.utils.aoa_to_sheet(keyRows);
  XLSX.utils.book_append_sheet(wb, wsKey, 'Bảng đáp án nhanh');

  // Sheet 3: Ma trận thống kê Bloom
  const summary = calculateMatrixSummary(questions);
  const matrixRows: any[] = [
    ['MA TRẬN ĐỀ THI THEO CHUẨN GDPT 2018', '', ''],
    ['Tổng số câu hỏi', summary.totalQuestions, 'câu'],
    ['Tổng điểm số', summary.totalScore, 'điểm'],
    [],
    ['Phân bố theo định dạng câu hỏi', 'Số câu', 'Tỷ lệ %'],
    ['Phần I (Trắc nghiệm nhiều lựa chọn)', summary.part1Count, `${((summary.part1Count / (summary.totalQuestions || 1)) * 100).toFixed(1)}%`],
    ['Phần II (Trắc nghiệm Đúng/Sai 4 ý)', summary.part2Count, `${((summary.part2Count / (summary.totalQuestions || 1)) * 100).toFixed(1)}%`],
    ['Phần III (Trắc nghiệm Trả lời ngắn)', summary.part3Count, `${((summary.part3Count / (summary.totalQuestions || 1)) * 100).toFixed(1)}%`],
    ['Phần IV (Tự luận)', summary.part4Count, `${((summary.part4Count / (summary.totalQuestions || 1)) * 100).toFixed(1)}%`],
    [],
    ['Phân bố mức độ nhận thức (Bloom)', 'Số câu', 'Tỷ lệ %'],
    ['Nhận biết', summary.bloomCounts['Nhận biết'], `${((summary.bloomCounts['Nhận biết'] / (summary.totalQuestions || 1)) * 100).toFixed(1)}%`],
    ['Thông hiểu', summary.bloomCounts['Thông hiểu'], `${((summary.bloomCounts['Thông hiểu'] / (summary.totalQuestions || 1)) * 100).toFixed(1)}%`],
    ['Vận dụng', summary.bloomCounts['Vận dụng'], `${((summary.bloomCounts['Vận dụng'] / (summary.totalQuestions || 1)) * 100).toFixed(1)}%`],
    ['Vận dụng cao', summary.bloomCounts['Vận dụng cao'], `${((summary.bloomCounts['Vận dụng cao'] / (summary.totalQuestions || 1)) * 100).toFixed(1)}%`],
  ];

  const wsMatrix = XLSX.utils.aoa_to_sheet(matrixRows);
  XLSX.utils.book_append_sheet(wb, wsMatrix, 'Ma trận nhận thức');

  const safeFilename = `${examInfo.subject}_${examInfo.grade}_DeThi_GDPT2018_${Date.now()}.xlsx`.replace(/\s+/g, '_');
  XLSX.writeFile(wb, safeFilename);
}

/**
 * Xuất file Word (.doc / XML HTML định dạng chuẩn văn bản hành chính sư phạm)
 * Mở được hoàn hảo trên Microsoft Word 2016-365, LibreOffice, Google Docs, giữ trọn vẹn bảng và bố cục!
 */
export function exportToWord(
  questions: QuizQuestion[],
  examInfo: {
    title: string;
    subject: string;
    grade: string;
    examCode?: string;
    durationMinutes?: number;
  }
) {
  const summary = calculateMatrixSummary(questions);
  const examCode = examInfo.examCode || '101';
  const duration = examInfo.durationMinutes || 50;

  // Group by parts
  const part1 = questions.filter(q => q.part === 'PART_1');
  const part2 = questions.filter(q => q.part === 'PART_2');
  const part3 = questions.filter(q => q.part === 'PART_3');
  const part4 = questions.filter(q => q.part === 'PART_4');

  let htmlDoc = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<title>${examInfo.title}</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
body {
  font-family: 'Times New Roman', Times, serif;
  font-size: 13pt;
  line-height: 1.35;
  color: #000;
  margin: 1.5cm 1.5cm 1.5cm 1.5cm;
}
table.header-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}
table.header-table td {
  border: none;
  vertical-align: top;
}
.title {
  text-align: center;
  font-size: 15pt;
  font-weight: bold;
  margin: 10px 0 5px 0;
  text-transform: uppercase;
}
.subtitle {
  text-align: center;
  font-size: 12pt;
  font-style: italic;
  margin-bottom: 20px;
}
.part-title {
  font-weight: bold;
  font-size: 13pt;
  margin-top: 18px;
  margin-bottom: 8px;
  text-decoration: underline;
}
.question {
  margin-bottom: 12px;
}
.question-header {
  font-weight: bold;
}
.badge {
  font-size: 10pt;
  color: #555;
  font-style: italic;
}
.options {
  margin-left: 20px;
  margin-top: 4px;
}
.tf-sub {
  margin-left: 20px;
  margin-top: 3px;
}
.answer-box {
  background-color: #f0f7f4;
  border-left: 3px solid #10b981;
  padding: 6px 12px;
  margin-top: 6px;
  margin-bottom: 10px;
  font-size: 12pt;
}
table.key-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}
table.key-table th, table.key-table td {
  border: 1px solid #333;
  padding: 6px;
  text-align: center;
  font-size: 11pt;
}
table.key-table th {
  background-color: #eee;
}
</style>
</head>
<body>

<table class="header-table">
  <tr>
    <td style="width: 45%; text-align: center;">
      <div>SỞ GIÁO DỤC VÀ ĐÀO TẠO</div>
      <div style="font-weight: bold;">TRƯỜNG THPT CHUYÊN/PHỔ THÔNG</div>
      <div><i>(Đề thi gồm có ${questions.length} câu)</i></div>
    </td>
    <td style="width: 55%; text-align: center;">
      <div style="font-weight: bold;">KỲ THI ĐÁNH GIÁ ĐỊNH KỲ - CHƯƠNG TRÌNH GDPT 2018</div>
      <div><b>NĂM HỌC 2024 - 2025</b></div>
      <div>Môn: <b>${examInfo.subject.toUpperCase()} - ${examInfo.grade.toUpperCase()}</b></div>
      <div>Thời gian làm bài: <b>${duration} phút</b> <i>(không kể thời gian phát đề)</i></div>
    </td>
  </tr>
</table>

<div style="text-align: right; margin-bottom: 10px; font-weight: bold;">Mã đề thi: ${examCode}</div>
<hr style="border: 0.5px solid #000; margin-bottom: 20px;"/>

<div class="title">${examInfo.title}</div>
<div class="subtitle">(Đề thi bám sát cấu trúc định dạng chuẩn của Bộ Giáo dục và Đào tạo)</div>
`;

  let currentQuestionIndex = 1;

  // PHẦN I
  if (part1.length > 0) {
    htmlDoc += `
<div class="part-title">PHẦN I. Thí sinh trả lời từ câu ${currentQuestionIndex} đến câu ${currentQuestionIndex + part1.length - 1}. Mỗi câu hỏi thí sinh chỉ chọn một phương án.</div>
`;
    part1.forEach((q) => {
      htmlDoc += `
<div class="question">
  <div><span class="question-header">Câu ${currentQuestionIndex}.</span> <span class="badge">[${q.bloomLevel}]</span> ${q.content}</div>
  <div class="options">
`;
      if (q.options) {
        q.options.forEach((opt) => {
          htmlDoc += `<div><b>${opt.key}.</b> ${opt.text}</div>`;
        });
      }
      htmlDoc += `</div></div>`;
      currentQuestionIndex++;
    });
  }

  // PHẦN II
  if (part2.length > 0) {
    htmlDoc += `
<div class="part-title">PHẦN II. Thí sinh trả lời từ câu ${currentQuestionIndex} đến câu ${currentQuestionIndex + part2.length - 1}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.</div>
`;
    part2.forEach((q) => {
      htmlDoc += `
<div class="question">
  <div><span class="question-header">Câu ${currentQuestionIndex}.</span> <span class="badge">[${q.bloomLevel}]</span> ${q.content}</div>
  <div class="options">
`;
      if (q.subQuestions) {
        q.subQuestions.forEach((sq) => {
          htmlDoc += `<div class="tf-sub"><b>${sq.key})</b> ${sq.statement}</div>`;
        });
      }
      htmlDoc += `</div></div>`;
      currentQuestionIndex++;
    });
  }

  // PHẦN III
  if (part3.length > 0) {
    htmlDoc += `
<div class="part-title">PHẦN III. Thí sinh trả lời từ câu ${currentQuestionIndex} đến câu ${currentQuestionIndex + part3.length - 1}. Thí sinh tự điền đáp án ngắn vào phiếu trả lời.</div>
`;
    part3.forEach((q) => {
      htmlDoc += `
<div class="question">
  <div><span class="question-header">Câu ${currentQuestionIndex}.</span> <span class="badge">[${q.bloomLevel}]</span> ${q.content}</div>
</div>`;
      currentQuestionIndex++;
    });
  }

  // PHẦN IV
  if (part4.length > 0) {
    htmlDoc += `
<div class="part-title">PHẦN IV. TỰ LUẬN (Thí sinh trình bày chi tiết bài làm).</div>
`;
    part4.forEach((q) => {
      htmlDoc += `
<div class="question">
  <div><span class="question-header">Câu ${currentQuestionIndex}.</span> <span class="badge">[${q.bloomLevel} - ${q.score} điểm]</span> ${q.content}</div>
</div>`;
      currentQuestionIndex++;
    });
  }

  htmlDoc += `
<div style="text-align: center; margin: 30px 0; font-weight: bold;">----------------- HẾT -----------------</div>
<div style="page-break-before: always;"></div>

<div class="title" style="margin-top: 30px;">HƯỚNG DẪN GIẢI VÀ BẢNG ĐÁP ÁN CHI TIẾT</div>
<div class="subtitle">(Mã đề ${examCode} - Môn: ${examInfo.subject} ${examInfo.grade})</div>

<div class="part-title">1. BẢNG ĐÁP ÁN TỔNG HỢP</div>
<table class="key-table">
  <tr>
    <th>Câu</th>
    <th>Phần</th>
    <th>Mức độ</th>
    <th>Đáp án đúng</th>
    <th>Điểm</th>
  </tr>
`;

  questions.forEach((q, idx) => {
    let ans = q.correctAnswer || '';
    if (q.part === 'PART_2' && q.subQuestions) {
      ans = q.subQuestions.map(s => `<b>${s.key}:</b> ${s.isCorrect ? 'Đ' : 'S'}`).join('; ');
    }
    htmlDoc += `
  <tr>
    <td><b>${idx + 1}</b></td>
    <td>${q.part.replace('_', ' ')}</td>
    <td>${q.bloomLevel}</td>
    <td style="color: #059669; font-weight: bold;">${ans}</td>
    <td>${q.score}</td>
  </tr>`;
  });

  htmlDoc += `
</table>

<div class="part-title" style="margin-top: 25px;">2. HƯỚNG DẪN GIẢI CHI TIẾT TỪNG CÂU</div>
`;

  questions.forEach((q, idx) => {
    let ansText = '';
    if (q.part === 'PART_1') {
      const correctOpt = q.options?.find(o => o.key === q.correctAnswer);
      ansText = `<b>Đáp án đúng: ${q.correctAnswer}</b> ${correctOpt ? `(${correctOpt.text})` : ''}`;
    } else if (q.part === 'PART_2') {
      ansText = `<b>Đáp án các mệnh đề:</b> ${q.subQuestions?.map(s => `${s.key}) ${s.isCorrect ? 'Đúng' : 'Sai'}`).join(' | ')}`;
    } else if (q.part === 'PART_3') {
      ansText = `<b>Đáp số ngắn: ${q.correctAnswer}</b>`;
    } else {
      ansText = `<b>Lời giải / Barem điểm:</b>`;
    }

    htmlDoc += `
<div style="margin-bottom: 16px; border-bottom: 1px dashed #ccc; padding-bottom: 10px;">
  <div style="font-weight: bold;">Câu ${idx + 1} [${q.bloomLevel}]:</div>
  <div style="color: #047857; margin: 4px 0;">${ansText}</div>
  <div style="margin-top: 4px; line-height: 1.4;"><b>Lời giải chi tiết:</b><br/>${q.explanation.replace(/\n/g, '<br/>')}</div>
</div>
`;
  });

  htmlDoc += `
</body>
</html>
`;

  const blob = new Blob(['\ufeff', htmlDoc], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${examInfo.subject}_${examInfo.grade}_DeThi_GDPT2018_Ma${examCode}.doc`.replace(/\s+/g, '_');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Sao chép đề thi vào Clipboard
 */
export async function copyQuizToClipboard(
  questions: QuizQuestion[],
  examInfo: {
    title: string;
    subject: string;
    grade: string;
    examCode?: string;
  },
  mode: 'full' | 'questions_only' | 'answers_only' = 'full'
): Promise<boolean> {
  try {
    let text = '';
    const examCode = examInfo.examCode || '101';

    if (mode === 'answers_only') {
      text += `=== BẢNG ĐÁP ÁN ĐỀ THI GDPT 2018 ===\n`;
      text += `Môn: ${examInfo.subject} - ${examInfo.grade} (Mã đề: ${examCode})\n\n`;

      questions.forEach((q, idx) => {
        if (q.part === 'PART_1') {
          text += `Câu ${idx + 1}: ${q.correctAnswer}\n`;
        } else if (q.part === 'PART_2' && q.subQuestions) {
          const tf = q.subQuestions.map(s => `${s.key}: ${s.isCorrect ? 'Đ' : 'S'}`).join(', ');
          text += `Câu ${idx + 1}: [${tf}]\n`;
        } else if (q.part === 'PART_3') {
          text += `Câu ${idx + 1}: ${q.correctAnswer}\n`;
        } else {
          text += `Câu ${idx + 1}: Tự luận (Xem barem)\n`;
        }
      });
    } else {
      text += `${examInfo.title.toUpperCase()}\n`;
      text += `MÔN: ${examInfo.subject.toUpperCase()} - ${examInfo.grade.toUpperCase()} | MÃ ĐỀ: ${examCode}\n`;
      text += `(Cấu trúc chuẩn theo Chương trình Giáo dục Phổ thông 2018)\n\n`;

      let currentNo = 1;

      // Part 1
      const p1 = questions.filter(q => q.part === 'PART_1');
      if (p1.length > 0) {
        text += `PHẦN I. CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN\n\n`;
        p1.forEach((q) => {
          text += `Câu ${currentNo} [${q.bloomLevel}]: ${stripLatexForText(q.content)}\n`;
          q.options?.forEach((opt) => {
            text += `${opt.key}. ${stripLatexForText(opt.text)}\n`;
          });
          if (mode === 'full') {
            text += `=> Đáp án đúng: ${q.correctAnswer}\n`;
            text += `=> Hướng dẫn giải: ${stripLatexForText(q.explanation)}\n`;
          }
          text += `\n`;
          currentNo++;
        });
      }

      // Part 2
      const p2 = questions.filter(q => q.part === 'PART_2');
      if (p2.length > 0) {
        text += `PHẦN II. CÂU TRẮC NGHIỆM ĐÚNG / SAI\n\n`;
        p2.forEach((q) => {
          text += `Câu ${currentNo} [${q.bloomLevel}]: ${stripLatexForText(q.content)}\n`;
          q.subQuestions?.forEach((sq) => {
            text += `${sq.key}) ${stripLatexForText(sq.statement)}${mode === 'full' ? ` -> [${sq.isCorrect ? 'ĐÚNG' : 'SAI'}]` : ''}\n`;
          });
          if (mode === 'full') {
            text += `=> Hướng dẫn giải: ${stripLatexForText(q.explanation)}\n`;
          }
          text += `\n`;
          currentNo++;
        });
      }

      // Part 3
      const p3 = questions.filter(q => q.part === 'PART_3');
      if (p3.length > 0) {
        text += `PHẦN III. CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN\n\n`;
        p3.forEach((q) => {
          text += `Câu ${currentNo} [${q.bloomLevel}]: ${stripLatexForText(q.content)}\n`;
          if (mode === 'full') {
            text += `=> Đáp số: ${q.correctAnswer}\n`;
            text += `=> Hướng dẫn giải: ${stripLatexForText(q.explanation)}\n`;
          }
          text += `\n`;
          currentNo++;
        });
      }

      // Part 4
      const p4 = questions.filter(q => q.part === 'PART_4');
      if (p4.length > 0) {
        text += `PHẦN IV. CÂU HỎI TỰ LUẬN\n\n`;
        p4.forEach((q) => {
          text += `Câu ${currentNo} [${q.bloomLevel} - ${q.score} điểm]: ${stripLatexForText(q.content)}\n`;
          if (mode === 'full') {
            text += `=> Lời giải chi tiết & Barem: ${stripLatexForText(q.explanation)}\n`;
          }
          text += `\n`;
          currentNo++;
        });
      }
    }

    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Clipboard copy error:', err);
    return false;
  }
}
