import React from 'react';
import Block from './Block/Block';
import AspectRatioBox from '../../UI/AspectRatio/AspectRatioBox';
import styles from './Board.module.scss';

const Board = ({ values, activePos, cellClickedHandler }) => {
  // active value
  let activeVal = 0;
  if (activePos) {
    const [row, col] = activePos;
    activeVal = values[row][col].value;
  }

  return (
    <AspectRatioBox ratio={1.0}>
      <div className={styles.SudokuBoard}>
        <div className={styles.Row}>
          <Block
            rowStart={0}
            colStart={0}
            activePos={activePos}
            activeVal={activeVal}
            values={values}
            cellClickedHandler={cellClickedHandler}
          />
          <Block
            rowStart={0}
            colStart={3}
            activePos={activePos}
            activeVal={activeVal}
            values={values}
            cellClickedHandler={cellClickedHandler}
          />
          <Block
            rowStart={0}
            colStart={6}
            activePos={activePos}
            activeVal={activeVal}
            values={values}
            cellClickedHandler={cellClickedHandler}
          />
        </div>
        <div className={styles.Row}>
          <Block
            rowStart={3}
            colStart={0}
            activePos={activePos}
            activeVal={activeVal}
            values={values}
            cellClickedHandler={cellClickedHandler}
          />
          <Block
            rowStart={3}
            colStart={3}
            activePos={activePos}
            activeVal={activeVal}
            values={values}
            cellClickedHandler={cellClickedHandler}
          />
          <Block
            rowStart={3}
            colStart={6}
            activePos={activePos}
            activeVal={activeVal}
            values={values}
            cellClickedHandler={cellClickedHandler}
          />
        </div>
        <div className={styles.Row}>
          <Block
            rowStart={6}
            colStart={0}
            activePos={activePos}
            activeVal={activeVal}
            values={values}
            cellClickedHandler={cellClickedHandler}
          />
          <Block
            rowStart={6}
            colStart={3}
            activePos={activePos}
            activeVal={activeVal}
            values={values}
            cellClickedHandler={cellClickedHandler}
          />
          <Block
            rowStart={6}
            colStart={6}
            activePos={activePos}
            activeVal={activeVal}
            values={values}
            cellClickedHandler={cellClickedHandler}
          />
        </div>
      </div>
    </AspectRatioBox>
  );
};

export default Board;
