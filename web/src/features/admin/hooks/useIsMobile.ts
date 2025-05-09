'use client';

import { useEffect, useState } from 'react';

/**
 * useIsMobile
 * Erkennt, ob das aktuelle Gerät ein Mobilgerät ist (Breakpoint: 768px).
 * @returns {boolean} true, wenn mobil, sonst false
 */
const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

export default useIsMobile; 