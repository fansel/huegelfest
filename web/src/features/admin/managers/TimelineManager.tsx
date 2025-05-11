import React, { useEffect, useState } from 'react';
import { useTimeline } from '@/features/timeline/hooks/useTimeline';
import TimelineDesktop from '../components/timeline/TimelineDesktop';
import TimelineMobile from '../components/timeline/TimelineMobile';

/**
 * TimelineManager: Kapselt die Timeline-Logik für das Admin-Panel und rendert die passende UI-Variante.
 *
 * @param forceVariant Optional: 'desktop' oder 'mobile' für explizite Auswahl (z.B. für Tests)
 */
const TimelineManager: React.FC<{ forceVariant?: 'desktop' | 'mobile' }> = ({ forceVariant }) => {
  const timelineApi = useTimeline();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (forceVariant) {
      setIsMobile(forceVariant === 'mobile');
      return;
    }
    // Responsive Breakpoint (Tailwind: md = 768px)
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [forceVariant]);

  if (isMobile) {
    console.log('TimelineMobile Props:', timelineApi);
    return <TimelineMobile {...timelineApi} />;
  }
  return <TimelineDesktop {...timelineApi} />;
};

export default TimelineManager; 