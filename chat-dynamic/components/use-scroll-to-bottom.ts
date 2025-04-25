import { useEffect, useRef, RefObject } from "react";

export function useScrollToBottom<T extends HTMLElement>(): [
  RefObject<T>,
  RefObject<T>,
] {
  const containerRef = useRef<T>(null);
  const endRef = useRef<T>(null);

  useEffect(() => {
    const container = containerRef.current;
    const end = endRef.current;

    if (!container || !end) return;

    const observer = new MutationObserver(() => {
      const scrollOptions: ScrollIntoViewOptions = {
        behavior: "smooth",
        block: "end",
      };

      // Small delay to ensure content is rendered
      setTimeout(() => {
        end.scrollIntoView(scrollOptions);
      }, 100);
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
    });

    // Initial scroll
    end.scrollIntoView({ block: "end" });

    return () => observer.disconnect();
  }, []);

  return [containerRef, endRef];
}
