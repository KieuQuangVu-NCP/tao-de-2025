// server.ts
import express from "express";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY ch\u01B0a \u0111\u01B0\u1EE3c c\u1EA5u h\xECnh trong m\xF4i tr\u01B0\u1EDDng m\xE1y ch\u1EE7.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
async function startServer() {
  const app = express();
  app.get(["/health", "/_healthz", "/api/health"], (_req, res) => {
    res.status(200).json({ status: "ok", uptime: process.uptime() });
  });
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI - T\u1EA0O TR\u1EAEC NGHI\u1EC6M GDPT 2018 Server running on http://0.0.0.0:${PORT}`);
  });
  if (PORT !== 3e3) {
    try {
      const s3000 = app.listen(3e3, "0.0.0.0", () => {
        console.log(`AI - T\u1EA0O TR\u1EAEC NGHI\u1EC6M GDPT 2018 Server also listening on http://0.0.0.0:3000`);
      });
      s3000.on("error", (err) => {
        console.log(`Port 3000 in use or managed (${err.code}), continuing on port ${PORT}.`);
      });
    } catch (e) {
      console.log("Port 3000 listen note:", e?.message);
    }
  }
  app.use(express.json({ limit: "35mb" }));
  app.use(express.urlencoded({ extended: true, limit: "35mb" }));
  app.post("/api/parse-docx", async (req, res) => {
    try {
      const { fileBase64 } = req.body;
      if (!fileBase64) {
        return res.status(400).json({ error: "Missing fileBase64 data" });
      }
      const buffer = Buffer.from(fileBase64, "base64");
      const result = await mammoth.extractRawText({ buffer });
      return res.json({ text: result.value || "" });
    } catch (error) {
      console.error("Error parsing docx:", error);
      return res.status(500).json({ error: error.message || "Failed to extract text from docx file" });
    }
  });
  app.post("/api/parse-excel", async (req, res) => {
    try {
      const { fileBase64 } = req.body;
      if (!fileBase64) {
        return res.status(400).json({ error: "Missing fileBase64 data" });
      }
      const buffer = Buffer.from(fileBase64, "base64");
      const workbook = XLSX.read(buffer, { type: "buffer" });
      let combinedText = "";
      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        if (csv.trim()) {
          combinedText += `
--- B\u1EA2NG T\xCDNH: ${sheetName} ---
${csv}
`;
        }
      });
      return res.json({ text: combinedText });
    } catch (error) {
      console.error("Error parsing excel:", error);
      return res.status(500).json({ error: error.message || "Failed to extract text from excel file" });
    }
  });
  app.post("/api/generate-quiz", async (req, res) => {
    try {
      const {
        gradeLevel = "THPT",
        grade = "L\u1EDBp 12",
        subject = "V\u1EADt l\xFD",
        language = "vi",
        questionCounts = {
          multipleChoice: 4,
          trueFalse: 2,
          shortAnswer: 2,
          essay: 0
        },
        bloomLevels = ["Nh\u1EADn bi\u1EBFt", "Th\xF4ng hi\u1EC3u", "V\u1EADn d\u1EE5ng", "V\u1EADn d\u1EE5ng cao"],
        topicTitle = "",
        sourceText = "",
        fileAttachments = [],
        // Array of { fileName, category, categoryLabel, base64, mimeType, extractedText }
        customPrompt = ""
      } = req.body;
      const { multipleChoice = 0, trueFalse = 0, shortAnswer = 0, essay = 0 } = questionCounts;
      const totalRequested = multipleChoice + trueFalse + shortAnswer + essay;
      if (totalRequested <= 0) {
        return res.status(400).json({ error: "Vui l\xF2ng ch\u1ECDn \xEDt nh\u1EA5t 1 c\xE2u h\u1ECFi c\u1EA7n t\u1EA1o." });
      }
      const systemInstruction = `B\u1EA1n l\xE0 Chuy\xEAn gia Kh\u1EA3o th\xED v\xE0 \u0110o l\u01B0\u1EDDng Gi\xE1o d\u1EE5c h\xE0ng \u0111\u1EA7u c\u1EE7a B\u1ED9 Gi\xE1o d\u1EE5c v\xE0 \u0110\xE0o t\u1EA1o Vi\u1EC7t Nam, chuy\xEAn x\xE2y d\u1EF1ng ma tr\u1EADn v\xE0 \u0111\u1EC1 thi theo Ch\u01B0\u01A1ng tr\xECnh Gi\xE1o d\u1EE5c ph\u1ED5 th\xF4ng 2018 (GDPT 2018).

NHI\u1EC6M V\u1EE4:
T\u1EA1o \u0111\u1EC1 ki\u1EC3m tra / c\xE2u h\u1ECFi \u0111\xE1nh gi\xE1 n\u0103ng l\u1EF1c h\u1ECDc sinh chu\u1EA9n c\u1EA5u tr\xFAc \u0111\u1ECBnh d\u1EA1ng GDPT 2018.

QUY T\u1EAEC X\u1EEC L\xDD C\xC1C T\u1EC6P T\xC0I LI\u1EC6U NGU\u1ED2N \u0110\u01AF\u1EE2C T\u1EA2I L\xCAN (N\u1EBEU C\xD3):
1. [MA TR\u1EACN \u0110\u1EC0 THI]: Tu\xE2n th\u1EE7 nghi\xEAm ng\u1EB7t ma tr\u1EADn (m\u1EA1ch n\u1ED9i dung, ph\xE2n ph\u1ED1i c\xE2u h\u1ECFi, t\u1EF7 l\u1EC7 % c\xE1c m\u1EE9c \u0111\u1ED9 nh\u1EADn th\u1EE9c).
2. [B\u1EA2N \u0110\u1EB6C T\u1EA2 \u0110\u1EC0 THI]: B\xE1m s\xE1t chi ti\u1EBFt c\xE1c y\xEAu c\u1EA7u c\u1EA7n \u0111\u1EA1t (YCC\u0110), \u0111\u01A1n v\u1ECB ki\u1EBFn th\u1EE9c/k\u1EF9 n\u0103ng t\u01B0\u01A1ng \u1EE9ng v\u1EDBi t\u1EEBng c\xE2u.
3. [C\u01A0 S\u1EDE D\u1EEE LI\u1EC6U B\xC0I T\u1EACP M\u1EAAU / NG\xC2N H\xC0NG C\xC2U H\u1ECEI]: Tham kh\u1EA3o d\u1EA1ng b\xE0i, phong c\xE1ch c\xE2u h\u1ECFi, s\u1ED1 li\u1EC7u khoa h\u1ECDc, c\xE1ch \u0111\u1EB7t t\xECnh hu\u1ED1ng th\u1EF1c t\u1EBF \u0111\u1EC3 t\u1EA1o ra c\xE1c c\xE2u h\u1ECFi t\u01B0\u01A1ng \u0111\u01B0\u01A1ng ho\u1EB7c ph\xE1t tri\u1EC3n m\u1EDBi c\xF3 ch\u1EA5t l\u01B0\u1EE3ng chuy\xEAn m\xF4n cao.
4. [T\xC0I LI\u1EC6U H\u1ECCC LI\u1EC6U / SGK]: Tr\xEDch xu\u1EA5t ng\u1EEF li\u1EC7u, \u0111\u1ECBnh ngh\u0129a, \u0111\u1ED3 th\u1ECB v\xE0 b\u1EA3ng s\u1ED1 li\u1EC7u chu\u1EA9n t\u1EEB t\xE0i li\u1EC7u \u0111\u1EC3 x\xE2y d\u1EF1ng c\xE2u h\u1ECFi.

QUY CHU\u1EA8N C\u1EA4U TR\xDAC \u0110\u1EC0 THI GDPT 2018:
1. PH\u1EA6N I - C\xC2U H\u1ECEI TR\u1EAEC NGHI\u1EC6M NHI\u1EC0U PH\u01AF\u01A0NG \xC1N L\u1EF0A CH\u1ECCN (part: "PART_1", type: "multiple_choice"):
   - M\u1ED7i c\xE2u g\u1ED3m l\u1EC7nh h\u1ECFi/t\xECnh hu\u1ED1ng v\xE0 \u0111\xFAng 4 ph\u01B0\u01A1ng \xE1n A, B, C, D; trong \u0111\xF3 ch\u1EC9 c\xF3 duy nh\u1EA5t 1 ph\u01B0\u01A1ng \xE1n \u0111\xFAng.
   - Thang \u0111i\u1EC3m chu\u1EA9n: 0.25 \u0111i\u1EC3m / c\xE2u.
   - options: M\u1EA3ng 4 ph\u1EA7n t\u1EED v\u1EDBi key l\xE0 "A", "B", "C", "D".
   - correctAnswer: K\xFD t\u1EF1 "A" ho\u1EB7c "B" ho\u1EB7c "C" ho\u1EB7c "D".

2. PH\u1EA6N II - C\xC2U H\u1ECEI TR\u1EAEC NGHI\u1EC6M \u0110\xDANG / SAI (part: "PART_2", type: "true_false"):
   - M\u1ED7i c\xE2u g\u1ED3m 1 ng\u1EEF c\u1EA3nh / t\xECnh hu\u1ED1ng / \u0111\u1ED3 th\u1ECB / b\xE0i to\xE1n th\u1EF1c t\u1EBF k\xE8m \u0111\xFAng 4 l\u1EC7nh h\u1ECFi/m\u1EC7nh \u0111\u1EC1 a), b), c), d).
   - Th\xED sinh x\xE1c \u0111\u1ECBnh t\u1EEBng m\u1EC7nh \u0111\u1EC1 l\xE0 \u0110\xFAng (true) ho\u1EB7c Sai (false).
   - Thang \u0111i\u1EC3m B\u1ED9 GD&\u0110T: Ch\u1ECDn \u0111\xFAng 1 \xFD = 0.1\u0111; 2 \xFD = 0.25\u0111; 3 \xFD = 0.5\u0111; 4 \xFD = 1.0\u0111.
   - subQuestions: M\u1EA3ng 4 m\u1EC7nh \u0111\u1EC1 c\xF3 key ("a", "b", "c", "d"), statement, isCorrect (boolean), v\xE0 explanation ng\u1EAFn g\u1ECDn.

3. PH\u1EA6N III - C\xC2U H\u1ECEI TR\u1EAEC NGHI\u1EC6M TR\u1EA2 L\u1EDCI NG\u1EAEN (part: "PART_3", type: "short_answer"):
   - C\xE2u h\u1ECFi y\xEAu c\u1EA7u h\u1ECDc sinh t\xEDnh to\xE1n ho\u1EB7c t\xECm \u0111\xE1p s\u1ED1 c\u1EE5 th\u1EC3 kh\xF4ng c\xF3 g\u1EE3i \xFD tr\u1EAFc nghi\u1EC7m.
   - Th\xED sinh t\u1EF1 \u0111i\u1EC1n k\u1EBFt qu\u1EA3 (th\u01B0\u1EDDng l\xE0 s\u1ED1 nguy\xEAn, s\u1ED1 th\u1EADp ph\xE2n l\xE0m tr\xF2n, ho\u1EB7c thu\u1EADt ng\u1EEF ng\u1EAFn).
   - correctAnswer: \u0110\xE1p s\u1ED1 ch\xEDnh x\xE1c (v\xED d\u1EE5: "12,5", "-4", "300", "0,25", "CO2").
   - Thang \u0111i\u1EC3m chu\u1EA9n: 0.25\u0111 ho\u1EB7c 0.5\u0111 / c\xE2u.

4. PH\u1EA6N IV - C\xC2U H\u1ECEI T\u1EF0 LU\u1EACN (part: "PART_4", type: "essay"):
   - D\xE0nh cho c\xE1c b\xE0i to\xE1n/v\u1EA5n \u0111\u1EC1 c\u1EA7n tr\xECnh b\xE0y b\xE0i gi\u1EA3i ho\xE0n ch\u1EC9nh, l\u1EADp lu\u1EADn, ch\u1EE9ng minh ho\u1EB7c gi\u1EA3i th\xEDch hi\u1EC7n t\u01B0\u1EE3ng.
   - correctAnswer: L\u1EDDi gi\u1EA3i m\u1EABu ho\xE0n ch\u1EC9nh t\u1EEBng b\u01B0\u1EDBc.
   - explanation: Barem \u0111i\u1EC3m chi ti\u1EBFt (v\xED d\u1EE5: B\u01B0\u1EDBc 1 t\xEDnh...: 0.25\u0111; B\u01B0\u1EDBc 2: 0.5\u0111,...).

QUY T\u1EAEC TO\xC1N H\u1ECCC & KHOA H\u1ECCC:
- M\u1ECDi c\xF4ng th\u1EE9c To\xE1n h\u1ECDc, V\u1EADt l\xFD, H\xF3a h\u1ECDc PH\u1EA2I \u0111\u01B0\u1EE3c b\u1ECDc chu\u1EA9n theo c\xFA ph\xE1p LaTeX:
  + D\u1EA1ng n\u1ED9i d\xF2ng: $E = mc^2$, $\\frac{-b \\pm \\sqrt{\\Delta}}{2a}$, $\\vec{F} = m\\vec{a}$, $x(t) = A\\cos(\\omega t + \\varphi)$, $H_2SO_4$.
  + D\u1EA1ng kh\u1ED1i \u0111\u1ED9c l\u1EADp n\u1EBFu c\u1EA7n: $$\\int_0^1 f(x)dx = 2$$.
- Ng\xF4n ng\u1EEF: ${language === "en" ? "English" : "Ti\u1EBFng Vi\u1EC7t chu\u1EA9n gi\xE1o d\u1EE5c"}.
- C\xE1c m\u1EE9c \u0111\u1ED9 nh\u1EADn th\u1EE9c theo Bloom/GDPT 2018:
  + "Nh\u1EADn bi\u1EBFt": T\xE1i hi\u1EC7n \u0111\u1ECBnh ngh\u0129a, \u0111\u1ECBnh lu\u1EADt, nh\u1EADn di\u1EC7n c\xF4ng th\u1EE9c c\u01A1 b\u1EA3n.
  + "Th\xF4ng hi\u1EC3u": Gi\u1EA3i th\xEDch hi\u1EC7n t\u01B0\u1EE3ng, so s\xE1nh, t\xEDnh to\xE1n tr\u1EF1c ti\u1EBFp 1 b\u01B0\u1EDBc.
  + "V\u1EADn d\u1EE5ng": Gi\u1EA3i quy\u1EBFt t\xECnh hu\u1ED1ng b\xE0i t\u1EADp quen thu\u1ED9c, ph\u1ED1i h\u1EE3p 2-3 ki\u1EBFn th\u1EE9c.
  + "V\u1EADn d\u1EE5ng cao": B\xE0i to\xE1n th\u1EF1c t\u1EBF, \u0111\u1ED3 th\u1ECB ph\u1EE9c h\u1EE3p, t\u01B0 duy li\xEAn m\xF4n ho\u1EB7c suy lu\u1EADn s\xE2u.
- L\u1EDDi gi\u1EA3i chi ti\u1EBFt (explanation): PH\u1EA2I vi\u1EBFt r\u1EA5t r\xF5 r\xE0ng, t\u1EEBng b\u01B0\u1EDBc gi\u1EA3i th\xEDch t\u1EA1i sao \u0111\xFAng, t\u1EA1i sao sai, gi\xFAp gi\xE1o vi\xEAn d\xF9ng \u0111\u01B0\u1EE3c ngay kh\xF4ng c\u1EA7n s\u1EEDa.`;
      const promptParts = [];
      let userPromptText = `Y\xCAU C\u1EA6U T\u1EA0O \u0110\u1EC0:
- C\u1EA5p h\u1ECDc: ${gradeLevel}
- Kh\u1ED1i l\u1EDBp: ${grade}
- M\xF4n h\u1ECDc: ${subject}
- Ng\xF4n ng\u1EEF: ${language === "en" ? "Ti\u1EBFng Anh (English)" : "Ti\u1EBFng Vi\u1EC7t"}
- Ch\u1EE7 \u0111\u1EC1 / T\xEAn b\xE0i h\u1ECDc / Ch\u01B0\u01A1ng: ${topicTitle ? `"${topicTitle}"` : "T\u1EA1o ch\u1EE7 \u0111\u1EC1 tr\u1ECDng t\xE2m ti\xEAu bi\u1EC3u chu\u1EA9n ch\u01B0\u01A1ng tr\xECnh SGK GDPT 2018"}
- Ph\xE2n b\u1ED1 m\u1EE9c \u0111\u1ED9 nh\u1EADn th\u1EE9c (Bloom): ${bloomLevels.join(", ")}

S\u1ED0 L\u01AF\u1EE2NG C\xC2U H\u1ECEI THEO T\u1EEANG D\u1EA0NG:
- Ph\u1EA7n I (Tr\u1EAFc nghi\u1EC7m 1 l\u1EF1a ch\u1ECDn): ${multipleChoice} c\xE2u
- Ph\u1EA7n II (Tr\u1EAFc nghi\u1EC7m \u0110\xFAng/Sai 4 \xFD): ${trueFalse} c\xE2u
- Ph\u1EA7n III (Tr\u1EAFc nghi\u1EC7m Tr\u1EA3 l\u1EDDi ng\u1EAFn): ${shortAnswer} c\xE2u
- Ph\u1EA7n IV (T\u1EF1 lu\u1EADn): ${essay} c\xE2u
T\u1ED5ng s\u1ED1 c\xE2u: ${totalRequested} c\xE2u.
`;
      if (customPrompt && customPrompt.trim()) {
        userPromptText += `
L\u01AFU \xDD / Y\xCAU C\u1EA6U B\u1ED4 SUNG C\u1EE6A GI\xC1O VI\xCAN:
${customPrompt.trim()}
`;
      }
      if (sourceText && sourceText.trim()) {
        userPromptText += `
N\u1ED8I DUNG V\u0102N B\u1EA2N GHI CH\xDA B\u1ED4 SUNG:
"""
${sourceText.slice(0, 3e4)}
"""
`;
      }
      const textFiles = fileAttachments.filter((f) => f.extractedText && f.extractedText.trim());
      if (textFiles.length > 0) {
        userPromptText += `
=== C\xC1C T\u1EC6P T\xC0I LI\u1EC6U NGU\u1ED2N \u0110\xC3 T\u1EA2I L\xCAN (${textFiles.length} t\u1EC7p) ===
`;
        textFiles.forEach((file, index) => {
          const categoryName = file.categoryLabel || file.category || "T\xE0i li\u1EC7u tham kh\u1EA3o";
          userPromptText += `
[T\u1EC6P ${index + 1}: ${file.fileName} | LO\u1EA0I: ${categoryName.toUpperCase()}]
"""
${file.extractedText.slice(0, 35e3)}
"""
`;
        });
      }
      userPromptText += `
H\xE3y t\u1EA1o \u0111\u1EC1 thi ho\xE0n ch\u1EC9nh v\u1EDBi \u0111\u1EA7y \u0111\u1EE7 ${totalRequested} c\xE2u theo \u0111\xFAng s\u1ED1 l\u01B0\u1EE3ng t\u1EEBng ph\u1EA7n \u1EDF tr\xEAn. B\xE1m s\xE1t c\xE1c t\u1EC7p t\xE0i li\u1EC7u ngu\u1ED3n (Ma tr\u1EADn, B\u1EA3n \u0111\u1EB7c t\u1EA3, C\u01A1 s\u1EDF d\u1EEF li\u1EC7u b\xE0i t\u1EADp m\u1EABu) n\u1EBFu c\xF3. \u0110\u1EA3m b\u1EA3o \u0111\xE1p \xE1n ch\xEDnh x\xE1c 100%, l\u1EDDi gi\u1EA3i c\u1EF1c k\u1EF3 chi ti\u1EBFt v\xE0 c\xF4ng th\u1EE9c To\xE1n/L\xFD/H\xF3a s\u1EED d\u1EE5ng LaTeX $...$.`;
      const binaryFiles = fileAttachments.filter((f) => f.base64 && f.mimeType);
      for (const bFile of binaryFiles) {
        promptParts.push({
          text: `[\u0110\xCDNH K\xC8M T\u1EC6P: ${bFile.fileName} - Ph\xE2n lo\u1EA1i: ${bFile.categoryLabel || bFile.category}]`
        });
        promptParts.push({
          inlineData: {
            mimeType: bFile.mimeType,
            data: bFile.base64
          }
        });
      }
      promptParts.push({ text: userPromptText });
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: promptParts,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              examTitle: {
                type: Type.STRING,
                description: "Ti\xEAu \u0111\u1EC1 \u0111\u1EC1 thi/ki\u1EC3m tra, v\xED d\u1EE5: \u0110\u1EC0 KI\u1EC2M TRA \u0110\xC1NH GI\xC1 CH\u1EA4T L\u01AF\u1EE2NG M\xD4N V\u1EACT L\xDD 12 - CH\u01AF\u01A0NG DAO \u0110\u1ED8NG C\u01A0"
              },
              durationMinutes: {
                type: Type.INTEGER,
                description: "Th\u1EDDi gian l\xE0m b\xE0i \u0111\u1EC1 xu\u1EA5t (v\xED d\u1EE5: 45, 50, 90)"
              },
              questions: {
                type: Type.ARRAY,
                description: "Danh s\xE1ch c\xE1c c\xE2u h\u1ECFi theo chu\u1EA9n GDPT 2018",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    part: {
                      type: Type.STRING,
                      description: "PART_1 (Nhi\u1EC1u l\u1EF1a ch\u1ECDn), PART_2 (\u0110\xFAng/Sai), PART_3 (Tr\u1EA3 l\u1EDDi ng\u1EAFn), PART_4 (T\u1EF1 lu\u1EADn)"
                    },
                    type: {
                      type: Type.STRING,
                      description: "multiple_choice | true_false | short_answer | essay"
                    },
                    bloomLevel: {
                      type: Type.STRING,
                      description: "Nh\u1EADn bi\u1EBFt | Th\xF4ng hi\u1EC3u | V\u1EADn d\u1EE5ng | V\u1EADn d\u1EE5ng cao"
                    },
                    content: {
                      type: Type.STRING,
                      description: "N\u1ED9i dung c\xE2u h\u1ECFi ho\u1EB7c b\xE0i to\xE1n d\u1EABn d\u1EAFt. S\u1EED d\u1EE5ng $...$ cho c\xF4ng th\u1EE9c to\xE1n/l\xFD/h\xF3a."
                    },
                    score: {
                      type: Type.NUMBER,
                      description: "\u0110i\u1EC3m s\u1ED1 c\u1EE7a c\xE2u"
                    },
                    options: {
                      type: Type.ARRAY,
                      description: "Cho c\xE2u tr\u1EAFc nghi\u1EC7m nhi\u1EC1u ph\u01B0\u01A1ng \xE1n (Ph\u1EA7n I). G\u1ED3m 4 ph\u1EA7n t\u1EED A, B, C, D.",
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          key: { type: Type.STRING, description: "A, B, C ho\u1EB7c D" },
                          text: { type: Type.STRING, description: "N\u1ED9i dung ph\u01B0\u01A1ng \xE1n" }
                        },
                        required: ["key", "text"]
                      }
                    },
                    correctAnswer: {
                      type: Type.STRING,
                      description: "Cho Ph\u1EA7n I: A/B/C/D. Cho Ph\u1EA7n III: \u0110\xE1p s\u1ED1 s\u1ED1 h\u1ECDc (vd 12,5). Cho Ph\u1EA7n IV: L\u1EDDi gi\u1EA3i m\u1EABu t\xF3m t\u1EAFt."
                    },
                    subQuestions: {
                      type: Type.ARRAY,
                      description: "Cho c\xE2u \u0110\xFAng/Sai (Ph\u1EA7n II). G\u1ED3m 4 m\u1EC7nh \u0111\u1EC1 a, b, c, d.",
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          key: { type: Type.STRING, description: "a, b, c ho\u1EB7c d" },
                          statement: { type: Type.STRING, description: "N\u1ED9i dung m\u1EC7nh \u0111\u1EC1" },
                          isCorrect: { type: Type.BOOLEAN, description: "true n\u1EBFu \u0110\xFAng, false n\u1EBFu Sai" },
                          explanation: { type: Type.STRING, description: "Gi\u1EA3i th\xEDch ng\u1EAFn g\u1ECDn t\u1EA1i sao \u0111\xFAng ho\u1EB7c sai" }
                        },
                        required: ["key", "statement", "isCorrect"]
                      }
                    },
                    explanation: {
                      type: Type.STRING,
                      description: "H\u01B0\u1EDBng d\u1EABn gi\u1EA3i chi ti\u1EBFt t\u1EEBng b\u01B0\u1EDBc, ph\xE2n t\xEDch ki\u1EBFn th\u1EE9c v\xE0 \u0111\xE1p \xE1n \u0111\xFAng."
                    }
                  },
                  required: ["part", "type", "bloomLevel", "content", "explanation"]
                }
              }
            },
            required: ["examTitle", "questions"]
          }
        }
      });
      const responseText = response.text;
      if (!responseText) {
        throw new Error("Kh\xF4ng nh\u1EADn \u0111\u01B0\u1EE3c ph\u1EA3n h\u1ED3i t\u1EEB m\xF4 h\xECnh AI.");
      }
      const parsedData = JSON.parse(responseText);
      const formattedQuestions = (parsedData.questions || []).map((q, idx) => ({
        ...q,
        id: `q_${Date.now()}_${idx + 1}`,
        score: q.score || (q.part === "PART_2" ? 1 : q.part === "PART_3" ? 0.5 : q.part === "PART_4" ? 1 : 0.25)
      }));
      return res.json({
        success: true,
        examTitle: parsedData.examTitle || `\u0110\u1EC0 KI\u1EC2M TRA M\xD4N ${subject.toUpperCase()} ${grade.toUpperCase()}`,
        durationMinutes: parsedData.durationMinutes || 45,
        gradeLevel,
        grade,
        subject,
        language,
        questions: formattedQuestions
      });
    } catch (error) {
      console.error("API /api/generate-quiz error:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "L\u1ED7i x\u1EED l\xFD sinh \u0111\u1EC1 thi t\u1EEB h\u1EC7 th\u1ED1ng AI."
      });
    }
  });
  const distPath = path.resolve(__dirname, "dist");
  const indexHtmlPath = path.resolve(distPath, "index.html");
  const hasDist = fs.existsSync(indexHtmlPath);
  if (process.env.NODE_ENV === "production" || hasDist) {
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(indexHtmlPath);
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  }
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
