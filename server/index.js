const app = require('./app');
const { hasKey, provider } = require('./services/llm');
const { seedDemoAccount } = require('./services/demoAccount');

const PORT = process.env.PORT || 4000;

// Seeding is skipped once the account exists, so this runs on every boot and only ever writes on
// the first. A failure here must not take the server down with it — the demo account is a
// convenience, and everything else works without it.
function seedAndAnnounceDemoAccount() {
  try {
    const { seeded, email, password } = seedDemoAccount();
    console.log(`Demo account (${seeded ? 'seeded' : 'already present'}): ${email} / ${password}`);
  } catch (err) {
    console.error('Could not seed the demo account:', err.message);
  }
}

app.listen(PORT, () => {
  console.log(`PortfolioPath API listening on http://localhost:${PORT}`);
  if (!hasKey) {
    console.log('No LLM provider configured (GEMINI_API_KEY / ANTHROPIC_API_KEY) — assessments/chatbot will use mock responses.');
  } else {
    console.log(`LLM provider: ${provider}`);
  }
  seedAndAnnounceDemoAccount();
});
