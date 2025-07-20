const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;

app.post('/webhook', async (req, res) => {
  const events = req.body.events;

  for (const event of events) {
    if (event.type !== 'message' || !event.message.text) continue;

    const userText = event.message.text;
    const replyToken = event.replyToken;

    let translatedText = '';

    if (userText.startsWith('中翻泰：')) {
      const original = userText.replace('中翻泰：', '');
      translatedText = await translateWithGPT(`請將以下中文翻譯為泰文：${original}`);
    } else if (userText.startsWith('泰翻中：')) {
      const original = userText.replace('泰翻中：', '');
      translatedText = await translateWithGPT(`請將以下泰文翻譯為繁體中文：${original}`);
    } else {
      return res.sendStatus(200); // 不處理非翻譯請求
    }

    await axios.post('https://api.line.me/v2/bot/message/reply', {
      replyToken,
      messages: [{ type: 'text', text: translatedText }]
    }, {
      headers: { Authorization: `Bearer ${LINE_ACCESS_TOKEN}` }
    });
  }

  res.sendStatus(200);
});

async function translateWithGPT(prompt) {
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: '你是一個語言翻譯助手' },
        { role: 'user', content: prompt }
      ]
    }, {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    return '翻譯失敗，請稍後再試';
  }
}

app.get('/', (req, res) => res.send('Line GPT Bot 正常運行'));
app.listen(3000, () => console.log('Server running on port 3000'));
{
  "name": "line-gpt-translate",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "axios": "^1.6.0",
    "express": "^4.18.2"
  },
  "scripts": {
    "start": "node index.js"
  }
}
