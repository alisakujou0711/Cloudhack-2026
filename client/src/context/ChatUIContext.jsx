import { createContext, useContext, useState } from 'react';

// Ephemeral UI state (panel open/draft text) for the shared chatbot — deliberately NOT persisted
// to localStorage, so other components (e.g. a "Discuss" link on a review bullet) can open the
// chatbot with a prefilled message without wiring props through the whole tree.
const ChatUIContext = createContext(null);

export function ChatUIProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');

  const openWithDraft = (text) => {
    setDraft(text);
    setOpen(true);
  };

  return (
    <ChatUIContext.Provider value={{ open, setOpen, draft, setDraft, openWithDraft }}>
      {children}
    </ChatUIContext.Provider>
  );
}

export function useChatUI() {
  const ctx = useContext(ChatUIContext);
  if (!ctx) throw new Error('useChatUI must be used within ChatUIProvider');
  return ctx;
}
