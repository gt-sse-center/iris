import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

export interface DialogueState {
  title: string;
  content: React.ReactNode;
  closable?: boolean;
  onClose?: () => void;
}

interface UIContextValue {
  loaderText: string | null;
  message: string | null;
  dialogue: DialogueState | null;
  showLoader(text?: string): void;
  hideLoader(): void;
  showMessage(text: string, timeoutMs?: number): void;
  clearMessage(): void;
  showDialogue(state: DialogueState): void;
  hideDialogue(): void;
}

const UIContext = createContext<UIContextValue | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [loaderText, setLoaderText] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [dialogue, setDialogue] = useState<DialogueState | null>(null);
  const messageTimer = useRef<number | null>(null);

  const showLoader = useCallback((text = "Loading...") => {
    setLoaderText(text);
  }, []);

  const hideLoader = useCallback(() => {
    setLoaderText(null);
  }, []);

  const showMessage = useCallback((text: string, timeoutMs = 3000) => {
    setMessage(text);
    if (messageTimer.current) {
      window.clearTimeout(messageTimer.current);
    }
    messageTimer.current = window.setTimeout(() => {
      setMessage(null);
      messageTimer.current = null;
    }, timeoutMs);
  }, []);

  const clearMessage = useCallback(() => {
    if (messageTimer.current) {
      window.clearTimeout(messageTimer.current);
      messageTimer.current = null;
    }
    setMessage(null);
  }, []);

  const showDialogue = useCallback((state: DialogueState) => {
    setDialogue(state);
  }, []);

  const hideDialogue = useCallback(() => {
    setDialogue((current) => {
      if (current?.onClose) {
        current.onClose();
      }
      return null;
    });
  }, []);

  const value = useMemo<UIContextValue>(
    () => ({
      loaderText,
      message,
      dialogue,
      showLoader,
      hideLoader,
      showMessage,
      clearMessage,
      showDialogue,
      hideDialogue
    }),
    [dialogue, hideDialogue, hideLoader, loaderText, message, showDialogue, showLoader, showMessage, clearMessage]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UIContextValue {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUI must be used inside UIProvider");
  }
  return context;
}
