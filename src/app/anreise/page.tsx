'use client';

import Link from 'next/link';
import Content from './content/page';
import Starfield from '@/components/Starfield';
import styles from "./page.module.css";

export default function Anreise() {
  return (
    <div className={styles.container}>
      <Link href="/" className={styles.backButton}>
        ← Zurück zur Startseite
      </Link>
      <Starfield />
      <Content />
    </div>
  );
} 