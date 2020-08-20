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

const Sudoku = ({
  /** @type {sudokus.Sudoku} */ sudoku = new sudokus.Sudoku(),
  startNewGameHandler,
  newGameHandler,
  emptyHandler,
}) => {
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
  const [isNoting, setIsNoting] = useState(false);
  const [withALS, setWithALS] = useState(false);
  const [tip, setTip] = useState(null);
  const [chainStep, setChainStep] = useState(2);

  // calculated states
  const cellsRecord = sudoku.cellsRecord;
  const isComplete = sudoku.isComplete;
  const { cells: boardCells } = cellsRecord;
  // cells dependency is needed for memo check
  const availableDigits = useMemo(() => sudoku.calcAvailableDigits(activePos, boardCells), [
    activePos,
    sudoku,
    boardCells,
  ]);
  const availablePositions = useMemo(() => sudoku.calcAvailablePositions(activeVal, boardCells), [
    activeVal,
    sudoku,
    boardCells,
  ]);
  const remainingDigits = useMemo(() => sudoku.calcRemainingDigits(boardCells), [sudoku, boardCells]);

  // handlers
  const startGameHandler = useCallback(() => {
    newGameHandler(sudoku.stringify(boardCells, { placedAsOrigin: true, withNotes: false }));
  }, [boardCells, newGameHandler, sudoku]);

  const editGameHandler = useCallback(() => {
    newGameHandler(sudoku.stringify(boardCells, { originAsPlaced: true, withNotes: false }), false);
  }, [boardCells, newGameHandler, sudoku]);

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

  const solveHandler = useCallback(() => {
    sudoku.solve();
  }, [sudoku]);

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

  const toggleWithALSHandler = useCallback(() => {
    setWithALS(v => !v);
  }, []);

  const autoNoteHandler = useCallback(() => {
    sudoku.autoNote();
  }, [sudoku]);

  const autoPlacePointingClaimingHandler = useCallback(() => {
    sudoku.autoPlacePointingClaiming();
  }, [sudoku]);

  const tipHandler = useCallback(() => {
    // deselect
    deselectHandler();
    if (tip) {
      // clear
      setTip(null);
      sudoku.clearHistoryLowerBound();

      // handle tip
      sudoku.handleTip(tip);
    } else {
      // find tip
      setIsLoading(true);
      setTimeout(() => {
        // for test new tech.
        // const t = sudoku.findTip({ trial: false });
        const t = sudoku.findTip({
          chain: {
            timeout: 10 * 1000,
            confirmContinue: t => window.confirm(`already running for ${t / 1000}s, continue finding?`),
            withoutALS: !withALS,
          },
        });
        setIsLoading(false);
        if (t) {
          console.log('tip:', t);
          setTip(t);
          if (t.type === 'chain') {
            setChainStep(t.chain.length);
          } else if (t.type === 'trial-error') {
            sudoku.setHistoryLowerBound(t.startIdx);
            if (t.err !== true && t.err.digits.size > 0) {
              digitClickedHandler([...t.err.digits][0], true);
            }
          }
        }
      }, 0);
    }
  }, [deselectHandler, digitClickedHandler, sudoku, tip, withALS]);

  const cancelTipHandler = useCallback(() => {
    if (tip) {
      // clear
      setTip(null);
      if (tip.type === 'trial-error') {
        sudoku.clearHistoryLowerBound();
        sudoku.revertTo(tip.startIdx);
      }
    }
  }, [sudoku, tip]);

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
        const { cls, domains, poses: cells, notes } = tip;
        const domainInfo = {};
        for (const [domain, value] of Object.entries(domains)) {
          domainInfo[domain + 's'] = new Set([value]);
        }

        if (cls === 0) {
          // naked
          return { effect: { ...domainInfo, notes }, highlights: { cells, notes } };
        } else if (cls === 1) {
          // hidden
          return { domain: { ...domainInfo, notes }, highlights: { cells, notes } };
        }
      } else if (tip.type === 'X-Group') {
        const { domain, rows, cols, blocks, poses: cells, d } = tip;
        const notes = new Set([d]);
        if (domain === 'row') {
          return { domain: { rows }, effect: { cols, blocks, notes }, highlights: { cells, notes } };
        } else if (domain === 'col') {
          return { domain: { cols }, effect: { rows, blocks, notes }, highlights: { cells, notes } };
        } else if (domain === 'block') {
          return { domain: { blocks }, effect: { rows, cols, notes }, highlights: { cells, notes } };
        }
      } else if (tip.type === 'chain') {
        const { chain, effectedPoses, d, effectedDs } = tip;
        const curChain = chain.slice(0, chainStep);
        const allPoses = [];
        curChain.forEach(({ pos }) => {
          if (!pos.isAlsc) {
            // no alsc
            allPoses.push(...sudokus.getRealPoses(pos));
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
        const domain = {};
        let lastAls = null;
        let lastPos = null;

        // frames
        curChain.forEach(({ pos, als }) => {
          if (pos.isAlsc) {
            lastAls = als;
            lastPos = pos;
          } else if (pos.isGroup) {
            const { key, domain, block, row, col } = pos;
            frames.push({ key, domain: [...domain][0], block, row, col });
          }
        });
        domain.cells = lastAls && lastAls.poses;
        lastPos && sudokus.getRealPoses(lastPos).forEach(p => poses.add(p));

        // arrows
        const arrows = [];
        let startNode = curChain[0];
        for (const endNode of curChain.slice(1)) {
          const [startPos, endPos] = findClosedPosPair(
            sudokus.getRealPoses(startNode.pos),
            sudokus.getRealPoses(endNode.pos)
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
        const effect = curChain.length === chain.length ? { cells: effectedPoses, notes: effectedNotes } : null;
        return {
          domain,
          frames,
          arrows,
          effect,
          highlights: { cells: poses, posNotes, posSubNotes, withoutOutlinePoses },
        };
      } else if (tip.type === 'trial-error') {
        const { startIdx, pos, d, err } = tip;
        const values = new Set([d]);
        let marks = null;
        if (err === true) {
          // is complete
          marks = { highlights: { cells: new Set([pos]), values, notes: values } };
        } else {
          const { domain, digits } = err;
          if (cellsRecord.idx >= startIdx) {
            marks = {
              effect: { [domain + 's']: new Set([err[domain]]), notes: digits, values: digits },
              highlights: { cells: new Set([pos]), values, notes: values },
            };
          }
        }
        if (cellsRecord.idx >= startIdx) {
          return marks;
        }
      }
    }
  }, [cellsRecord.idx, chainStep, tip]);

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

  const jumpToTrialStartHandler = useCallback(() => {
    if (tip && tip.type === 'trial-error') {
      sudoku.jumpTo(tip.startIdx);
    }
  }, [sudoku, tip]);

  // event listeners
  useEffect(() => {
    const keydownHandler = e => {
      console.log(e);
      if (isLoading) {
        return;
      }

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
      } else if (e.key === 'a') {
        if (e.ctrlKey) {
          toggleShowAvailHandler();
        } else {
          toggleWithALSHandler();
        }
      } else if (e.key === 's' && !e.isComposing && !e.metaKey) {
        solveHandler();
      } else if (e.key === 'r' && !e.isComposing && !e.metaKey) {
        resetHandler();
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
      } else if (e.key === 'x') {
        cancelTipHandler();
      } else if (e.key === 'y') {
        changeChainStepHandler(-1);
        jumpToTrialStartHandler();
      } else if (e.key === 'u') {
        changeChainStepHandler(1);
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
    cancelTipHandler,
    cellClickedHandler,
    changeChainStepHandler,
    deselectHandler,
    digitClickedHandler,
    eraseValueHandler,
    isLoading,
    jumpToTrialStartHandler,
    moveActivePos,
    moveActiveVal,
    resetHandler,
    solveHandler,
    startNewGameHandler,
    sudoku,
    tip,
    tipHandler,
    toggleIsNotingHandler,
    toggleShowAvailHandler,
    toggleWithALSHandler,
  ]);

  useEffect(() => {
    if (tip) {
      if (tip.includedCells && tip.includedCells.has(boardCells)) {
        return;
      }
      // clear tip if values changed
      setTip(null);
      sudoku.clearHistoryLowerBound();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardCells]);

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
        <Button onClick={startGameHandler}>Start</Button>
        <Button onClick={editGameHandler}>Edit</Button>
        <Button onClick={emptyHandler}>Empty</Button>
        <Button onClick={() => setShowShare(true)}>Share</Button>
      </div>
      <div className={styles.Board}>
        <Board
          isComplete={isComplete}
          cells={boardCells}
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
          withALS={withALS}
          solveHandler={solveHandler}
          resetHandler={resetHandler}
          eraseValueHandler={eraseValueHandler}
          deselectHandler={deselectHandler}
          toggleShowAvailHandler={toggleShowAvailHandler}
          toggleIsNotingHandler={toggleIsNotingHandler}
          toggleWithALSHandler={toggleWithALSHandler}
          autoNoteHandler={autoNoteHandler}
          autoPlacePointingClaimingHandler={autoPlacePointingClaimingHandler}
          tip={tip}
          tipHandler={tipHandler}
          cancelTipHandler={cancelTipHandler}
          changeChainStepHandler={changeChainStepHandler}
          jumpToTrailStartHandler={jumpToTrialStartHandler}
        />
      </div>
      <div className={styles.Info}></div>
    </>
  );
};

export default Sudoku;
