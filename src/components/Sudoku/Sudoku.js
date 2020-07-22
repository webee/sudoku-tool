import React, { useState, useCallback, useMemo } from 'react';
import Board from './Board/Board';
import Controls from './Controls/Controls';
import styles from './Sudoku.module.scss';
import * as sudoku from './sukodu';

const puzzle = `
901002708
570060000
000000004
000000000
700421900
000098030
300506070
009003000
000080051
`;

const Sudoku = () => {
  const [values, setValues] = useState(() => sudoku.parsePuzzle(puzzle));
  const [isNoting, setIsNoting] = useState(false);
  // {pos:[row, col], val:0}
  const [activeState, setActiveState] = useState({ pos: null, val: 0 });
  const { pos: activePos, val: activeVal } = activeState;

  const updateValues = useCallback((isNoting, row, col, value) => {
    if (!isNoting) {
      setValues(curValues => {
        const oldValue = curValues[row][col];
        if (oldValue.origin) {
          // can't place/note origin value
          return curValues;
        }

        if (oldValue.value === value) {
          // cancel current value
          value = new Set();
        }

        return sudoku.updateValues(curValues, row, col, value);
      });
    } else {
      setValues(curValues => {
        const oldValue = curValues[row][col];
        if (oldValue.origin) {
          // can't place/note origin value
          return curValues;
        }

        if (typeof oldValue.value === 'number') {
          // can't note cell with value.
          return curValues;
        }

        // note
        const notes = new Set(oldValue.value);
        if (notes.has(value)) {
          notes.delete(value);
        } else {
          notes.add(value);
        }

        return sudoku.updateValues(curValues, row, col, notes);
      });
    }
  }, []);

  const cellClickedHandler = useCallback(
    (row, col) => {
      if (activeVal !== 0) {
        // place or note
        updateValues(isNoting, row, col, activeVal);
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
    [activeVal, isNoting, updateValues]
  );

  const digitClickedHandler = useCallback(
    d => {
      if (activePos) {
        // place or note
        const [activeRow, activeCol] = activePos;
        updateValues(isNoting, activeRow, activeCol, d);
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
    [activePos, isNoting, updateValues]
  );

  const deselectHandler = useCallback(() => {
    setActiveState({ pos: null, val: 0 });
  }, []);

  const toggleIsNotingHandler = useCallback(() => {
    setIsNoting(isNoting => !isNoting);
  }, []);

  const eraseValueHandler = useCallback(() => {
    if (activePos) {
      const [activeRow, activeCol] = activePos;
      setValues(curValues => {
        const oldValue = curValues[activeRow][activeCol];
        if (oldValue.origin) {
          // can't erase origin value
          return curValues;
        }

        // clear placed and noted value.
        return sudoku.updateValues(curValues, activeRow, activeCol, new Set());
      });
    }
  }, [activePos]);

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
          isNoting={isNoting}
        />
      </div>
      <div>
        <Controls
          activeVal={activeVal}
          availableDigits={availableDigits}
          remainingDigits={remainingDigits}
          digitClickedHandler={digitClickedHandler}
          isNoting={isNoting}
          deselectHandler={deselectHandler}
          toggleIsNotingHandler={toggleIsNotingHandler}
          eraseValueHandler={eraseValueHandler}
        />
      </div>
    </div>
  );
};

export default Sudoku;
