import React from 'react';
import styles from './Starfield.module.css';

const Starfield: React.FC = () => {
  return (
    <div className={styles.starfield}>
      <div className={styles.stars}></div>
      <div className={styles.stars}></div>
      <div className={styles.stars}></div>
    </div>
  );
};

export default Starfield; 