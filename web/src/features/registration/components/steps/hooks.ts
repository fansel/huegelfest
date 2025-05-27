import { useState, useRef, useEffect } from 'react';

// Custom hook für Keyboard Detection
export function useKeyboardVisible() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const initialViewportHeight = useRef<number | null>(null);

  useEffect(() => {
    // iOS Safari specific detection
    const visualViewport = window.visualViewport;
    
    if (visualViewport) {
      // Store initial height for comparison
      initialViewportHeight.current = visualViewport.height;
      
      const handleResize = () => {
        if (!initialViewportHeight.current) return;
        
        // Keyboard is likely open if viewport height is significantly less than initial height
        // Usually keyboards take at least 30% of the screen
        const heightDifference = initialViewportHeight.current - visualViewport.height;
        const heightRatio = visualViewport.height / initialViewportHeight.current;
        setIsKeyboardVisible(heightRatio < 0.7 || heightDifference > 150);
      };
      
      visualViewport.addEventListener('resize', handleResize);
      return () => visualViewport.removeEventListener('resize', handleResize);
    } else {
      // Fallback detection based on window size
      initialViewportHeight.current = window.innerHeight;
      
      const handleResize = () => {
        if (!initialViewportHeight.current) return;
        const heightRatio = window.innerHeight / initialViewportHeight.current;
        setIsKeyboardVisible(heightRatio < 0.7);
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  return isKeyboardVisible;
}

// Hook für auto-scroll zum fokussierten Element
export function useAutoScrollOnFocus(containerRef: React.RefObject<HTMLElement>, isKeyboardVisible: boolean) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleFocus = (e: FocusEvent) => {
      if (!isKeyboardVisible) return;
      
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        // Warte kurz, bis die Tastatur vollständig geöffnet ist
        setTimeout(() => {
          const targetRect = target.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          
          // Berechne, wie weit wir scrollen müssen
          const targetCenter = targetRect.top + targetRect.height/2;
          const containerCenter = containerRect.top + containerRect.height/2;
          const scrollOffset = targetCenter - containerCenter;
          
          container.scrollBy({
            top: scrollOffset,
            behavior: 'smooth'
          });
        }, 300);
      }
    };

    document.addEventListener('focus', handleFocus, true);
    return () => document.removeEventListener('focus', handleFocus, true);
  }, [containerRef, isKeyboardVisible]);
} 