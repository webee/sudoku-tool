import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Button from '../../components/UI/Button/Button';
import Board from '../../components/Sudoku/Board/Board';
import Controls from '../../components/Sudoku/Controls/Controls';
import Modal from '../../components/UI/Modal/Modal';
import Loading from '../../components/UI/Loading/Loading';
import QRCode from 'qrcode.react';
import styles from './Main.module.scss';
import * as sudokus from '../../libs/sudoku';
import { Notes } from '../../libs/sudoku';
import { getPosition, findClosedPosPair } from '../../libs/position';
import { console } from '../../libs/utils';

const Sudoku = ({ /** @type {sudokus.Sudoku} */ sudoku = new sudokus.Sudoku(), startNewGameHandler, emptyHandler }) => {
  const [isLoading, setIsLoading] = useState(false);
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
  const [chainStep, setChainStep] = useState(2);

  // calculated states
  const cellsRecord = sudoku.cellsRecord;
  const { cells } = cellsRecord;
  // cells dependency is needed for memo check
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
      setIsLoading(true);
      setTimeout(() => {
        const t = sudoku.findTip();
        setIsLoading(false);
        if (t) {
          console.log('tip:', t);
          setTip(t);
          if (t.type === 'chain') {
            setChainStep(t.chain.length);
          }
        }
      }, 0);
    }
    // deselect
    deselectHandler();
  }, [deselectHandler, sudoku, tip]);

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
          return { effect: { [domain + 's']: new Set([tip[domain]]), notes }, highlights: { poses, notes } };
        } else if (cls === 1) {
          // hidden
          return { domain: { [domain + 's']: new Set([tip[domain]]), notes }, highlights: { poses, notes } };
        }
      } else if (tip.type === 'X-Group') {
        const { domain, rows, cols, blocks, poses, d } = tip;
        const notes = new Set([d]);
        if (domain === 'row') {
          return { domain: { rows }, effect: { cols, blocks, notes }, highlights: { poses, notes } };
        } else if (domain === 'col') {
          return { domain: { cols }, effect: { rows, blocks, notes }, highlights: { poses, notes } };
        } else if (domain === 'block') {
          return { domain: { blocks }, effect: { rows, cols, notes }, highlights: { poses, notes } };
        }
      } else if (tip.type === 'chain') {
        const { chain, effectedPoses, d, effectedDs } = tip;
        const curChain = chain.slice(0, chainStep);
        const allPoses = [];
        curChain.forEach(({ pos }) => {
          if (pos.isGroup) {
            pos.poses.forEach(p => allPoses.push(p));
          } else {
            allPoses.push(pos);
          }
        });
        const poses = new Set(allPoses);
        const withoutOutlinePoses = new Set(allPoses);
        // remove head and tail
        sudokus.getRealPoses(chain[0].pos).forEach(p => withoutOutlinePoses.delete(p));
        sudokus.getRealPoses(chain[chain.length - 1].pos).forEach(p => withoutOutlinePoses.delete(p));

        const effectedNotes = effectedDs ? effectedDs : new Set([d]);
        const posNotes = {};
        const posSubNotes = {};
        for (const n of curChain) {
          let _posNotes = posNotes;
          if (n.d !== d) {
            _posNotes = posSubNotes;
          }
          const { pos } = n;
          for (const p of sudokus.getRealPoses(pos)) {
            const subNotes = _posNotes[p] || new Set();
            _posNotes[p] = subNotes;
            subNotes.add(n.d);
          }
        }

        const frames = [];

        // frames
        curChain.forEach(({ pos }) => {
          if (pos.isGroup) {
            const { key, domain, block, row, col } = pos;
            frames.push({ key, domain: [...domain][0], block, row, col });
          }
        });

        // arrows
        const arrows = [];
        let startNode = curChain[0];
        for (const endNode of curChain.slice(1)) {
          const [startPos, endPos] = findClosedPosPair(
            startNode.pos.isGroup ? startNode.pos.poses : [startNode.pos],
            endNode.pos.isGroup ? endNode.pos.poses : [endNode.pos]
          );

          arrows.push({
            startPos,
            startDigit: startNode.d,
            endPos,
            endDigit: endNode.d,
            type: endNode.val ? 'solid' : 'dashed',
          });
          startNode = endNode;
        }
        return {
          frames,
          arrows,
          effect: { poses: effectedPoses, notes: effectedNotes },
          highlights: { poses, posNotes, posSubNotes, withoutOutlinePoses },
        };
      }
    }
  }, [chainStep, tip]);

  const changeChainStepHandler = useCallback(
    d => {
      if (tip && tip.type === 'chain') {
        const len = tip.chain.length;
        setChainStep(s => {
          return ((s - 1 + d + len) % len) + 1;
        });
      }
    },
    [tip]
  );

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
      } else if (e.key === 'e') {
        eraseValueHandler();
      } else if (e.key === 'b') {
        if (!activeVal && !activePos) {
          cellClickedHandler(getPosition(4, 4));
        }
      } else if (e.key === 'd' || e.key === 'Escape') {
        deselectHandler();
      } else if (e.key === 't') {
        tipHandler();
      } else if (e.key === 'p') {
        autoPlacePointingClaimingHandler();
      } else if (e.key === 'h' || e.key === 'ArrowLeft') {
        if (activePos) {
          moveActivePos(0, -1);
        } else if (activeVal) {
          moveActiveVal(-1);
        } else {
          sudoku.jumpToFirst();
        }
      } else if (e.key === 'l' || e.key === 'ArrowRight') {
        if (activePos) {
          moveActivePos(0, 1);
        } else if (activeVal) {
          moveActiveVal(1);
        } else {
          sudoku.jumpToLast();
        }
      } else if (e.key === 'j' || e.key === 'ArrowDown') {
        if (activePos) {
          moveActivePos(1, 0);
        } else if (activeVal) {
          moveActiveVal(-1);
        } else {
          sudoku.jump(-1);
        }
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        if (activePos) {
          moveActivePos(-1, 0);
        } else if (activeVal) {
          moveActiveVal(1);
        } else {
          sudoku.jump(1);
        }
      } else {
        return;
      }
      // e.preventDefault();
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
    eraseValueHandler,
    moveActivePos,
    moveActiveVal,
    startNewGameHandler,
    sudoku,
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
      {isLoading && <Loading />}
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
          cellsRecord={cellsRecord}
          hasPrev={sudoku.hasPrev}
          hasNext={sudoku.hasNext}
          jump={sudoku.jump}
          jumpToFirst={sudoku.jumpToFirst}
          jumpToLast={sudoku.jumpToLast}
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
          changeChainStepHandler={changeChainStepHandler}
        />
      </div>
      <div className={styles.Info}></div>
    </>
  );
};

export default Sudoku;
