'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './PinGate.module.css';

export default function PinGate() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '240203') {
      router.push('/anreise/content');
    } else {
      setError('Falscher PIN');
      setPin('');
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h1 className={styles.title}>PIN eingeben</h1>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className={styles.input}
          placeholder="6-stelliger PIN"
          maxLength={6}
          pattern="[0-9]*"
          inputMode="numeric"
        />
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" className={styles.button}>
          Bestätigen
        </button>
      </form>
    </div>
  );
} 