import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to lazily initialize Gemini client inside request handler
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY chưa được cấu hình trong môi trường máy chủ.');
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();

  // 1. Health check endpoints (respond in <1ms for Cloud Run / publish verification)
  app.get(['/health', '/_healthz', '/api/health'], (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
  });

  // 2. Start listening on PORT immediately so Cloud Run startup probe succeeds in <10ms
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI - TẠO TRẮC NGHIỆM GDPT 2018 Server running on http://0.0.0.0:${PORT}`);
  });

  // If Cloud Run assigned a port other than 3000, also ensure port 3000 is listening
  if (PORT !== 3000) {
    try {
      const s3000 = app.listen(3000, '0.0.0.0', () => {
        console.log(`AI - TẠO TRẮC NGHIỆM GDPT 2018 Server also listening on http://0.0.0.0:3000`);
      });
      s3000.on('error', (err: any) => {
        console.log(`Port 3000 in use or managed (${err.code}), continuing on port ${PORT}.`);
      });
    } catch (e: any) {
      console.log('Port 3000 listen note:', e?.message);
    }
  }

  // 3. Middlewares and API routes
  app.use(express.json({ limit: '35mb' }));
  app.use(express.urlencoded({ extended: true, limit: '35mb' }));

  // API: Parse Docx document to text
  app.post('/api/parse-docx', async (req: Request, res: Response) => {
    try {
      const { fileBase64 } = req.body;
      if (!fileBase64) {
        return res.status(400).json({ error: 'Missing fileBase64 data' });
      }

      const buffer = Buffer.from(fileBase64, 'base64');
      const result = await mammoth.extractRawText({ buffer });
      return res.json({ text: result.value || '' });
    } catch (error: any) {
      console.error('Error parsing docx:', error);
      return res.status(500).json({ error: error.message || 'Failed to extract text from docx file' });
    }
  });

  // API: Parse Excel spreadsheet (Ma trận / Ngân hàng câu hỏi dạng bảng)
  app.post('/api/parse-excel', async (req: Request, res: Response) => {
    try {
      const { fileBase64 } = req.body;
      if (!fileBase64) {
        return res.status(400).json({ error: 'Missing fileBase64 data' });
      }

      const buffer = Buffer.from(fileBase64, 'base64');
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      let combinedText = '';

      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        if (csv.trim()) {
          combinedText += `\n--- BẢNG TÍNH: ${sheetName} ---\n${csv}\n`;
        }
      });

      return res.json({ text: combinedText });
    } catch (error: any) {
      console.error('Error parsing excel:', error);
      return res.status(500).json({ error: error.message || 'Failed to extract text from excel file' });
    }
  });

  // API: Generate Quiz according to GDPT 2018
  app.post('/api/generate-quiz', async (req: Request, res: Response) => {
    try {
      const {
        gradeLevel = 'THPT',
        grade = 'Lớp 12',
        subject = 'Vật lý',
        language = 'vi',
        questionCounts = {
          multipleChoice: 4,
          trueFalse: 2,
          shortAnswer: 2,
          essay: 0,
        },
        bloomLevels = ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'],
        topicTitle = '',
        sourceText = '',
        fileAttachments = [], // Array of { fileName, category, categoryLabel, base64, mimeType, extractedText }
        customPrompt = '',
      } = req.body;

      const { multipleChoice = 0, trueFalse = 0, shortAnswer = 0, essay = 0 } = questionCounts;
      const totalRequested = multipleChoice + trueFalse + shortAnswer + essay;

      if (totalRequested <= 0) {
        return res.status(400).json({ error: 'Vui lòng chọn ít nhất 1 câu hỏi cần tạo.' });
      }

      // Construct system instruction following official Vietnam GDPT 2018 specifications
      const systemInstruction = `Bạn là Chuyên gia Khảo thí và Đo lường Giáo dục hàng đầu của Bộ Giáo dục và Đào tạo Việt Nam, chuyên xây dựng ma trận và đề thi theo Chương trình Giáo dục phổ thông 2018 (GDPT 2018).

NHIỆM VỤ:
Tạo đề kiểm tra / câu hỏi đánh giá năng lực học sinh chuẩn cấu trúc định dạng GDPT 2018.

QUY TẮC XỬ LÝ CÁC TỆP TÀI LIỆU NGUỒN ĐƯỢC TẢI LÊN (NẾU CÓ):
1. [MA TRẬN ĐỀ THI]: Tuân thủ nghiêm ngặt ma trận (mạch nội dung, phân phối câu hỏi, tỷ lệ % các mức độ nhận thức).
2. [BẢN ĐẶC TẢ ĐỀ THI]: Bám sát chi tiết các yêu cầu cần đạt (YCCĐ), đơn vị kiến thức/kỹ năng tương ứng với từng câu.
3. [CƠ SỞ DỮ LIỆU BÀI TẬP MẪU / NGÂN HÀNG CÂU HỎI]: Tham khảo dạng bài, phong cách câu hỏi, số liệu khoa học, cách đặt tình huống thực tế để tạo ra các câu hỏi tương đương hoặc phát triển mới có chất lượng chuyên môn cao.
4. [TÀI LIỆU HỌC LIỆU / SGK]: Trích xuất ngữ liệu, định nghĩa, đồ thị và bảng số liệu chuẩn từ tài liệu để xây dựng câu hỏi.

QUY CHUẨN CẤU TRÚC ĐỀ THI GDPT 2018:
1. PHẦN I - CÂU HỎI TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN (part: "PART_1", type: "multiple_choice"):
   - Mỗi câu gồm lệnh hỏi/tình huống và đúng 4 phương án A, B, C, D; trong đó chỉ có duy nhất 1 phương án đúng.
   - Thang điểm chuẩn: 0.25 điểm / câu.
   - options: Mảng 4 phần tử với key là "A", "B", "C", "D".
   - correctAnswer: Ký tự "A" hoặc "B" hoặc "C" hoặc "D".

2. PHẦN II - CÂU HỎI TRẮC NGHIỆM ĐÚNG / SAI (part: "PART_2", type: "true_false"):
   - Mỗi câu gồm 1 ngữ cảnh / tình huống / đồ thị / bài toán thực tế kèm đúng 4 lệnh hỏi/mệnh đề a), b), c), d).
   - Thí sinh xác định từng mệnh đề là Đúng (true) hoặc Sai (false).
   - Thang điểm Bộ GD&ĐT: Chọn đúng 1 ý = 0.1đ; 2 ý = 0.25đ; 3 ý = 0.5đ; 4 ý = 1.0đ.
   - subQuestions: Mảng 4 mệnh đề có key ("a", "b", "c", "d"), statement, isCorrect (boolean), và explanation ngắn gọn.

3. PHẦN III - CÂU HỎI TRẮC NGHIỆM TRẢ LỜI NGẮN (part: "PART_3", type: "short_answer"):
   - Câu hỏi yêu cầu học sinh tính toán hoặc tìm đáp số cụ thể không có gợi ý trắc nghiệm.
   - Thí sinh tự điền kết quả (thường là số nguyên, số thập phân làm tròn, hoặc thuật ngữ ngắn).
   - correctAnswer: Đáp số chính xác (ví dụ: "12,5", "-4", "300", "0,25", "CO2").
   - Thang điểm chuẩn: 0.25đ hoặc 0.5đ / câu.

4. PHẦN IV - CÂU HỎI TỰ LUẬN (part: "PART_4", type: "essay"):
   - Dành cho các bài toán/vấn đề cần trình bày bài giải hoàn chỉnh, lập luận, chứng minh hoặc giải thích hiện tượng.
   - correctAnswer: Lời giải mẫu hoàn chỉnh từng bước.
   - explanation: Barem điểm chi tiết (ví dụ: Bước 1 tính...: 0.25đ; Bước 2: 0.5đ,...).

QUY TẮC TOÁN HỌC & KHOA HỌC:
- Mọi công thức Toán học, Vật lý, Hóa học PHẢI được bọc chuẩn theo cú pháp LaTeX:
  + Dạng nội dòng: $E = mc^2$, $\\frac{-b \\pm \\sqrt{\\Delta}}{2a}$, $\\vec{F} = m\\vec{a}$, $x(t) = A\\cos(\\omega t + \\varphi)$, $H_2SO_4$.
  + Dạng khối độc lập nếu cần: $$\\int_0^1 f(x)dx = 2$$.
- Ngôn ngữ: ${language === 'en' ? 'English' : 'Tiếng Việt chuẩn giáo dục'}.
- Các mức độ nhận thức theo Bloom/GDPT 2018:
  + "Nhận biết": Tái hiện định nghĩa, định luật, nhận diện công thức cơ bản.
  + "Thông hiểu": Giải thích hiện tượng, so sánh, tính toán trực tiếp 1 bước.
  + "Vận dụng": Giải quyết tình huống bài tập quen thuộc, phối hợp 2-3 kiến thức.
  + "Vận dụng cao": Bài toán thực tế, đồ thị phức hợp, tư duy liên môn hoặc suy luận sâu.
- Lời giải chi tiết (explanation): PHẢI viết rất rõ ràng, từng bước giải thích tại sao đúng, tại sao sai, giúp giáo viên dùng được ngay không cần sửa.`;

      // Build user prompt parts
      const promptParts: any[] = [];

      let userPromptText = `YÊU CẦU TẠO ĐỀ:
- Cấp học: ${gradeLevel}
- Khối lớp: ${grade}
- Môn học: ${subject}
- Ngôn ngữ: ${language === 'en' ? 'Tiếng Anh (English)' : 'Tiếng Việt'}
- Chủ đề / Tên bài học / Chương: ${topicTitle ? `"${topicTitle}"` : 'Tạo chủ đề trọng tâm tiêu biểu chuẩn chương trình SGK GDPT 2018'}
- Phân bố mức độ nhận thức (Bloom): ${bloomLevels.join(', ')}

SỐ LƯỢNG CÂU HỎI THEO TỪNG DẠNG:
- Phần I (Trắc nghiệm 1 lựa chọn): ${multipleChoice} câu
- Phần II (Trắc nghiệm Đúng/Sai 4 ý): ${trueFalse} câu
- Phần III (Trắc nghiệm Trả lời ngắn): ${shortAnswer} câu
- Phần IV (Tự luận): ${essay} câu
Tổng số câu: ${totalRequested} câu.
`;

      if (customPrompt && customPrompt.trim()) {
        userPromptText += `\nLƯU Ý / YÊU CẦU BỔ SUNG CỦA GIÁO VIÊN:\n${customPrompt.trim()}\n`;
      }

      if (sourceText && sourceText.trim()) {
        userPromptText += `\nNỘI DUNG VĂN BẢN GHI CHÚ BỔ SUNG:\n"""\n${sourceText.slice(0, 30000)}\n"""\n`;
      }

      // Append extracted texts from uploaded files (Word, Excel, Text)
      const textFiles = fileAttachments.filter((f: any) => f.extractedText && f.extractedText.trim());
      if (textFiles.length > 0) {
        userPromptText += `\n=== CÁC TỆP TÀI LIỆU NGUỒN ĐÃ TẢI LÊN (${textFiles.length} tệp) ===\n`;
        textFiles.forEach((file: any, index: number) => {
          const categoryName = file.categoryLabel || file.category || 'Tài liệu tham khảo';
          userPromptText += `\n[TỆP ${index + 1}: ${file.fileName} | LOẠI: ${categoryName.toUpperCase()}]\n"""\n${file.extractedText.slice(0, 35000)}\n"""\n`;
        });
      }

      userPromptText += `\nHãy tạo đề thi hoàn chỉnh với đầy đủ ${totalRequested} câu theo đúng số lượng từng phần ở trên. Bám sát các tệp tài liệu nguồn (Ma trận, Bản đặc tả, Cơ sở dữ liệu bài tập mẫu) nếu có. Đảm bảo đáp án chính xác 100%, lời giải cực kỳ chi tiết và công thức Toán/Lý/Hóa sử dụng LaTeX $...$.`;

      // Attach any binary PDF / Image files directly to Gemini via inlineData
      const binaryFiles = fileAttachments.filter((f: any) => f.base64 && f.mimeType);
      for (const bFile of binaryFiles) {
        promptParts.push({
          text: `[ĐÍNH KÈM TỆP: ${bFile.fileName} - Phân loại: ${bFile.categoryLabel || bFile.category}]`,
        });
        promptParts.push({
          inlineData: {
            mimeType: bFile.mimeType,
            data: bFile.base64,
          },
        });
      }

      promptParts.push({ text: userPromptText });

      const ai = getGeminiClient();

      // Structured Output schema using Type enum
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptParts,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              examTitle: {
                type: Type.STRING,
                description: 'Tiêu đề đề thi/kiểm tra, ví dụ: ĐỀ KIỂM TRA ĐÁNH GIÁ CHẤT LƯỢNG MÔN VẬT LÝ 12 - CHƯƠNG DAO ĐỘNG CƠ',
              },
              durationMinutes: {
                type: Type.INTEGER,
                description: 'Thời gian làm bài đề xuất (ví dụ: 45, 50, 90)',
              },
              questions: {
                type: Type.ARRAY,
                description: 'Danh sách các câu hỏi theo chuẩn GDPT 2018',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    part: {
                      type: Type.STRING,
                      description: 'PART_1 (Nhiều lựa chọn), PART_2 (Đúng/Sai), PART_3 (Trả lời ngắn), PART_4 (Tự luận)',
                    },
                    type: {
                      type: Type.STRING,
                      description: 'multiple_choice | true_false | short_answer | essay',
                    },
                    bloomLevel: {
                      type: Type.STRING,
                      description: 'Nhận biết | Thông hiểu | Vận dụng | Vận dụng cao',
                    },
                    content: {
                      type: Type.STRING,
                      description: 'Nội dung câu hỏi hoặc bài toán dẫn dắt. Sử dụng $...$ cho công thức toán/lý/hóa.',
                    },
                    score: {
                      type: Type.NUMBER,
                      description: 'Điểm số của câu',
                    },
                    options: {
                      type: Type.ARRAY,
                      description: 'Cho câu trắc nghiệm nhiều phương án (Phần I). Gồm 4 phần tử A, B, C, D.',
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          key: { type: Type.STRING, description: 'A, B, C hoặc D' },
                          text: { type: Type.STRING, description: 'Nội dung phương án' },
                        },
                        required: ['key', 'text'],
                      },
                    },
                    correctAnswer: {
                      type: Type.STRING,
                      description: 'Cho Phần I: A/B/C/D. Cho Phần III: Đáp số số học (vd 12,5). Cho Phần IV: Lời giải mẫu tóm tắt.',
                    },
                    subQuestions: {
                      type: Type.ARRAY,
                      description: 'Cho câu Đúng/Sai (Phần II). Gồm 4 mệnh đề a, b, c, d.',
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          key: { type: Type.STRING, description: 'a, b, c hoặc d' },
                          statement: { type: Type.STRING, description: 'Nội dung mệnh đề' },
                          isCorrect: { type: Type.BOOLEAN, description: 'true nếu Đúng, false nếu Sai' },
                          explanation: { type: Type.STRING, description: 'Giải thích ngắn gọn tại sao đúng hoặc sai' },
                        },
                        required: ['key', 'statement', 'isCorrect'],
                      },
                    },
                    explanation: {
                      type: Type.STRING,
                      description: 'Hướng dẫn giải chi tiết từng bước, phân tích kiến thức và đáp án đúng.',
                    },
                  },
                  required: ['part', 'type', 'bloomLevel', 'content', 'explanation'],
                },
              },
            },
            required: ['examTitle', 'questions'],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Không nhận được phản hồi từ mô hình AI.');
      }

      const parsedData = JSON.parse(responseText);

      // Enhance question items with unique IDs if missing
      const formattedQuestions = (parsedData.questions || []).map((q: any, idx: number) => ({
        ...q,
        id: `q_${Date.now()}_${idx + 1}`,
        score: q.score || (q.part === 'PART_2' ? 1.0 : q.part === 'PART_3' ? 0.5 : q.part === 'PART_4' ? 1.0 : 0.25),
      }));

      return res.json({
        success: true,
        examTitle: parsedData.examTitle || `ĐỀ KIỂM TRA MÔN ${subject.toUpperCase()} ${grade.toUpperCase()}`,
        durationMinutes: parsedData.durationMinutes || 45,
        gradeLevel,
        grade,
        subject,
        language,
        questions: formattedQuestions,
      });
    } catch (error: any) {
      console.error('API /api/generate-quiz error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Lỗi xử lý sinh đề thi từ hệ thống AI.',
      });
    }
  });

  const distPath = path.resolve(__dirname, 'dist');
  const indexHtmlPath = path.resolve(distPath, 'index.html');
  const hasDist = fs.existsSync(indexHtmlPath);

  // Setup static files or Vite middleware
  if (process.env.NODE_ENV === 'production' || hasDist) {
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(indexHtmlPath);
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
