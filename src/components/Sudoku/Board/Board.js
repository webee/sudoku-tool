import React from 'react';
import Block from './Block/Block';
import AspectRatioBox from '../../UI/AspectRatioBox/AspectRatioBox';
import styles from './Board.module.scss';

const Board = ({ values }) => {
  return (
    <AspectRatioBox ratio={1.0}>
      <div className={styles.SudokuBoard}>
        <div className={styles.Row}>
          <Block values={values} rowStart={0} colStart={0} />
          <Block values={values} rowStart={0} colStart={3} />
          <Block values={values} rowStart={0} colStart={6} />
        </div>
        <div className={styles.Row}>
          <Block values={values} rowStart={3} colStart={0} />
          <Block values={values} rowStart={3} colStart={3} />
          <Block values={values} rowStart={3} colStart={6} />
        </div>
        <div className={styles.Row}>
          <Block values={values} rowStart={6} colStart={0} />
          <Block values={values} rowStart={6} colStart={3} />
          <Block values={values} rowStart={6} colStart={6} />
        </div>
      </div>
    </AspectRatioBox>
  );
};

export default Board;
