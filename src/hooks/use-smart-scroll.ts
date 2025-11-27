import { useRef, useCallback, useEffect, useState } from "react";

interface UseSmartScrollOptions {
  threshold?: number;
  smooth?: boolean;
}

export const useSmartScroll = (options: UseSmartScrollOptions = {}) => {
  const { threshold = 100, smooth = true } = options;
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  // Check if user is at the bottom of the scroll container
  const checkIfAtBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollHeight - scrollTop - clientHeight < threshold;
  }, [threshold]);

  // Scroll to bottom
  const scrollToBottom = useCallback((force = false) => {
    if (!force && !isAtBottom) {
      setHasNewMessages(true);
      return;
    }
    
    endRef.current?.scrollIntoView({ 
      behavior: smooth ? "smooth" : "auto",
      block: "end"
    });
    setHasNewMessages(false);
  }, [isAtBottom, smooth]);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    const atBottom = checkIfAtBottom();
    setIsAtBottom(atBottom);
    if (atBottom) {
      setHasNewMessages(false);
    }
  }, [checkIfAtBottom]);

  // Setup scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Scroll to new messages button handler
  const scrollToNewMessages = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    setHasNewMessages(false);
    setIsAtBottom(true);
  }, []);

  return {
    containerRef,
    endRef,
    isAtBottom,
    hasNewMessages,
    scrollToBottom,
    scrollToNewMessages,
  };
};
