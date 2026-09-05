const app = require('./app');
const { hasKey, provider } = require('./services/llm');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`PortfolioPath API listening on http://localhost:${PORT}`);
  if (!hasKey) {
    console.log('No LLM provider configured (GEMINI_API_KEY / ANTHROPIC_API_KEY) — assessments/chatbot will use mock responses.');
  } else {
    console.log(`LLM provider: ${provider}`);
  }
});
