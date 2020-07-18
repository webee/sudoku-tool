import React from 'react';
import Block from './Block/Block';
import AspectRatioBox from '../UI/AspectRatioBox/AspectRatioBox';
import styles from './SudokuBoard.module.scss';

const SudokuBoard = () => {
  return (
    <AspectRatioBox ratio={1.0}>
      <div className={styles.SudokuBoard}>
        <div className={styles.Row}>
          <Block isOdd />
          <Block />
          <Block isOdd />
        </div>
        <div className={styles.Row}>
          <Block />
          <Block isOdd />
          <Block />
        </div>
        <div className={styles.Row}>
          <Block isOdd />
          <Block />
          <Block isOdd />
        </div>
      </div>
    </AspectRatioBox>
  );
};

export default SudokuBoard;
