import React from 'react';
import Cell from './Cell/Cell';
import styles from './Block.module.scss';
import * as positions from '../../../../libs/position';

const Block = ({
  block,
  activePos,
  activeVal,
  cells,
  availableCells,
  cellClickedHandler,
  showAvail,
  isNoting,
  marks,
}) => {
  const isOdd = block % 2 === 1;
  return (
    <div className={`${styles.Block} ${isOdd ? styles.Odd : ''}`}>
      {positions.getBlockPositions(block).map((rows, idx) => (
        <div key={idx} className={styles.Row}>
          {rows.map(pos => (
            <Cell
              key={pos.key}
              {...cells[pos.row][pos.col]}
              pos={pos}
              activePos={activePos}
              activeVal={activeVal}
              available={availableCells && availableCells[pos.row][pos.col]}
              onClick={cellClickedHandler}
              showAvail={showAvail}
              isNoting={isNoting}
              marks={marks}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
export default Block;
