require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRouter = require('./routes/api');
const { hasKey, provider } = require('./services/llm');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/api', apiRouter);

app.listen(PORT, () => {
  console.log(`PortfolioPath API listening on http://localhost:${PORT}`);
  if (!hasKey) {
    console.log('No LLM provider configured (GEMINI_API_KEY / ANTHROPIC_API_KEY) — assessments/chatbot will use mock responses.');
  } else {
    console.log(`LLM provider: ${provider}`);
  }
});
