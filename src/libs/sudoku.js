import {
  flattenPositions,
  getRelatedPositions,
  mapPositionsTo,
  getRelatedRowPositions,
  getRelatedColPositions,
  getRelatedBlockPositions,
  getRowPositions,
  getColPositions,
  getBlockFlattenPositions,
} from './position';
import * as positions from './position';
import { aggregateLinks, console, getAttrDefault, shuffleArray, findALSFromPoints, intersection } from './utils';
import { Notes, digits } from './notes';
import { findNGroup, eliminateGroup, findNXGroup, eliminateXGroup, getPosDigitLinks, getPosDomains } from './logic';
import { solve } from './solver';

export * from './notes';

export class Sudoku {
  static defaultPuzzle = `
  000000000 000000000 000000000
  000000000 000000000 000000000
  000000000 000000000 000000000
 `;
  constructor(puzzle) {
    this._shouldNotify = true;
    this.subscribers = [];
    this._setPuzzle(puzzle || Sudoku.defaultPuzzle);
    this._chainCheckMemo = { x: {}, xy: {} };
  }

  _setPuzzle(puzzle) {
    // clear history
    this._cellsHistory = [];
    this._curCellsIdx = -1;
    this._txCells = null;
    this._historyLowerBound = 0;
    const parsedCells = Sudoku.parse(puzzle);
    if (puzzle !== Sudoku.defaultPuzzle) {
      this._results = solve(parsedCells);
    }

    this._setCells(parsedCells, 'init');
    this.puzzle = this.stringify();
    this._notify();
  }

  get results() {
    return this._results;
  }

  solve() {
    if (this._results && this._results.length > 0) {
      // choose the first result.
      this._setCells(this._results[0], 'solve');
      this._notify();
    }
  }

  setHistoryLowerBound(n) {
    this._historyLowerBound = n;
  }

  clearHistoryLowerBound() {
    this._historyLowerBound = 0;
  }

  get isComplete() {
    return this._isComplete;
  }

  get initialPuzzle() {
    return this.puzzle;
  }

  get cells() {
    return this._cellsHistory[this._curCellsIdx].cells;
  }

  get cellsRecord() {
    return this._cellsHistory[this._curCellsIdx];
  }

  get curIdx() {
    return this._curCellsIdx;
  }

  get lastIdx() {
    return this._cellsHistory.length - 1;
  }

  _cut() {
    if (this._curCellsIdx + 1 < this._cellsHistory.length) {
      this._cellsHistory = this._cellsHistory.slice(0, this._curCellsIdx + 1);
    }
  }

  _setCells(cells, action, payload = {}) {
    this._cut();
    this._curCellsIdx++;
    this._cellsHistory.push({
      idx: this._curCellsIdx,
      cells,
      action,
      payload,
      get desc() {
        return `[${action}] ${payload.name || ''}`;
      },
    });
  }

  get hasPrev() {
    return this._curCellsIdx > 0;
  }

  get hasNext() {
    return this._curCellsIdx < this._cellsHistory.length - 1;
  }

  jumpTo = (idx, revert = false) => {
    if (idx < this._historyLowerBound) {
      // can't set lower than lower bound.
      return;
    }

    this._curCellsIdx = idx;

    if (this._curCellsIdx < 0) {
      this._curCellsIdx = 0;
    } else if (this._curCellsIdx >= this._cellsHistory.length) {
      this._curCellsIdx = this._cellsHistory.length - 1;
    }
    if (revert) {
      this._cut();
    }

    this._rollback();

    this._notify();
  };

  revertTo = idx => {
    this.jumpTo(idx, true);
  };

  jump = steps => {
    this.jumpTo(this.curIdx + steps);
  };

  jumpToFirst = () => {
    this.jumpTo(0);
  };

  jumpToLast = () => {
    this.jumpTo(this.lastIdx);
  };

  subscribe(f) {
    this.subscribers.push(f);
  }

  unsubscribe(f) {
    this.subscribers = this.subscribers.filter(s => s !== f);
  }

  _disableNotify() {
    this._shouldNotify = false;
  }

  _enableNotify() {
    this._shouldNotify = true;
  }

  _notify() {
    if (this._shouldNotify) {
      this._checkComplete();
      for (const f of this.subscribers) {
        f(n => n + 1);
      }
    }
  }

  static cellPattern = /(\d)|(p\d)|(n[1-9]*N)|\./g;
  static valuePattern = /^[1-9]$/;

  static parse(puzzle) {
    if (!puzzle || puzzle.length < 81) {
      throw new Error(`bad sudoku puzzle format [${puzzle}]`);
    }
    // split cell
    const flattenCells = puzzle.match(Sudoku.cellPattern);
    if (flattenCells.length !== 81) {
      throw new Error(`bad sudoku puzzle format [${puzzle}]`);
    }

    // parse values
    const flattenCellValues = flattenCells.map(cell => {
      if (cell.startsWith('n') && cell.endsWith('N')) {
        // it's note
        const notes = cell
          .slice(1, -1)
          .split('')
          .map(s => parseInt(s));
        return { value: Notes.new(...notes) };
      } else if (cell.startsWith('p')) {
        // it's placed value
        return { value: parseInt(cell[1]) };
      } else if (Sudoku.valuePattern.test(cell)) {
        // it's value
        return {
          value: parseInt(cell),
          // puzzle origin value
          origin: true,
        };
      } else if (cell === '0' || cell === '.') {
        // it's empty
        return { value: Notes.new() };
      }
      throw new Error('impossible');
    });

    // organize the values
    const cells = positions.newCells();
    for (const pos of positions.flattenPositions) {
      cells[pos.row][pos.col] = flattenCellValues[pos.idx];
    }
    return cells;
  }

  stringify(cells, options = {}) {
    options = { placedAsOrigin: false, withNotes: true, originAsPlaced: false, ...options };
    cells = cells || this.cells;
    const res = [];
    for (const pos of flattenPositions) {
      const { origin, value } = cells[pos.row][pos.col];
      if (Notes.is(value)) {
        if (!options.withNotes) {
          res.push('0');
          continue;
        }

        // notes
        if (Notes.isEmpty(value)) {
          res.push('0');
        } else {
          res.push('n', ...Notes.entries(value), 'N');
        }
      } else if ((options.placedAsOrigin || origin) && !options.originAsPlaced) {
        // origin
        res.push(value);
      } else {
        // placed
        res.push('p', value);
      }
    }
    return res.join('');
  }

  // calcuate available digits for cell at postion <pos>.
  calcAvailableDigits(pos) {
    const res = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    if (!pos) {
      return res;
    }

    const cell = this.getCell(pos);
    if (cell.origin) {
      // origin can't be changed
      return new Set();
    }

    for (const rpos of getRelatedPositions(pos)) {
      const { value } = this.getCell(rpos);
      if (!Notes.is(value)) {
        res.delete(value);
      }
    }
    return res;
  }

  calcRemainingDigits() {
    const res = { 1: 9, 2: 9, 3: 9, 4: 9, 5: 9, 6: 9, 7: 9, 8: 9, 9: 9 };
    for (const pos of flattenPositions) {
      const { value } = this.getCell(pos);
      if (!Notes.is(value)) {
        res[value]--;
      }
    }
    return res;
  }

  calcAvailablePositions(d) {
    if (!(d >= 1 && d <= 9)) {
      return null;
    }

    const res = mapPositionsTo(() => true);
    for (const pos of flattenPositions) {
      const { value } = this.getCell(pos);
      if (!Notes.is(value)) {
        res[pos.row][pos.col] = false;
        if (value === d) {
          // clear
          for (const { row, col } of getRelatedPositions(pos)) {
            res[row][col] = false;
          }
        }
      }
    }
    return res;
  }

  _txSetCellValue(pos, value) {
    const { row, col } = pos;
    const { value: oldValue } = this.getCell(pos);
    if (value === oldValue) {
      return;
    }

    this._startTx();
    const curCells = this.getCurCells();
    if (this._txCells === curCells) {
      this._txCells = [...curCells];
    }
    if (this._txCells[row] === curCells[row]) {
      this._txCells[row] = [...curCells[row]];
    }
    if (this._txCells[row][col] === curCells[row][col]) {
      this._txCells[row][col] = { ...curCells[row][col] };
    }
    this._txCells[row][col].value = value;
    if (!Notes.is(value)) {
      // updated related notes
      for (const rpos of getRelatedPositions(pos)) {
        const cell = this.getCell(rpos);
        if (!Notes.is(cell.value)) {
          // is not notes
          continue;
        }
        this._eliminate(rpos, value);
      }
    }
  }

  _eliminate(pos, ...ds) {
    const { value } = this.getCell(pos);
    this._txSetCellValue(pos, Notes.delete(value, ...ds));
  }

  getCurCells = () => {
    if (this._txCells) {
      // in transaction
      return this._txCells;
    }
    return this.cells;
  };

  getCell = ({ row, col }) => {
    return this.getCurCells()[row][col];
  };

  _startTx() {
    if (!this._txCells) {
      this._txCells = this.getCurCells();
    }
  }

  _commit(action, payload) {
    if (this._txCells && this._txCells !== this.cells) {
      this._setCells(this._txCells, action, payload);
      this._txCells = null;
      this._notify();
    }
  }

  _rollback() {
    this._txCells = null;
  }

  _setCellValue = (pos, value) => {
    this._txSetCellValue(pos, value);
  };

  // actions
  static actions = {
    RESET: 'Reset',
    NOTE: 'Note',
    UPDATE_CELL_VALUE: 'Update Cell',
    AUTO_NOTE: 'Auto Note',
    AUTO_POINTING: 'Auto Pointing',
    AUTO_CLAIMING: 'Auto Claiming',
    AUTO_PLACE: 'Auto Place',
    AUTO_PLACE_POINTING_CLAIMING: 'Auto Place/Pointing/Claiming',
    ELIMINATE_GROUP: 'X Group',
    ELIMINATE_XGROUP: 'X XGroup',
    ELIMINATE_UR: 'X UR',
    ELIMINATE_CHAIN: 'X Chain',
    ELIMINATE_TRIAL_ERROR: 'X Trial Error',
    HANDLE_TIP: 'Handle Tip',
  };

  _handlActions(action, payload) {
    switch (action) {
      case Sudoku.actions.RESET:
        this._setPuzzle(this.puzzle);
        break;
      case Sudoku.actions.NOTE:
        this._note(payload);
        break;
      case Sudoku.actions.AUTO_NOTE:
        this._autoNote();
        break;
      case Sudoku.actions.AUTO_PLACE:
        this._autoPlace();
        break;
      case Sudoku.actions.AUTO_POINTING:
        this._autoPointing();
        break;
      case Sudoku.actions.AUTO_CLAIMING:
        this._autoClaiming();
        break;
      case Sudoku.actions.AUTO_PLACE_POINTING_CLAIMING:
        this._autoPlacePointingClaiming();
        break;
      case Sudoku.actions.UPDATE_CELL_VALUE:
        this._updateCellValue(payload);
        break;
      case Sudoku.actions.ELIMINATE_GROUP:
        eliminateGroup(payload, this.getCell, this._setCellValue);
        break;
      case Sudoku.actions.ELIMINATE_XGROUP:
        eliminateXGroup(payload, this.getCell, this._setCellValue);
        break;
      case Sudoku.actions.ELIMINATE_UR:
        this._eliminateUR(payload);
        break;
      case Sudoku.actions.ELIMINATE_CHAIN:
        this._eliminateChain(payload);
        break;
      case Sudoku.actions.ELIMINATE_TRIAL_ERROR:
        this._eliminateTrialError(payload);
        break;
      case Sudoku.actions.HANDLE_TIP:
        this._handleTip(payload);
        break;
      default:
        break;
    }
  }

  dispatch(action, payload, options) {
    options = { commit: true, log: true, ...(options || {}) };
    if (options.log) {
      console.group(`[${action}]`);
      payload && console.log('->payload:', payload);
      options && console.log('->options:', options);
    }

    this._startTx();
    this._handlActions(action, payload);

    if (options.log) {
      console.groupEnd();
    }

    if (options.commit) {
      this._commit(action, payload);
    }
  }

  reset() {
    this.dispatch(Sudoku.actions.RESET);
  }

  note(pos) {
    this.dispatch(Sudoku.actions.NOTE, pos);
  }

  updateCellValue(isNoting, pos, value, type) {
    this.dispatch(Sudoku.actions.UPDATE_CELL_VALUE, {
      isNoting,
      pos,
      value,
      name: `${type || (isNoting ? 'note' : 'place')} ${value}@${pos}`,
    });
  }

  autoNote() {
    this.dispatch(Sudoku.actions.AUTO_NOTE);
  }

  autoPlacePointingClaiming() {
    this.dispatch(Sudoku.actions.AUTO_PLACE_POINTING_CLAIMING);
  }

  autoPlace() {
    this.dispatch(Sudoku.actions.AUTO_PLACE);
  }

  autoPointing() {
    this.dispatch(Sudoku.actions.AUTO_POINTING);
  }

  autoClaiming() {
    this.dispatch(Sudoku.actions.AUTO_CLAIMING);
  }

  eliminateGroup(group) {
    this.dispatch(Sudoku.actions.ELIMINATE_GROUP, group);
  }

  eliminateXGroup(group) {
    this.dispatch(Sudoku.actions.ELIMINATE_XGROUP, group);
  }

  eliminateUR(ur) {
    this.dispatch(Sudoku.actions.ELIMINATE_UR, ur);
  }

  eliminateChain(chain) {
    this.dispatch(Sudoku.actions.ELIMINATE_CHAIN, chain);
  }

  eliminateTrialError(res) {
    this.dispatch(Sudoku.actions.ELIMINATE_TRIAL_ERROR, res);
  }

  handleTip(tip) {
    this.dispatch(Sudoku.actions.HANDLE_TIP, tip);
  }

  _checkValidity() {
    // check every house should has 9 digits
    for (const [domain, getPositions] of [
      ['row', getRowPositions],
      ['col', getColPositions],
      ['block', getBlockFlattenPositions],
    ]) {
      for (const idx of positions.indices) {
        const errDigits = new Set(digits);
        for (const pos of getPositions(idx)) {
          const { value } = this.getCell(pos);
          if (domain === 'row' && Notes.isEmpty(value)) {
            // check empty.
            return { domain: 'cell', cell: pos, digits: new Set() };
          }

          if (Notes.is(value)) {
            Notes.entries(value).forEach(v => errDigits.delete(v));
          } else {
            errDigits.delete(value);
          }
        }
        if (errDigits.size !== 0) {
          return { domain, [domain]: idx, digits: errDigits };
        }
      }
    }
  }

  _checkComplete() {
    for (const pos of positions.flattenPositions) {
      const { value } = this.getCell(pos);
      if (Notes.is(value)) {
        this._isComplete = false;
        return false;
      }
    }
    this._isComplete = true;
    return true;
  }

  _note(pos) {
    const { value } = this.getCell(pos);
    if (!Notes.is(value)) {
      return;
    }
    if (Notes.size(value) > 0) {
      // only note empty cell. erase before re-note.
      return;
    }
    this._setCellValue(pos, Notes.new(...this.calcAvailableDigits(pos)));
  }

  _autoNote() {
    for (const pos of flattenPositions) {
      this.dispatch(Sudoku.actions.NOTE, pos, { commit: false, log: false });
    }
  }

  _autoPlacePointingClaiming() {
    try {
      let count = 0;
      do {
        count = 0;
        count += this._autoPlace();
        this._commit(Sudoku.actions.AUTO_PLACE);
        count += this._autoPointing();
        this._commit(Sudoku.actions.AUTO_POINTING);
        count += this._autoClaiming();
        this._commit(Sudoku.actions.AUTO_CLAIMING);
      } while (count > 0);
    } catch (error) {
      console.log(error);
    }
  }

  // auto place naked/hidden single value
  _autoPlace() {
    let count = 0;
    let placed = false;

    console.group('[auto place]');
    do {
      placed = false;
      // 0:naked, 1:hidden
      for (const cls of [0, 1]) {
        for (const group of findNGroup(this.getCurCells(), 1, cls)) {
          this.dispatch(Sudoku.actions.ELIMINATE_GROUP, group, { commit: false });
          count++;
          placed = true;
          break;
        }
      }
    } while (placed);
    console.groupEnd();

    return count;
  }

  // block eliminate row/col
  _autoPointing() {
    let count = 0;
    console.group('[auto pointing]');
    for (const group of findNXGroup(this.getCurCells(), 1, { br: true, bc: true })) {
      console.log(group);
      this.dispatch(Sudoku.actions.ELIMINATE_XGROUP, group, { commit: false });
      count++;
    }
    console.groupEnd();
    return count;
  }

  // row/col eliminate block
  _autoClaiming() {
    let count = 0;
    console.group('[auto claiming]');
    for (const group of findNXGroup(this.getCurCells(), 1, { rb: true, cb: true })) {
      this.dispatch(Sudoku.actions.ELIMINATE_XGROUP, group, { commit: false });
      count++;
    }
    console.groupEnd();
    return count;
  }

  _updateCellValue({ isNoting, pos, value }) {
    if (isNoting) {
      this._noteCellValue(pos, value);
    } else {
      this._placeCellValue(pos, value);
    }
  }

  _placeCellValue(pos, value) {
    const oldCell = this.getCell(pos);
    if (oldCell.origin) {
      // can't place origin value
      return;
    }

    if (oldCell.value === value) {
      // cancel current value
      value = Notes.new();
    }

    this._setCellValue(pos, value);
  }

  _noteCellValue(pos, n) {
    const { value } = this.getCell(pos);
    if (!Notes.is(value)) {
      // can't note cell with value.
      return;
    }

    // note
    let notes = value;
    if (Notes.has(notes, n)) {
      notes = Notes.delete(notes, n);
    } else {
      notes = Notes.add(notes, n);
    }

    this._setCellValue(pos, notes);
  }

  findGroup(cells) {
    for (let n = 1; n <= 8; n++) {
      // 0:naked group, 1: hidden group
      for (const cls of [0, 1]) {
        for (const group of findNGroup(cells, n, cls)) {
          // only return the first group
          return group;
        }
      }
    }
  }

  findXGroup(cells) {
    for (let n = 1; n <= 8; n++) {
      for (const group of findNXGroup(cells, n)) {
        group.type = 'X-Group';
        return group;
      }
    }
  }

  findUR(cells) {
    //
  }

  _eliminateUR(ur) {
    //
  }

  findTip(options) {
    options = { trial: true, chain: { withoutALS: false }, ...options };
    const cells = this.getCurCells();
    return (
      this.findGroup(cells) ||
      this.findXGroup(cells) ||
      this.findUR(cells) ||
      this.findChain(cells, options.chain) ||
      (options.trial && this.findTrialError())
    );
  }

  _handleTip(tip) {
    if (tip.type === 'group') {
      this.eliminateGroup(tip);
    } else if (tip.type === 'X-Group') {
      this.eliminateXGroup(tip);
    } else if (tip.type === 'ur') {
      this.eliminateUR(tip);
    } else if (tip.type === 'chain') {
      this.eliminateChain(tip);
    } else if (tip.type === 'trial-error') {
      this.eliminateTrialError(tip);
    }
  }

  findTrialError() {
    this._disableNotify();
    const startIdx = this._curCellsIdx;
    // randomize positions
    const poses = shuffleArray(
      positions.flattenPositions.filter(p => {
        const { value } = this.getCell(p);
        return Notes.is(value);
      })
    );
    // sort positions by candidates count.
    // const poses = positions.flattenPositions
    //   .filter(p => {
    //     const { value } = this.getCell(p);
    //     return Notes.is(value);
    //   })
    //   .sort((pa, pb) => {
    //     const ca = Notes.size(this.getCell(pa).value);
    //     const cb = Notes.size(this.getCell(pb).value);
    //     return ca - cb;
    //   });
    for (const tryTip of [false, { maxDepth: 15 }, { maxDepth: 25 }, { maxDepth: Number.MAX_VALUE }]) {
      for (const pos of poses) {
        const { value } = this.getCell(pos);
        for (const d of Notes.entries(value)) {
          console.enabled = true;
          console.log(`try: ${d}@${pos} ${JSON.stringify(tryTip)}`);
          console.enabled = false;
          // start trial for d@pos
          let deepTried = 0;
          this.updateCellValue(false, pos, d, 'try');
          this.autoPlacePointingClaiming();
          let err = this._checkValidity();
          if (!err && tryTip) {
            let tip = this.findTip({ trial: false, chain: { withoutALS: true } });
            while (tip) {
              deepTried++;
              this.handleTip(tip);
              this.autoPlacePointingClaiming();
              err = this._checkValidity();
              if (err) {
                break;
              }
              if (deepTried > tryTip.maxDepth) {
                break;
              }
              tip = this.findTip({ trial: false, chain: { withoutALS: true } });
            }
            if (this._checkComplete()) {
              err = true;
            }
          }
          if (err) {
            // restore some settings.
            console.enabled = true;
            this._enableNotify();
            const endIdx = this._curCellsIdx;
            const includedCells = new Set(
              this._cellsHistory.filter(({ idx }) => idx >= startIdx && idx <= endIdx).map(h => h.cells)
            );
            return {
              startIdx,
              endIdx,
              includedCells,
              pos,
              d,
              err,
              type: 'trial-error',
              name: `try${deepTried ? '*' + deepTried : ''} ${d}@${pos}`,
            };
          }
          this.jumpTo(startIdx);
        }
      }
    }
    // revert
    this.jumpTo(startIdx);
    this._enableNotify();
  }

  _eliminateTrialError(res) {
    const { startIdx, pos, d, err } = res;
    if (err === true) {
      // complete
      return;
    }
    this.revertTo(startIdx);
    this._eliminate(pos, d);
  }

  findChain(cells, options = {}) {
    options = { withoutALS: true, ...options };
    const [dPoses, dGroupPoses, dAlsces, dLinks] = getDigitPosesAndLinks(cells, { alsSizes: [1, 2, 3, 4, 5] });
    console.log('dPoses:', dPoses);
    console.log('dGroupPoses:', dGroupPoses);
    console.log('dAlsces:', dAlsces);
    console.log('dLinks:', dLinks);
    // randomize digits.
    const ds = shuffleArray(digits);
    const baseData = { dLinks, dAlsces, val: false, cells };
    const singlePosSrcs = [d => dPoses[d]];
    const basicPosSrcs = [...singlePosSrcs, d => (dGroupPoses[d] || []).filter(p => p.isGroup)];
    const defaultConfig = {
      tryDigitLinks: true,
      tryCellLinks: false,
      tryGroupLinks: false,
      tryAlscLinks: false,
      posSrcs: basicPosSrcs,
      searchChain: dfsSearchChain,
      earlyExitLen: 7,
      checkMemo: this._chainCheckMemo,
    };
    // TODO: 在checkMemo的基础上，如果startPos对应的所有可能endPos都checkFailed，则不搜索
    const stat = { searchChainDFS: 0, checkChainX: 0, checkChainXY: 0 };
    // without ALS
    for (const maxLength of [15, 20 /*,Number.MAX_VALUE*/]) {
      for (const config of [
        defaultConfig,
        { ...defaultConfig, tryCellLinks: true },
        { ...defaultConfig, tryCellLinks: true, tryGroupLinks: true },
      ]) {
        for (const getPoses of config.posSrcs) {
          const extraData = { ...baseData, maxLength, ...config, stat: { ...stat } };
          for (const d of ds) {
            extraData.td = d;
            for (const res of config.searchChain(d, getPoses(d) || [], extraData)) {
              console.log('chain stat:', maxLength, extraData.stat);
              return prepareChainResult(res);
            }
          }
          console.log('chain stat:', maxLength, extraData.stat);
          if (extraData.res) {
            return prepareChainResult(extraData.res);
          }
        }
      }
    }

    if (!options.withoutALS) {
      // with ALS
      const alscSrcs = [d => Object.values(dAlsces[d] || {})];
      const allClosedConfig = { ...defaultConfig, tryDigitLinks: false, posSrcs: [] };
      for (const config of [
        // pure ALS-chain
        { ...allClosedConfig, tryAlscLinks: true, maxLength: 15, posSrcs: alscSrcs },
        {
          ...defaultConfig,
          tryDigitLinks: true,
          tryGroupLinks: true,
          tryAlscLinks: true,
          maxLength: 15,
          posSrcs: basicPosSrcs,
        },
      ]) {
        for (const getPoses of config.posSrcs) {
          const extraData = { ...baseData, ...config, stat: { ...stat } };
          for (const d of ds) {
            extraData.td = d;
            for (const res of config.searchChain(d, getPoses(d) || [], extraData)) {
              console.log('als stat:', 15, extraData.stat);
              return prepareChainResult(res);
            }
          }
          console.log('als stat:', 15, extraData.stat);
          if (extraData.res) {
            return prepareChainResult(extraData.res);
          }
        }
      }
    }
  }

  _eliminateChain(chain) {
    for (const pos of chain.effectedPoses) {
      const { value } = this.getCell(pos);
      if (chain.keep) {
        this._eliminate(pos, ...Notes.entries(value).filter(d => d !== chain.d && d !== chain.yd));
      } else {
        this._eliminate(pos, chain.d);
      }
    }
  }
}

const getPosTypeSign = pos => {
  return pos.isAlsc ? 'a' : pos.isGroup ? 'g' : 'd';
};

const prepareChainResult = res => {
  res.type = 'chain';
  const startPos = res.chain[0].pos;
  const endNode = res.chain[res.chain.length - 1];
  const endPos = endNode.pos;
  const d = res.d;
  let hasMulti = false;
  let hasGroup = false;
  let hasALS = false;
  for (const node of res.chain) {
    if (node.d !== d) {
      hasMulti = true;
    }
    if (node.pos.isAlsc) {
      hasALS = true;
    } else if (node.pos.isGroup) {
      hasGroup = true;
    }
    if (hasMulti && hasGroup && hasALS) {
      break;
    }
  }
  const parts = [res.chain.length - 1];
  hasGroup && parts.push('G');
  hasALS && parts.push('ALS');
  parts.push(hasMulti ? 'XY' : 'X', 'Chain');
  parts.push([getPosTypeSign(startPos), getPosTypeSign(endPos), endNode.d === d ? '-x' : '-xy'].join(''));
  res.name = parts.join('-');
  return res;
};

function* dfsSearchChain(d, poses, extraData) {
  for (const pos of poses) {
    const node = { pos, d, val: extraData.val };
    for (const res of searchChainDFS([], node, extraData)) {
      if (res.chain.length < extraData.maxLength) {
        if (res.chain.length <= extraData.earlyExitLen) {
          yield res;
        } else {
          extraData.res = res;
          extraData.maxLength = res.chain.length;
        }
      }
    }
  }
}

const checkExistAndEqual = (a, b) => a !== undefined && a === b;

function* checkChain(chain, node, extraData) {
  const { pos, d, val } = node;
  const { cells, td } = extraData;
  if (extraData.val === false && val === true && chain.length > 1) {
    // strong link
    const startPos = chain[0].pos;
    const startMemoKey = `${td}@${startPos.key}`;
    // ignore g->d
    if (d === td) {
      const memo = extraData.checkMemo.x[startMemoKey];
      if (memo && memo.has(pos)) {
        return;
      }
      extraData.stat.checkChainX++;

      // start and end shouldn't be the same position.
      // check if intersection related positions has d
      const effectedPoses = new Set();
      const poses = [...getRealPoses(startPos), ...getRealPoses(pos)];

      for (const cpos of positions.getCommonRelatedPositions(...poses)) {
        const { value } = positions.getCell(cells, cpos);
        if (Notes.has(value, d)) {
          effectedPoses.add(cpos);
        }
      }
      if (effectedPoses.size > 0) {
        yield { chain: [...chain, node], effectedPoses, d: td };
      } else {
        // check failed
        getAttrDefault(extraData.checkMemo.x, startMemoKey, new Set()).add(pos);
        getAttrDefault(extraData.checkMemo.x, `${d}@${pos.key}`, new Set()).add(startPos);
      }
    } else {
      const memo = extraData.checkMemo.xy[startMemoKey];
      const endMemoKey = `${d}@${pos.key}`;
      if (memo && memo.has(endMemoKey)) {
        return;
      }
      extraData.stat.checkChainXY++;

      let checkOk = false;
      // xy-chain
      const poses = getRealPoses(pos);
      // two types:
      // 1. same pos
      if (startPos.key === pos.key && poses.length === 1) {
        // should only be one position

        const ds = new Set();
        for (const p of poses) {
          const { value } = positions.getCell(cells, p);
          Notes.entries(value).forEach(d => ds.add(d));
        }
        ds.delete(d);
        ds.delete(td);
        if (ds.size > 0) {
          checkOk = true;
          // eliminate other digits of this position
          yield {
            chain: [...chain, node],
            effectedPoses: new Set(poses),
            // xd
            d: td,
            // yd
            yd: d,
            effectedDs: ds,
            keep: true,
            keepDs: [d, td],
          };
        }
        // 2. different poses
      } else {
        const startPoses = getRealPoses(startPos);
        if (poses.length === 1 && startPoses.length === 1) {
          // pos is cell then startPos should also be cell.
          // pos is one of startPos's related positions.
          const startPos = startPoses[0];
          const pos = poses[0];
          if (
            checkExistAndEqual(pos.row, startPos.row) ||
            checkExistAndEqual(pos.col, startPos.col) ||
            checkExistAndEqual(pos.block, startPos.block)
          ) {
            const { value } = positions.getCell(cells, pos);
            if (Notes.has(value, td)) {
              checkOk = true;
              yield { chain: [...chain, node], effectedPoses: new Set([pos]), d: td };
            }
          }
        }
      }
      if (!checkOk) {
        // check failed
        getAttrDefault(extraData.checkMemo.xy, startMemoKey, new Set()).add(endMemoKey);
        getAttrDefault(extraData.checkMemo.xy, endMemoKey, new Set()).add(startMemoKey);
      }
    }
  }
}

function* genNextChainAndNode(chain, node, extraData) {
  const { pos, d, val } = node;
  const { dLinks, dAlsces } = extraData;
  if (extraData.tryDigitLinks) {
    // try related links or group links
    for (const targets of [dLinks[d][pos][val], extraData.tryGroupLinks ? dLinks[d][pos].group[val] : []]) {
      for (const tpos of targets) {
        const nextNode = { pos: tpos, val: !val, d };

        if (chainHasNode(chain, nextNode)) {
          continue;
        }

        yield [[...chain, node], nextNode];
      }
    }
  }

  if (extraData.tryCellLinks) {
    // try cell links
    for (const cd of dLinks[d][pos].cell[val]) {
      const nextNode = { pos, val: !val, d: cd };

      if (chainHasNode(chain, nextNode)) {
        continue;
      }

      yield [[...chain, node], nextNode];
    }
  }

  if (extraData.tryAlscLinks) {
    // try alsc links
    for (const link of dLinks[d][pos].alsc[val]) {
      let curNode = null;
      let nextNode = null;
      if (val) {
        // weak link
        const rcc = link;
        curNode = { ...node, pos: dAlsces[d][pos] };
        nextNode = { pos: rcc, val: !val, d: rcc.d };
      } else {
        // strong link
        const { als, alsc } = link;
        curNode = { ...node, pos: dAlsces[d][pos], als };
        nextNode = { pos: alsc, val: !val, d: alsc.d, als };
      }
      if (chainHasNode(chain, nextNode)) {
        continue;
      }
      yield [[...chain, curNode], nextNode];
    }
  }
}

function* searchChainDFS(chain, node, extraData) {
  extraData.stat.searchChainDFS++;
  // optimize
  if (chain.length + 1 >= extraData.maxLength) {
    return;
  }

  yield* checkChain(chain, node, extraData);

  for (const nextChainAndNode of genNextChainAndNode(chain, node, extraData)) {
    yield* searchChainDFS(...nextChainAndNode, extraData);
  }
}

/*
function* searchChainBFS(qs, extraData) {
  while (qs.length > 0) {
    const chain = qs.shift();
    if (chain.length + 1 > extraData.maxLength) {
      continue;
    }

    const node = chain.pop();

    yield* checkChain(chain, node, extraData);

    for (const nextChainAndNode of genNextChainAndNode(chain, node, extraData)) {
      const [chain, nextNode] = nextChainAndNode;
      qs.push([...chain, nextNode]);
    }
  }
}
*/

const chainHasNode = (chain, node) => {
  const poses = getRealPoses(node.pos);
  for (const n of chain) {
    if (n.val === node.val && n.d === node.d && n.pos.key === node.pos.key) {
      return true;
    }
    // FIXME:
    if (n.d === node.d && n.val && node.val) {
      if (n.pos.poses || node.pos.poses) {
        if (hasCommon(poses, getRealPoses(n.pos))) {
          return true;
        }
      }
    }
  }
  return false;
};

const newGroupPos = (domain, val, block, poses, d) => {
  if (poses.length > 1) {
    return {
      key: `${d}@${domain}${val}block${block}`,
      d,
      isGroup: true,
      domain: new Set([domain]),
      [domain]: val,
      block,
      poses,
      toString() {
        return this.key;
      },
    };
  }
  const pos = poses[0];
  return {
    key: pos.key,
    d,
    isGroup: false,
    domain: new Set([domain]),
    [domain]: val,
    block,
    pos,
    poses,
    toString() {
      return this.key;
    },
  };
};

export const getRealPoses = pos => (pos.isGroup || pos.isAlsc ? [...pos.poses] : [pos]);

// for row/col in block, like claiming.
function getDigitGroupPoses(cells) {
  const dGroupPoses = {};
  for (const [domain, xPositions] of [
    ['row', positions.rowPositions],
    ['col', positions.colPositions],
  ]) {
    for (const xPoses of xPositions) {
      const blockDigitPoses = {};
      let val = 0;
      for (const pos of xPoses) {
        val = pos[domain];
        const { value } = positions.getCell(cells, pos);
        if (!Notes.is(value)) {
          continue;
        }
        const digitPoses = getAttrDefault(blockDigitPoses, pos.block, {});
        for (const d of Notes.entries(value)) {
          const poses = getAttrDefault(digitPoses, d, []);
          poses.push(pos);
        }
      }
      for (const [sblock, digitGroups] of Object.entries(blockDigitPoses)) {
        for (const [sd, poses] of Object.entries(digitGroups)) {
          const block = parseInt(sblock);
          const d = parseInt(sd);
          const groupPoses = getAttrDefault(dGroupPoses, d, []);
          if (poses.length > 1) {
            groupPoses.push(newGroupPos(domain, val, block, poses, d));
          } else {
            const pos = poses[0];
            let groupPos = groupPoses.filter(gp => gp.pos === pos)[0];
            if (!groupPos) {
              groupPos = newGroupPos(domain, val, block, poses, d);
              groupPoses.push(groupPos);
            }
            groupPos.domain.add(domain);
            groupPos[domain] = val;
          }
        }
      }
    }
  }
  return dGroupPoses;
}

const hasCommon = (a, b) => {
  return intersection(new Set(a), new Set(b)).size > 0;
};

const getOtherRowGroupPositions = (groupPoses = [], pos) => {
  return groupPoses.filter(p => pos.row !== undefined && p.row === pos.row && p.key !== pos.key);
};

const getOtherColGroupPositions = (groupPoses = [], pos) => {
  return groupPoses.filter(p => pos.col !== undefined && p.col === pos.col && p.key !== pos.key);
};

const getOtherBlockGroupPositions = (groupPoses = [], pos) => {
  const filteredGroupPoses = groupPoses.filter(
    p => p.block === pos.block && p.key !== pos.key && !hasCommon(p.poses, pos.isGroup ? pos.poses : [pos])
  );
  const res = filteredGroupPoses.filter(p => p.isGroup);
  for (const p of filteredGroupPoses.filter(p => !p.isGroup)) {
    let ok = true;
    for (const rpos of res) {
      if (hasCommon(rpos.poses, p.poses)) {
        ok = false;
        break;
      }
    }
    if (ok) {
      res.push(p);
    }
  }
  return res;
};

function getGroupPosLink(groupPoses, pos) {
  // strong: false->true, weak: true->false
  const strongTargets = new Set();
  const weakTargets = new Set();
  for (const [domain, getOtherGroupPositions] of [
    ['row', getOtherRowGroupPositions],
    ['col', getOtherColGroupPositions],
    ['block', getOtherBlockGroupPositions],
  ]) {
    if (pos.isGroup && domain !== 'block' && !pos.domain.has(domain)) {
      continue;
    }

    let count = 0;
    let strongPos = null;
    for (const opos of getOtherGroupPositions(groupPoses, pos)) {
      count++;
      if (opos.isGroup) {
        if (pos.isGroup) {
          // group pos
          weakTargets.add(opos);
          strongPos = opos;
        } else if (!new Set(opos.poses).has(pos)) {
          // pos
          weakTargets.add(opos);
          strongPos = opos;
        }
      }
    }
    if (count === 1 && strongPos) {
      strongTargets.add(strongPos);
    }
  }
  return { false: strongTargets, true: weakTargets };
}

function getPosLink(cells, d, pos) {
  // strong: false->true, weak: true->false
  const strongTargets = new Set();
  const weakTargets = new Set();
  for (const [domain, getRelatedPositions] of [
    ['row', getRelatedRowPositions],
    ['col', getRelatedColPositions],
    ['block', getRelatedBlockPositions],
  ]) {
    let spos = pos;
    let filterPoses = new Set();
    if (pos.isGroup) {
      if (domain !== 'block' && !pos.domain.has(domain)) {
        continue;
      }
      spos = pos.poses[0];
      filterPoses = new Set(pos.poses);
    }

    let count = 0;
    let strongPos = null;
    for (const rpos of getRelatedPositions(spos).filter(p => !filterPoses.has(p))) {
      const { value } = positions.getCell(cells, rpos);
      if (!Notes.has(value, d)) {
        continue;
      }
      weakTargets.add(rpos);
      count++;
      strongPos = rpos;
    }
    if (count === 1) {
      strongTargets.add(strongPos);
    }
  }
  return { false: strongTargets, true: weakTargets };
}

function getAlscLink(alscLinks = {}, pos) {
  return alscLinks[pos];
}

function getDigitPosesAndLinks(cells, options) {
  const dGroupPoses = getDigitGroupPoses(cells);
  const [dAlsces, dAlscLinks] = getDigitAlscAndLinks(cells, dGroupPoses, options);
  const dLinks = {};
  const dPoses = {};
  for (const pos of positions.flattenPositions) {
    const { value } = positions.getCell(cells, pos);
    if (!Notes.is(value)) {
      continue;
    }
    const ds = Notes.entries(value);
    for (const d of ds) {
      const poses = getAttrDefault(dPoses, d, []);
      poses.push(pos);

      const links = getAttrDefault(dLinks, d, {});
      // same digit, different poses
      const link = getPosLink(cells, d, pos);
      links[pos] = link;

      // group
      link.group = getGroupPosLink(dGroupPoses[d], pos);

      const otherDs = new Set(ds.filter(v => v !== d));
      // different digits, same pos
      link.cell = { false: ds.length === 2 ? otherDs : new Set(), true: otherDs };

      link.alsc = getAlscLink(dAlscLinks[d], pos) || { false: new Set(), true: new Set() };
    }
  }
  // group position links
  for (const [sd, groupPoses] of Object.entries(dGroupPoses)) {
    const d = parseInt(sd);
    const links = getAttrDefault(dLinks, d, {});
    for (const pos of groupPoses.filter(p => p.isGroup)) {
      const link = getPosLink(cells, d, pos);
      links[pos] = link;
      link.group = getGroupPosLink(dGroupPoses[d], pos);
      link.cell = { false: new Set(), true: new Set() };
      link.alsc = getAlscLink(dAlscLinks[d], pos) || { false: new Set(), true: new Set() };
    }
  }

  // alsc position links
  for (const [sd, alsces] of Object.entries(dAlsces)) {
    const d = parseInt(sd);
    const links = getAttrDefault(dLinks, d, {});
    for (const alsc of Object.values(alsces).filter(a => a.type === 'alsc')) {
      const link = { false: new Set(), true: new Set() };
      links[alsc] = link;
      link.group = { false: new Set(), true: new Set() };
      link.cell = { false: new Set(), true: new Set() };
      link.alsc = getAlscLink(dAlscLinks[d], alsc) || { false: new Set(), true: new Set() };
    }
  }

  return [dPoses, dGroupPoses, dAlsces, dLinks];
}

const findGroupForALSC = (d, dGroupPoses, domains, poses) => {
  const { row, col, block } = domains;
  const key = `${d}@row${row}col${col}block${block}`;
  const groupPoses = dGroupPoses[d].filter(g => g.isGroup && g.key === key && g.poses.size === poses.size);
  if (groupPoses.length === 1) {
    return groupPoses[0];
  }
};

function getDigitALSCes(cells, dGroupPoses, options = {}) {
  options = { alsSizes: [1, 2, 3, 4, 5, 6, 7, 8], ...options };
  const alses = {};
  const dAlsces = {};
  for (const getPositions of [getRowPositions, getColPositions, getBlockFlattenPositions]) {
    for (const idx of positions.indices) {
      const links = getPosDigitLinks(cells, getPositions(idx));
      const points = Object.values(aggregateLinks(links, 0));
      for (const n of options.alsSizes) {
        for (const [poses, digits] of findALSFromPoints(points, n)) {
          const xlinks = getPosDigitLinks(cells, poses);
          // build digit infos.
          const digitInfos = aggregateLinks(xlinks, 1, 'd', 'poses');
          const key = [...[...poses].map(p => p.key).sort(), [...digits].sort().join('')].join('-');
          const als = alses[key] || {
            key,
            poses,
            digits,
            domains: getPosDomains(poses),
            digitInfos,
            toString() {
              return this.key;
            },
          };
          alses[key] = als;
          for (const d of digits) {
            const digitInfo = digitInfos[d];
            const { poses } = digitInfo;
            const domains = getPosDomains(poses);
            const alsces = getAttrDefault(dAlsces, d, {});
            let key = null;
            let alsc = null;
            if (poses.size === 1) {
              const cell = [...poses][0];
              key = cell.key;
              alsc = alsces[key] || {
                ...digitInfo,
                isAlsc: true,
                domains,
                cell,
                key,
                type: 'cell',
                alses: [],
                toString() {
                  return this.key;
                },
              };
            } else {
              const group = findGroupForALSC(d, dGroupPoses, domains, poses);
              if (group) {
                key = group.key;
                alsc = alsces[key] || {
                  ...digitInfo,
                  isAlsc: true,
                  domains,
                  group,
                  key: group.key,
                  type: 'group',
                  isGroup: true,
                  alses: [],
                  toString() {
                    return this.key;
                  },
                };
              } else {
                key = [...poses]
                  .map(p => p.key)
                  .sort()
                  .join('-');
                alsc = alsces[key] || {
                  ...digitInfo,
                  isAlsc: true,
                  domains,
                  key,
                  type: 'alsc',
                  alses: [],
                  toString() {
                    return this.key;
                  },
                };
              }
            }
            alsc.alses.push(als);
            alsces[key] = alsc;
            digitInfos[d] = alsc;
          }
        }
      }
    }
  }
  return dAlsces;
}

function getRCCs(alsces, alsc) {
  const rccs = [];
  const { poses, domains } = alsc;
  // check every domain of the rcc
  for (const [domain, val] of Object.entries(domains)) {
    // find d related ALSes in domain
    for (const rcc of Object.values(alsces)) {
      if (rcc === alsc) {
        // should not be current als.
        continue;
      }
      if (rcc.domains[domain] !== val) {
        // rcc should be in domain
        continue;
      }
      if (hasCommon(rcc.poses, poses)) {
        // overlapping area should not contain the rcc.
        continue;
      }

      rccs.push(rcc);
    }
  }
  return rccs;
}

function getDigitAlscAndLinks(cells, dGroupPoses, options) {
  const dAlsces = getDigitALSCes(cells, dGroupPoses, options);
  const dAlscLinks = {};
  for (const alsces of Object.values(dAlsces)) {
    for (const alsc of Object.values(alsces)) {
      const { d, alses } = alsc;
      const alscLinks = getAttrDefault(dAlscLinks, d, {});
      const weakTargets = getRCCs(alsces, alsc);
      const strongTargets = [];
      for (const als of alses) {
        for (const t of Object.values(als.digitInfos)) {
          if (t !== alsc) {
            strongTargets.push({ als, alsc: t });
          }
        }
      }
      alscLinks[alsc] = { true: weakTargets, false: strongTargets };
    }
  }

  return [dAlsces, dAlscLinks];
}
