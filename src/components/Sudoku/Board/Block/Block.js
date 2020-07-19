import React from 'react';
import Cell from './Cell/Cell';
import styles from './Block.module.scss';

const Block = ({
  block,
  rowStart,
  colStart,
  activePos,
  activeVal,
  values,
  cellClickedHandler,
}) => {
  const isOdd = (rowStart + colStart) % 2 === 1;
  return (
    <div className={`${styles.Block} ${isOdd ? styles.Odd : ''}`}>
      <div className={styles.Row}>
        <Cell
          {...values[rowStart][colStart]}
          block={block}
          row={rowStart}
          col={colStart}
          activePos={activePos}
          activeVal={activeVal}
          onClick={cellClickedHandler}
        />
        <Cell
          {...values[rowStart][colStart + 1]}
          block={block}
          row={rowStart}
          col={colStart + 1}
          activePos={activePos}
          activeVal={activeVal}
          onClick={cellClickedHandler}
        />
        <Cell
          {...values[rowStart][colStart + 2]}
          block={block}
          row={rowStart}
          col={colStart + 2}
          activePos={activePos}
          activeVal={activeVal}
          onClick={cellClickedHandler}
        />
      </div>
      <div className={styles.Row}>
        <Cell
          {...values[rowStart + 1][colStart]}
          block={block}
          row={rowStart + 1}
          col={colStart}
          activePos={activePos}
          activeVal={activeVal}
          onClick={cellClickedHandler}
        />
        <Cell
          {...values[rowStart + 1][colStart + 1]}
          block={block}
          row={rowStart + 1}
          col={colStart + 1}
          activePos={activePos}
          activeVal={activeVal}
          onClick={cellClickedHandler}
        />
        <Cell
          {...values[rowStart + 1][colStart + 2]}
          block={block}
          row={rowStart + 1}
          col={colStart + 2}
          activePos={activePos}
          activeVal={activeVal}
          onClick={cellClickedHandler}
        />
      </div>
      <div className={styles.Row}>
        <Cell
          {...values[rowStart + 2][colStart]}
          block={block}
          row={rowStart + 2}
          col={colStart}
          activePos={activePos}
          activeVal={activeVal}
          onClick={cellClickedHandler}
        />
        <Cell
          {...values[rowStart + 2][colStart + 1]}
          block={block}
          row={rowStart + 2}
          col={colStart + 1}
          activePos={activePos}
          activeVal={activeVal}
          onClick={cellClickedHandler}
        />
        <Cell
          {...values[rowStart + 2][colStart + 2]}
          block={block}
          row={rowStart + 2}
          col={colStart + 2}
          activePos={activePos}
          activeVal={activeVal}
          onClick={cellClickedHandler}
        />
      </div>
    </div>
  );
};

export default Block;
