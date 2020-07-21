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
  // [row, col]
  const [activePos, setActivePos] = useState(null);
  // const [activeVal, setActiveVal] = useState(0);

  const cellClickedHandler = useCallback((row, col) => {
    // position
    setActivePos(curActivePos => {
      if (curActivePos) {
        const [curRow, curCol] = curActivePos;
        if (row === curRow && col === curCol) {
          // cancel current selected
          return null;
        }
      }
      return [row, col];
    });
  }, []);

  const digitClickedHandler = useCallback(
    value => {
      if (activePos) {
        const [activeRow, activeCol] = activePos;
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
    [activePos]
  );

  const availableDigits = useMemo(
    () => sudoku.calcAvailableDigits(values, activePos),
    [activePos, values]
  );
  const remainingDigits = useMemo(() => sudoku.calcRemainingDigits(values), [
    values,
  ]);

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
          remainingDigits={remainingDigits}
          digitClickedHandler={digitClickedHandler}
        />
      </div>
    </div>
  );
};

export default Sudoku;
