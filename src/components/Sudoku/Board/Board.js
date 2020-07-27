import React, { useMemo } from 'react';
import Block from './Block/Block';
import AspectRatioBox from '../../UI/AspectRatio/AspectRatioBox';
import styles from './Board.module.scss';
import * as sudoku from '../../../libs/sudoku';

const Board = ({
  values,
  activeVal,
  activePos,
  cellClickedHandler,
  showAvail,
  isNoting,
  marks,
}) => {
  // calculated states
  const availableCells = useMemo(
    () => sudoku.calcAvailableCells(values, activeVal),
    [activeVal, values]
  );

  // active value
  if (activePos) {
    // no active value, then selected value is active value for board
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
            availableCells={availableCells}
            cellClickedHandler={cellClickedHandler}
            showAvail={showAvail}
            isNoting={isNoting}
            marks={marks}
          />
          <Block
            rowStart={0}
            colStart={3}
            activePos={activePos}
            activeVal={activeVal}
            values={values}
            availableCells={availableCells}
            cellClickedHandler={cellClickedHandler}
            showAvail={showAvail}
            isNoting={isNoting}
            marks={marks}
          />
          <Block
            rowStart={0}
            colStart={6}
            activePos={activePos}
            activeVal={activeVal}
            values={values}
            availableCells={availableCells}
            cellClickedHandler={cellClickedHandler}
            showAvail={showAvail}
            isNoting={isNoting}
            marks={marks}
          />
        </div>
        <div className={styles.Row}>
          <Block
            rowStart={3}
            colStart={0}
            activePos={activePos}
            activeVal={activeVal}
            values={values}
            availableCells={availableCells}
            cellClickedHandler={cellClickedHandler}
            showAvail={showAvail}
            isNoting={isNoting}
            marks={marks}
          />
          <Block
            rowStart={3}
            colStart={3}
            activePos={activePos}
            activeVal={activeVal}
            values={values}
            availableCells={availableCells}
            cellClickedHandler={cellClickedHandler}
            showAvail={showAvail}
            isNoting={isNoting}
            marks={marks}
          />
          <Block
            rowStart={3}
            colStart={6}
            activePos={activePos}
            activeVal={activeVal}
            values={values}
            availableCells={availableCells}
            cellClickedHandler={cellClickedHandler}
            showAvail={showAvail}
            isNoting={isNoting}
            marks={marks}
          />
        </div>
        <div className={styles.Row}>
          <Block
            rowStart={6}
            colStart={0}
            activePos={activePos}
            activeVal={activeVal}
            values={values}
            availableCells={availableCells}
            cellClickedHandler={cellClickedHandler}
            showAvail={showAvail}
            isNoting={isNoting}
            marks={marks}
          />
          <Block
            rowStart={6}
            colStart={3}
            activePos={activePos}
            activeVal={activeVal}
            values={values}
            availableCells={availableCells}
            cellClickedHandler={cellClickedHandler}
            showAvail={showAvail}
            isNoting={isNoting}
            marks={marks}
          />
          <Block
            rowStart={6}
            colStart={6}
            activePos={activePos}
            activeVal={activeVal}
            values={values}
            availableCells={availableCells}
            cellClickedHandler={cellClickedHandler}
            showAvail={showAvail}
            isNoting={isNoting}
            marks={marks}
          />
        </div>
      </div>
    </AspectRatioBox>
  );
};

export default Board;
