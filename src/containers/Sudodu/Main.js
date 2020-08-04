import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Button from '../../components/UI/Button/Button';
import Board from '../../components/Sudoku/Board/Board';
import Controls from '../../components/Sudoku/Controls/Controls';
import Modal from '../../components/UI/Modal/Modal';
import QRCode from 'qrcode.react';
import styles from './Main.module.scss';
import * as sudokus from '../../libs/sudoku2';
import { Notes } from '../../libs/sudoku2';
import { getPosition } from '../../libs/position';

const Sudoku = ({ /** @type {sudokus.Sudoku} */ sudoku = new sudokus.Sudoku(), startNewGameHandler, emptyHandler }) => {
  const [showShare, setShowShare] = useState(false);
  const [, setChanged] = useState(0);
  useEffect(() => {
    sudoku.subscribe(setChanged);
    return () => {
      sudoku.unsubscribe(setChanged);
    };
  }, [sudoku]);

  // {pos:[row, col], val:0}
  const [activeState, setActiveState] = useState({ pos: null, val: 0 });
  const { pos: activePos, val: activeVal } = activeState;
  const [showAvail, setShowAvail] = useState(false);
  const [isNoting, setIsNoting] = useState(true);
  const [tip, setTip] = useState(null);

  // calculated states
  const cells = sudoku.cells;
  const availableDigits = useMemo(() => sudoku.calcAvailableDigits(activePos, cells), [activePos, sudoku, cells]);
  const availablePositions = useMemo(() => sudoku.calcAvailablePositions(activeVal, cells), [activeVal, sudoku, cells]);
  const remainingDigits = useMemo(() => sudoku.calcRemainingDigits(cells), [sudoku, cells]);

  // handlers
  const cellClickedHandler = useCallback(
    pos => {
      if (activeVal !== 0) {
        // place or note
        sudoku.updateCellValue(isNoting, pos, activeVal);
      } else {
        // select position
        setActiveState(({ pos: curActivePos }) => {
          if (curActivePos) {
            if (pos === curActivePos) {
              // cancel current selected
              pos = null;
            }
          }
          return { pos, val: 0 };
        });
      }
    },
    [activeVal, isNoting, sudoku]
  );

  const digitClickedHandler = useCallback(
    (d, force = false) => {
      // force active specified digit
      if (!force) {
        if (!availableDigits.has(d)) {
          return;
        }

        if (activePos) {
          // place or note
          sudoku.updateCellValue(isNoting, activePos, d);
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
      } else {
        // active a value
        setActiveState({ pos: null, val: d });
      }
    },
    [activePos, availableDigits, isNoting, sudoku]
  );

  const deselectHandler = useCallback(() => {
    setActiveState({ pos: null, val: 0 });
  }, []);

  const resetHandler = useCallback(() => {
    if (!window.confirm || window.confirm('Are you sure to reset?')) {
      sudoku.reset();
      deselectHandler();
    }
  }, [deselectHandler, sudoku]);

  const eraseValueHandler = useCallback(() => {
    if (activePos) {
      sudoku.updateCellValue(false, activePos, Notes.new());
    }
  }, [activePos, sudoku]);

  const toggleShowAvailHandler = useCallback(() => {
    setShowAvail(showAvail => !showAvail);
  }, []);

  const toggleIsNotingHandler = useCallback(() => {
    setIsNoting(isNoting => !isNoting);
  }, []);

  const autoNoteHandler = useCallback(() => {
    sudoku.autoNote();
  }, [sudoku]);

  const autoPlacePointingClaimingHandler = useCallback(() => {
    sudoku.autoPlacePointingClaiming();
  }, [sudoku]);

  const tipHandler = useCallback(() => {
    if (tip) {
      // clear
      setTip(null);

      // handle tip
      sudoku.handleTip(tip);
    } else {
      // find tip
      const t = sudoku.findTip();
      if (t) {
        console.group('[tip]');
        setTip(t);
        console.log(t);
        if (t.type === 'X-Wing') {
          digitClickedHandler(t.d, true);
        } else if (t.type === 'X-Group') {
        } else if (t.type === 'group') {
          // deselect
          deselectHandler();
        }
        console.groupEnd();
      }
    }
  }, [deselectHandler, digitClickedHandler, sudoku, tip]);

  const moveActivePos = useCallback(
    (dRow, dCol) => {
      if (activePos) {
        setActiveState(({ pos: { row: curRow, col: curCol } }) => {
          const pos = getPosition((curRow + 9 + dRow) % 9, (curCol + 9 + dCol) % 9);
          return { val: 0, pos };
        });
      }
    },
    [activePos]
  );

  const moveActiveVal = useCallback(
    d => {
      if (activeVal) {
        console.log('xxxxxxxxx', d);
        setActiveState(({ val: curVal }) => {
          const val = ((curVal - 1 + d + 9) % 9) + 1;
          return { pos: null, val };
        });
      }
    },
    [activeVal]
  );

  const marks = useMemo(() => {
    if (tip) {
      if (tip.type === 'group') {
        const { cls, domain, poses, notes } = tip;
        if (cls === 0) {
          // naked
          return { effect: { [domain + 's']: new Set([tip[domain]]) }, highlights: { poses, notes } };
        } else if (cls === 1) {
          // hidden
          return { domain: { [domain + 's']: new Set([tip[domain]]) }, highlights: { poses, notes } };
        }
      } else if (tip.type === 'X-Wing') {
        const { domain, rows, cols, poses, d } = tip;
        if (domain === 'row') {
          return { domain: { rows }, effect: { cols }, highlights: { poses, notes: new Set([d]) } };
        } else if (domain === 'col') {
          return { domain: { cols }, effect: { rows }, highlights: { poses, notes: new Set([d]) } };
        }
      } else if (tip.type === 'X-Group') {
        const { domain, rows, cols, blocks, poses, d } = tip;
        if (domain === 'row') {
          return { domain: { rows }, effect: { cols, blocks }, highlights: { poses, notes: new Set([d]) } };
        } else if (domain === 'col') {
          return { domain: { cols }, effect: { rows, blocks }, highlights: { poses, notes: new Set([d]) } };
        } else if (domain === 'block') {
          return { domain: { blocks }, effect: { rows, cols }, highlights: { poses, notes: new Set([d]) } };
        }
      }
    }
  }, [tip]);

  // event listeners
  useEffect(() => {
    const keydownHandler = e => {
      console.log(e);
      // TODO: handler other shortcut keys
      if (e.code.startsWith('Digit')) {
        const d = parseInt(e.key);
        digitClickedHandler(d);
      } else if (e.key === 'N') {
        startNewGameHandler();
      } else if (e.key === 'n') {
        if (e.ctrlKey) {
          autoNoteHandler();
        } else {
          toggleIsNotingHandler();
        }
      } else if (e.key === 'b') {
        if (!activeVal && !activePos) {
          cellClickedHandler(getPosition(4, 4));
        }
      } else if (e.key === 'd') {
        deselectHandler();
      } else if (e.key === 't') {
        tipHandler();
      } else if (e.key === 'p') {
        autoPlacePointingClaimingHandler();
      } else if (e.key === 'h' || e.key === 'ArrowLeft') {
        moveActivePos(0, -1);
        moveActiveVal(-1);
      } else if (e.key === 'l' || e.key === 'ArrowRight') {
        moveActivePos(0, 1);
        moveActiveVal(1);
      } else if (e.key === 'j' || e.key === 'ArrowDown') {
        moveActivePos(1, 0);
        moveActiveVal(-1);
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        moveActivePos(-1, 0);
        moveActiveVal(1);
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
    activePos,
    activeVal,
    autoNoteHandler,
    autoPlacePointingClaimingHandler,
    cellClickedHandler,
    deselectHandler,
    digitClickedHandler,
    moveActivePos,
    moveActiveVal,
    startNewGameHandler,
    tipHandler,
    toggleIsNotingHandler,
  ]);

  useEffect(() => {
    // clear tip if values changed
    setTip(null);
  }, [cells]);

  let shareContent = null;
  if (showShare) {
    const url = new URL(window.location);
    const initialPuzzle = sudoku.initialPuzzle;
    const curPuzzle = sudoku.stringify();
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
        <Button onClick={emptyHandler}>Empty</Button>
        <Button onClick={() => setShowShare(true)}>Share</Button>
      </div>
      <div className={styles.Board}>
        <Board
          cells={cells}
          availablePositions={availablePositions}
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
          remainingDigits={remainingDigits}
          activeVal={activeVal}
          availableDigits={availableDigits}
          digitClickedHandler={digitClickedHandler}
          showAvail={showAvail}
          isNoting={isNoting}
          resetHandler={resetHandler}
          eraseValueHandler={eraseValueHandler}
          deselectHandler={deselectHandler}
          toggleShowAvailHandler={toggleShowAvailHandler}
          toggleIsNotingHandler={toggleIsNotingHandler}
          autoNoteHandler={autoNoteHandler}
          autoPlacePointingClaimingHandler={autoPlacePointingClaimingHandler}
          tip={tip}
          tipHandler={tipHandler}
        />
      </div>
      <div className={styles.Info}></div>
    </>
  );
};

export default Sudoku;
