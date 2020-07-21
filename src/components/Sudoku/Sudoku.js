import React, { useState, useCallback, useMemo } from 'react';
import Board from './Board/Board';
import Controls from './Controls/Controls';
import styles from './Sudoku.module.scss';
import * as sudoku from './sukodu';

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
  const [values, setValues] = useState(() => sudoku.parsePuzzle(puzzle));
  // {pos:[row, col], val:0}
  const [activeState, setActiveState] = useState({ pos: null, val: 0 });
  const { pos: activePos, val: activeVal } = activeState;

  const updateValues = useCallback((row, col, value) => {
    setValues(curValues => {
      const oldValue = curValues[row][col];
      if (oldValue.origin) {
        // can't set origin value
        return curValues;
      }

      if (oldValue.value === value) {
        // cancel current value
        value = new Set();
      }

      const newValues = [...curValues];
      newValues[row] = [...curValues[row]];
      newValues[row][col] = {
        ...oldValue,
        value,
      };
      return newValues;
    });
  }, []);

  const cellClickedHandler = useCallback(
    (row, col) => {
      if (activeVal !== 0) {
        // place or note
        updateValues(row, col, activeVal);
      } else {
        // select position
        setActiveState(({ pos: curActivePos }) => {
          let pos = [row, col];
          if (curActivePos) {
            const [curRow, curCol] = curActivePos;
            if (row === curRow && col === curCol) {
              // cancel current selected
              pos = null;
            }
          }
          return { pos, val: 0 };
        });
      }
    },
    [activeVal, updateValues]
  );

  const digitClickedHandler = useCallback(
    d => {
      if (activePos) {
        // place or note
        const [activeRow, activeCol] = activePos;
        updateValues(activeRow, activeCol, d);
      } else {
        // active a value
        setActiveState(({ val: curActiveVal }) => {
          let val = d;
          if (curActiveVal === d) {
            // cancel active
            val = 0;
          }
          return { pos: null, val };
        });
      }
    },
    [activePos, updateValues]
  );

  const availableDigits = useMemo(
    () => sudoku.calcAvailableDigits(values, activePos),
    [activePos, values]
  );
  const remainingDigits = useMemo(() => sudoku.calcRemainingDigits(values), [
    values,
  ]);
  const availableCells = useMemo(
    () => sudoku.calcAvailableCells(values, activeVal),
    [activeVal, values]
  );

  return (
    <div className={styles.Sudoku}>
      <div className={styles.Board}>
        <Board
          values={values}
          activeVal={activeVal}
          activePos={activePos}
          availableCells={availableCells}
          cellClickedHandler={cellClickedHandler}
        />
      </div>
      <div>
        <Controls
          activeVal={activeVal}
          availableDigits={availableDigits}
          remainingDigits={remainingDigits}
          digitClickedHandler={digitClickedHandler}
        />
      </div>
    </div>
  );
};

export default Sudoku;
