import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT || 3000);
const MODEL = process.env.OPENAI_MODEL || 'gpt-6-astra';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const BASE_INSTRUCTIONS = `
あなたは「SUKIBI AI（スキビアイ）」です。日本語を中心に、自然で親しみやすく、高性能な汎用AIアシスタントとして回答してください。
- ユーザーの意図を読み取り、必要なところは整理してから答える。
- 正確さを優先し、分からないことは分からないと明示する。
- 日常会話では自然に、タスクでは実行可能な形で具体的に答える。
- 小学生にも分かる説明を求められたら、難しい言葉をかみくだく。
- コードは、求められた場合にそのまま使いやすい形で提示する。
- 返答は冗長にしすぎず、必要なら見出しや箇条書きを使う。
`;

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant'))
    .slice(-24)
    .map((m) => ({ role: m.role, content: String(m.content ?? '').slice(0, 12000) }));
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, configured: Boolean(openai), model: MODEL });
});

app.post('/api/chat', async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({
        error: 'OPENAI_API_KEY が設定されていません。サーバーの .env に API キーを設定してください。'
      });
    }

    const { messages, mode = 'chat', webSearch = false } = req.body ?? {};
    const safeMessages = sanitizeMessages(messages);
    if (!safeMessages.length || safeMessages.at(-1)?.role !== 'user') {
      return res.status(400).json({ error: 'ユーザーメッセージが必要です。' });
    }

    const modeInstruction = mode === 'task'
      ? '\n今は「タスクモード」です。目的を最優先し、完成物・手順・確認事項を明確にしてください。ユーザーが頼んだ作業そのものをできる限り具体化してください。'
      : '\n今は「会話モード」です。自然な会話として応答しつつ、必要な場合は具体的な提案もしてください。';

    const response = await openai.responses.create({
      model: MODEL,
      instructions: BASE_INSTRUCTIONS + modeInstruction,
      input: safeMessages,
      ...(webSearch ? { tools: [{ type: 'web_search' }] } : {})
    });

    res.json({ text: response.output_text || '回答を取得できませんでした。', responseId: response.id });
  } catch (error) {
    console.error(error);
    const status = Number(error?.status) || 500;
    res.status(status).json({
      error: error?.message || 'AIとの通信中にエラーが発生しました。'
    });
  }
});

app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`SUKIBI AI is running at http://localhost:${PORT}`);
});
