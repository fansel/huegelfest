'use client';

import Link from 'next/link';
import Content from './content/page';
import styles from "./page.module.css";
import { useDeviceType } from '@/shared/contexts/DeviceTypeContext';

interface AnreiseProps {
  allowClipboard?: boolean;
}

export default function Anreise({ allowClipboard = false }: AnreiseProps) {
  const { isPWA } = useDeviceType();

  return (
    <>
      {!isPWA && (
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