import React, { useState, useCallback } from 'react';
import Board from './Board/Board';
import Controls from './Controls/Controls';
import styles from './Sudoku.module.scss';

const puzzle = `
901002708
570060000
00n2368N00n579N004
000000000
700421900
000098030
300506070
0090030n2468N0
000080p351
`;

const Sudoku = () => {
  const [values, setValues] = useState(() => parsePuzzle(puzzle));
  // [block, row, col]
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

  const togglePlaceHandler = useCallback(
    value => {
      console.log('OK');
      const [, row, col] = activePos;
      if (row >= 0 && col >= 0) {
        setValues(curValues => {
          const newValues = [...curValues];
          newValues[row] = [...curValues[row]];
          newValues[row][col] = { ...curValues[row][col], value };
          return newValues;
        });
      }
    },
    [activePos]
  );

  return (
    <div className={styles.Sudoku}>
      <div className={styles.Board}>
        <Board
          values={values}
          activePos={activePos}
          cellClickedHandler={cellClickedHandler}
        />
      </div>
      <div>
        <Controls togglePlaceHandler={togglePlaceHandler} />
      </div>
    </div>
  );
};

const cellPattern = /(\d)|(p\d)|(n[1-9]*N)/g;
const valuePattern = /^[1-9]$/;
const parsePuzzle = puzzle => {
  // split cell
  const cells = puzzle.match(cellPattern);
  if (cells.length !== 81) {
    throw new Error('bad sudoku puzzle format');
  }

  // parse values
  const cellValues = cells.map(cell => {
    if (cell.startsWith('n') && cell.endsWith('N')) {
      // it's note
      const notes = cell
        .slice(1, -1)
        .split('')
        .map(s => parseInt(s));
      return { value: new Set(notes) };
    } else if (cell.startsWith('p')) {
      // it's placed value
      return { value: parseInt(cell[1]) };
    } else if (valuePattern.test(cell)) {
      // it's value
      return {
        value: parseInt(cell),
        // puzzle origin value
        origin: true,
      };
    } else if (cell === '0') {
      // it's empty
      return { value: new Set() };
    }
    throw new Error('impossible');
  });

  // organize the values
  const values = Array.from(new Array(9)).map(() => new Array(9));
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      values[i][j] = cellValues[9 * i + j];
    }
  }
  return values;
};

export default Sudoku;
