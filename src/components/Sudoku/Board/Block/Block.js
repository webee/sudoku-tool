import React from 'react';
import Cell from './Cell/Cell';
import styles from './Block.module.scss';

const Block = ({ values, rowStart, colStart }) => {
  const isOdd = (rowStart + colStart) % 2 === 1;
  return (
    <div className={`${styles.Block} ${isOdd ? styles.Odd : ''}`}>
      <div className={styles.Row}>
        <Cell {...values[rowStart][colStart]} />
        <Cell {...values[rowStart][colStart + 1]} />
        <Cell {...values[rowStart][colStart + 2]} />
      </div>
      <div className={styles.Row}>
        <Cell {...values[rowStart + 1][colStart]} />
        <Cell {...values[rowStart + 1][colStart + 1]} />
        <Cell {...values[rowStart + 1][colStart + 2]} />
      </div>
      <div className={styles.Row}>
        <Cell {...values[rowStart + 2][colStart]} />
        <Cell {...values[rowStart + 2][colStart + 1]} />
        <Cell {...values[rowStart + 2][colStart + 2]} />
      </div>
    </div>
  );
};

export default Block;
