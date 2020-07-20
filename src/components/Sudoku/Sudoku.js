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

  const [activeBlock, activeRow, activeCol] = activePos;
  const togglePlaceHandler = useCallback(
    value => {
      if (activeRow >= 0 && activeCol >= 0) {
        setValues(curValues => {
          const oldValue = curValues[activeRow][activeCol];
          if (oldValue.origin) {
            // can't set origin value
            return curValues;
          }

          if (oldValue.value === value) {
            // cancel current value
            value = new Set();
          }

          const newValues = [...curValues];
          newValues[activeRow] = [...curValues[activeRow]];
          newValues[activeRow][activeCol] = {
            ...oldValue,
            value,
          };
          return newValues;
        });
      }
    },
    [activeCol, activeRow]
  );

  const availableDigits = calcAvailableDigits(
    values,
    activeBlock,
    activeRow,
    activeCol
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
        <Controls
          availableDigits={availableDigits}
          togglePlaceHandler={togglePlaceHandler}
        />
      </div>
    </div>
  );
};

// functions
// TODO: remove block props.
const cellToBlockMapping = [
  [0, 0, 0, 1, 1, 1, 2, 2, 2],
  [0, 0, 0, 1, 1, 1, 2, 2, 2],
  [0, 0, 0, 1, 1, 1, 2, 2, 2],
  [3, 3, 3, 4, 4, 4, 5, 5, 5],
  [3, 3, 3, 4, 4, 4, 5, 5, 5],
  [3, 3, 3, 4, 4, 4, 5, 5, 5],
  [6, 6, 6, 7, 7, 7, 8, 8, 8],
  [6, 6, 6, 7, 7, 7, 8, 8, 8],
  [6, 6, 6, 7, 7, 7, 8, 8, 8],
];
const calcAvailableDigits = (values, block, row, col) => {
  let res = new Set();
  if (block >= 0 && row >= 0 && col >= 0) {
    const value = values[row][col];
    if (value.origin) {
      // origin can't be changed
      return res;
    }
    res = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const b = cellToBlockMapping[r][c];
        if (b === block && r === row && c === col) {
          continue;
        }
        if (b === block || r === row || c === col) {
          const v = values[r][c].value;
          if (typeof v === 'number') {
            res.delete(v);
          }
        }
      }
    }
  }
  return res;
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
