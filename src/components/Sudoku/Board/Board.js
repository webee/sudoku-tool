import React, { useState, useCallback } from 'react';
import Block from './Block/Block';
import AspectRatioBox from '../../UI/AspectRatioBox/AspectRatioBox';
import styles from './Board.module.scss';

const Board = ({ values }) => {
  // [row, col]
  const [activePos, setActivePos] = useState([-1, -1, -1]);

  const cellClickedHandler = useCallback((block, row, col) => {
    // position
    setActivePos(([curBlock, curRow, curCol]) => {
      if (block === curBlock && row === curRow && col === curCol) {
        // cancel select
        return [-1, -1, -1];
      }
      return [block, row, col];
    });
  }, []);

  // active value
  let activeVal = 0;
  const [block, row, col] = activePos;
  if (block >= 0 && row >= 0 && col >= 0) {
    activeVal = values[row][col].value;
  }

  return (
    <AspectRatioBox ratio={1.0}>
      <div className={styles.SudokuBoard}>
        <div className={styles.Row}>
          <Block
            block={0}
            rowStart={0}
            colStart={0}
            activePos={activePos}
            activeVal={activeVal}
            values={values}
            cellClickedHandler={cellClickedHandler}
          />
          <Block
            block={1}
            rowStart={0}
            colStart={3}
            activePos={activePos}
            activeVal={activeVal}
            values={values}
            cellClickedHandler={cellClickedHandler}
          />
          <Block
            block={2}
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
            block={3}
            rowStart={3}
            colStart={0}
            activePos={activePos}
            activeVal={activeVal}
            values={values}
            cellClickedHandler={cellClickedHandler}
          />
          <Block
            block={4}
            rowStart={3}
            colStart={3}
            activePos={activePos}
            activeVal={activeVal}
            values={values}
            cellClickedHandler={cellClickedHandler}
          />
          <Block
            block={5}
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
            block={6}
            rowStart={6}
            colStart={0}
            activePos={activePos}
            activeVal={activeVal}
            values={values}
            cellClickedHandler={cellClickedHandler}
          />
          <Block
            block={7}
            rowStart={6}
            colStart={3}
            activePos={activePos}
            activeVal={activeVal}
            values={values}
            cellClickedHandler={cellClickedHandler}
          />
          <Block
            block={8}
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
