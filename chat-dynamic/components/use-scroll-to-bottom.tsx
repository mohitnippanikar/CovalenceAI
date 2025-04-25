import { RefObject, useEffect, useRef, useState } from 'react';

/**
 * A hook to automatically scroll to the bottom of a container when content changes
 * @returns [containerRef, endRef] - Refs to attach to the container and end element
 */
export function useScrollToBottom<T extends HTMLElement>(): [RefObject<T>, RefObject<HTMLDivElement>] {
  const containerRef = useRef<T>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  // Trigger scroll when content changes
  const scrollToBottom = () => {
    setShouldScroll(true);
  };

  // Handle the actual scrolling
  useEffect(() => {
    if (shouldScroll && bottomRef.current) {
      // Use multiple timeouts with different delays to ensure scrolling works
      // even if DOM updates are delayed
      const timeoutIds = [
        setTimeout(() => {
          bottomRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'end',
          });
        }, 100),
        setTimeout(() => {
          bottomRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'end',
          });
        }, 300),
        setTimeout(() => {
          bottomRef.current?.scrollIntoView({
            behavior: 'auto', // Fall back to immediate scroll if smooth scroll fails
            block: 'end',
          });
          setShouldScroll(false);
        }, 500)
      ];
      
      return () => timeoutIds.forEach(id => clearTimeout(id));
    }
  }, [shouldScroll]);

  // Expose the scrollToBottom function to the ref's current property
  useEffect(() => {
    if (containerRef.current) {
      // @ts-ignore - Adding our custom property
      containerRef.current.scrollToBottom = scrollToBottom;
    }
    
    // Ensure it's updated if the ref changes
    return () => {
      if (containerRef.current) {
        // @ts-ignore - Cleanup
        delete containerRef.current.scrollToBottom;
      }
    };
  }, []);

  return [containerRef, bottomRef];
} 