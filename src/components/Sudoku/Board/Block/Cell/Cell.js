import React from 'react';
import styles from './Cell.module.scss';
import digits from '../../../../UI/Digits/Digits';

const Cell = ({ value = 0, points = [] }) => {
  if (value !== 0) {
    return <div className={styles.CellValue}>{digits[value]}</div>;
  }
  return (
    <div className={styles.CellPoints}>
      <div className={styles.PointRow}>
        <div className={styles.Point}>{digits[1]}</div>
        <div className={styles.Point}>{digits[2]}</div>
        <div className={styles.Point}>{digits[3]}</div>
      </div>
      <div className={styles.PointRow}>
        <div className={styles.Point}>{digits[4]}</div>
        <div className={styles.Point}>{digits[5]}</div>
        <div className={styles.Point}>{digits[6]}</div>
      </div>
      <div className={styles.PointRow}>
        <div className={styles.Point}>{digits[7]}</div>
        <div className={styles.Point}>{digits[8]}</div>
        <div className={styles.Point}>{digits[9]}</div>
      </div>
    </div>
  );
};

export default Cell;
