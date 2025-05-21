'use client';

import Link from 'next/link';
import Content from './content/page';
import styles from "./page.module.css";
import { useDeviceContext } from '@/shared/contexts/DeviceContext';  

interface AnreiseProps {
  allowClipboard?: boolean;
}

export default function Anreise({ allowClipboard = false }: AnreiseProps) {
  const { deviceType } = useDeviceContext();
  const isMobile = deviceType === 'mobile';


  return (
    <>
      {!isMobile && (
        <Link href="/" className={styles.backButton}>
          ← Zurück zur Startseite
        </Link>
      )}
      <div className={styles.container}>
        <Content allowClipboard={allowClipboard} />
      </div>
    </>
  );
} 