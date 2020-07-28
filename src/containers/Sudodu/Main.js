import React, { useState, useEffect, useCallback } from 'react';
import Button from '../../components/UI/Button/Button';
import Board from '../../components/Sudoku/Board/Board';
import Controls from '../../components/Sudoku/Controls/Controls';
import Modal from '../../components/UI/Modal/Modal';
import QRCode from 'qrcode.react';
import styles from './Main.module.scss';
import * as sudoku from '../../libs/sudoku';
import { useMemo } from 'react';

const Sudoku = ({ puzzle, startNewGameHandler }) => {
  const [showShare, setShowShare] = useState(false);
  const [values, setValues] = useState(() => sudoku.parsePuzzle(puzzle));
  const [initialPuzzle, setInitialPuzzle] = useState(() =>
    sudoku.stringify(values)
  );
  // {pos:[row, col], val:0}
  const [activeState, setActiveState] = useState({ pos: null, val: 0 });
  const { pos: activePos, val: activeVal } = activeState;
  const [showAvail, setShowAvail] = useState(false);
  const [isNoting, setIsNoting] = useState(true);
  const [group, setGroup] = useState(null);

  // handlers
  const cellClickedHandler = useCallback(
    (row, col) => {
      if (activeVal !== 0) {
        // place or note
        setValues(sudoku.updateValues(isNoting, row, col, activeVal));
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
    [activeVal, isNoting, setActiveState, setValues]
  );

  const digitClickedHandler = useCallback(
    d => {
      if (!(d >= 1 && d <= 9)) {
        return;
      }

      if (activePos) {
        // place or note
        const [activeRow, activeCol] = activePos;
        setValues(sudoku.updateValues(isNoting, activeRow, activeCol, d));
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
    [activePos, isNoting]
  );

  const resetHandler = useCallback(() => {
    if (!window.confirm || window.confirm('Are you sure to reset?')) {
      setValues(sudoku.parsePuzzle(initialPuzzle));
      // deselect
      setActiveState({ pos: null, val: 0 });
    }
  }, [initialPuzzle]);

  const eraseValueHandler = useCallback(() => {
    if (activePos) {
      const [activeRow, activeCol] = activePos;
      setValues(sudoku.updateValues(isNoting, activeRow, activeCol, new Set()));
    }
  }, [activePos, isNoting]);

  const deselectHandler = useCallback(() => {
    setActiveState({ pos: null, val: 0 });
  }, []);

  const toggleShowAvailHandler = useCallback(() => {
    setShowAvail(showAvail => !showAvail);
  }, []);

  const toggleIsNotingHandler = useCallback(() => {
    setIsNoting(isNoting => !isNoting);
  }, []);

  const autoNoteHandler = useCallback(() => {
    setValues(sudoku.autoNote);
  }, []);

  const autoPlaceHandler = useCallback(() => {
    setValues(sudoku.autoPlace);
  }, []);

  const pointingHandler = useCallback(() => {
    setValues(sudoku.pointing);
  }, []);

  const claimingHandler = useCallback(() => {
    setValues(sudoku.claiming);
  }, [setValues]);

  const groupHandler = useCallback(() => {
    if (group) {
      // handle group
      setValues(sudoku.eliminateGroup(group));

      // clear
      setGroup(null);
    } else {
      const nextGroup = sudoku.findGroup(values);
      if (nextGroup) {
        console.log(nextGroup);
        setGroup(nextGroup);
      }
    }
  }, [group, values]);

  const marks = useMemo(() => {
    if (group) {
      if (group.domain === 'row') {
        const { row, cells, notes } = group;
        return {
          rows: new Set([row]),
          cells,
          notes,
        };
      } else if (group.domain === 'col') {
        const { col, cells, notes } = group;
        return {
          cols: new Set([col]),
          cells,
          notes,
        };
      } else if (group.domain === 'block') {
        const { block, cells, notes } = group;
        return {
          blocks: new Set([block]),
          cells,
          notes,
        };
      }
    }
  }, [group]);

  // event listeners
  useEffect(() => {
    const keydownHandler = e => {
      // console.log(e);
      // TODO: handler other shortcut keys
      if (e.code.startsWith('Digit')) {
        const d = parseInt(e.key);
        digitClickedHandler(d);
      } else if (e.key === 'N') {
        startNewGameHandler();
      } else if (e.key === 'n') {
        toggleIsNotingHandler();
      } else if (e.key === 'd') {
        deselectHandler();
      } else {
        return;
      }
      e.preventDefault();
    };
    document.addEventListener('keydown', keydownHandler);

    return () => {
      document.removeEventListener('keydown', keydownHandler);
    };
  }, [
    deselectHandler,
    digitClickedHandler,
    startNewGameHandler,
    toggleIsNotingHandler,
  ]);

  useEffect(() => {
    // start new puzzle if receiving puzzle
    if (puzzle !== initialPuzzle) {
      const values = sudoku.parsePuzzle(puzzle);
      setInitialPuzzle(sudoku.stringify(values));
      setValues(values);
    }
  }, [initialPuzzle, puzzle]);

  useEffect(() => {
    // clear group if values changed
    setGroup(null);
  }, [values]);

  let shareContent = null;
  if (showShare) {
    const url = new URL(window.location);
    const curPuzzle = sudoku.stringify(values);
    url.search = '?puzzle=' + curPuzzle;
    shareContent = (
      <div className={styles.QRCode}>
        <QRCode size={256} value={url.toString()} />
        <p>{initialPuzzle}</p>
        <p>{curPuzzle}</p>
      </div>
    );
  }

  return (
    <>
      <Modal show={showShare} close={() => setShowShare(false)}>
        {shareContent}
      </Modal>
      <div className={styles.Menu}>
        <Button onClick={startNewGameHandler}>New</Button>
        <Button onClick={() => setShowShare(true)}>Share</Button>
      </div>
      <div className={styles.Board}>
        <Board
          values={values}
          activeVal={activeVal}
          activePos={activePos}
          cellClickedHandler={cellClickedHandler}
          showAvail={showAvail}
          isNoting={isNoting}
          marks={marks}
        />
      </div>
      <div className={styles.Controls}>
        <Controls
          values={values}
          activePos={activePos}
          activeVal={activeVal}
          digitClickedHandler={digitClickedHandler}
          showAvail={showAvail}
          isNoting={isNoting}
          resetHandler={resetHandler}
          eraseValueHandler={eraseValueHandler}
          deselectHandler={deselectHandler}
          toggleShowAvailHandler={toggleShowAvailHandler}
          toggleIsNotingHandler={toggleIsNotingHandler}
          autoNoteHandler={autoNoteHandler}
          autoPlaceHandler={autoPlaceHandler}
          pointingHandler={pointingHandler}
          claimingHandler={claimingHandler}
          group={group}
          groupHandler={groupHandler}
        />
      </div>
      <div className={styles.Info}></div>
    </>
  );
};

export default Sudoku;
