import React from 'react';
import styles from './Cell.module.scss';
import digits from '../../../../UI/Digits/Digits';

const Cell = ({ value, origin }) => {
  if (typeof value === 'number') {
    const classes = [styles.Value];
    !origin && classes.push(styles.Placed);
    return (
      <div className={classes.join(' ')} onClick={() => {}}>
        {digits[value]}
      </div>
    );
  }
  // Set: [1-9]
  const notes = value;
  return (
    <div className={styles.Notes}>
      <div className={styles.RowNotes}>
        <div className={styles.Note}>{notes.has(1) ? digits[1] : null}</div>
        <div className={styles.Note}>{notes.has(2) ? digits[2] : null}</div>
        <div className={styles.Note}>{notes.has(3) ? digits[3] : null}</div>
      </div>
      <div className={styles.RowNotes}>
        <div className={styles.Note}>{notes.has(4) ? digits[4] : null}</div>
        <div className={styles.Note}>{notes.has(5) ? digits[5] : null}</div>
        <div className={styles.Note}>{notes.has(6) ? digits[6] : null}</div>
      </div>
      <div className={styles.RowNotes}>
        <div className={styles.Note}>{notes.has(7) ? digits[7] : null}</div>
        <div className={styles.Note}>{notes.has(8) ? digits[8] : null}</div>
        <div className={styles.Note}>{notes.has(9) ? digits[9] : null}</div>
      </div>
    </div>
  );
};

export default Cell;
