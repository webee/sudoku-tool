import React from 'react';
import Cell from './Cell/Cell';
import styles from './Block.module.scss';

const Block = ({ isOdd }) => {
  return (
    <div className={`${styles.Block} ${isOdd ? styles.Odd : ''}`}>
      <div className={styles.Row}>
        <Cell value={2} />
        <Cell />
        <Cell />
      </div>
      <div className={styles.Row}>
        <Cell />
        <Cell value={2} />
        <Cell value={2} />
      </div>
      <div className={styles.Row}>
        <Cell value={2} />
        <Cell />
        <Cell value={2} />
      </div>
    </div>
  );
};

export default Block;
