import React from 'react';
import Block from './Block/Block';
import AspectRatioBox from '../../UI/AspectRatio/AspectRatioBox';
import Arrow from './Arrow';
import Frame from './Frame';
import styles from './Board.module.scss';
import * as positions from '../../../libs/position';

const Board = ({
  isComplete,
  availablePositions,
  cells,
  activeVal,
  activePos,
  cellClickedHandler,
  showAvail,
  isNoting,
  marks,
}) => {
  // active value
  if (activePos) {
    // no active value, then selected value is active value for board
    const { row, col } = activePos;
    activeVal = cells[row][col].value;
  }

  const classes = [styles.SudokuBoard];
  if (isComplete) {
    classes.push(styles.Complete);
  }
  return (
    <AspectRatioBox ratio={1.0}>
      <div className={classes.join(' ')}>
        {marks && marks.frames && marks.frames.map(frame => <Frame {...frame} />)}
        {marks &&
          marks.arrows &&
          marks.arrows.map((arrow, idx) => <Arrow key={`${arrow.startPos}-${arrow.endPos}#${idx}`} {...arrow} />)}
        {positions.blockShape.map((rows, idx) => (
          <div key={idx} className={styles.Row}>
            {rows.map(b => (
              <Block
                key={b}
                block={b}
                cells={cells}
                activePos={activePos}
                activeVal={activeVal}
                availableCells={availablePositions}
                cellClickedHandler={cellClickedHandler}
                showAvail={showAvail}
                isNoting={isNoting}
                marks={marks}
              />
            ))}
          </div>
        ))}
      </div>
    </AspectRatioBox>
  );
};

export default Board;
