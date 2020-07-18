import React from 'react';
import styles from './Cell.module.scss';

const Cell = ({ value = 0, points = [] }) => {
  if (value !== 0) {
    return <div className={styles.CellValue}>{value}</div>;
  }
  return (
    <div className={styles.CellPoints}>
      <div className={styles.PointRow}>
        <div className={styles.Point}>1</div>
        <div className={styles.Point}>2</div>
        <div className={styles.Point}>3</div>
      </div>
      <div className={styles.PointRow}>
        <div className={styles.Point}>4</div>
        <div className={styles.Point}>5</div>
        <div className={styles.Point}>6</div>
      </div>
      <div className={styles.PointRow}>
        <div className={styles.Point}>7</div>
        <div className={styles.Point}>8</div>
        <div className={styles.Point}>9</div>
      </div>
    </div>
  );
};

export default Cell;
