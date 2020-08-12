import {
  flattenPositions,
  getRelatedPositions,
  mapPositionsTo,
  rowColToBlock,
  getRelatedRowPositions,
  getRelatedColPositions,
  getRelatedBlockPositions,
  getRowPositions,
  getColPositions,
  getBlockFlattenPositions,
} from './position';
import * as positions from './position';
import { findNGroupFromLinks, console, getAttrDefault, shuffleArray } from './utils';

export const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export class Notes {
  static _base = 1 << 16;
  static new(...notes) {
    let value = 1 << 16;
    for (const n of notes) {
      value |= 1 << n;
    }
    return value;
  }

  static isEmpty(value) {
    return value === this._base;
  }

  static size(value) {
    let s = 0;
    for (let n = 1; n <= 9; n++) {
      value = value >> 1;
      if ((value & 1) === 1) {
        s++;
      }
    }
    return s;
  }

  static first(value) {
    for (let n = 1; n <= 9; n++) {
      if (Notes.has(value, n)) {
        return n;
      }
    }
  }

  static entries(value) {
    const res = [];
    for (let n = 1; n <= 9; n++) {
      if (Notes.has(value, n)) {
        res.push(n);
      }
    }
    return res;
  }

  static is(value) {
    return (value & this._base) !== 0;
  }

  static has(value, n) {
    return Notes.is(value) && (value & (1 << n)) !== 0;
  }

  static add(value, n) {
    return value | (1 << n);
  }

  static delete(value, ...ns) {
    for (const n of ns) {
      value &= ~(1 << n);
    }
    return value;
  }
}

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
  }

  _setPuzzle(puzzle) {
    // clear history
    this._cellsHistory = [];
    this._curCellsIdx = -1;
    this._txCells = null;
    this._historyLowerBound = 0;
    this._setCells(Sudoku.parse(puzzle), 'init');
    this.puzzle = this.stringify();
    // FIXME:
    this._notify();
  }

  setHistoryLowerBound(n) {
    this._historyLowerBound = n;
  }

  clearHistoryLowerBound() {
    this._historyLowerBound = 0;
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

  _setCells(cells, desc = '') {
    this._cut();
    this._curCellsIdx++;
    this._cellsHistory.push({ idx: this._curCellsIdx, cells, desc });
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
      for (const f of this.subscribers) {
        f(n => n + 1);
      }
    }
  }

  static cellPattern = /(\d)|(p\d)|(n[1-9]*N)/g;
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
      } else if (cell === '0') {
        // it's empty
        return { value: Notes.new() };
      }
      throw new Error('impossible');
    });

    // organize the values
    const cells = Array.from(new Array(9)).map(() => new Array(9));
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        cells[i][j] = flattenCellValues[9 * i + j];
      }
    }
    // TODO: check board integrity, no duplicated digit in any row, col, block.
    return cells;
  }

  stringify(cells, options = { placedAsOrigin: false, withNotes: true }) {
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
      } else if (options.placedAsOrigin || origin) {
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

  _txSetCellValue(cells, pos, value) {
    const { row, col } = pos;
    const { value: oldValue } = this.getCell(pos);
    if (value === oldValue) {
      return cells;
    }

    const curCells = this.getCurCells();
    if (cells === curCells) {
      cells = [...curCells];
    }
    if (cells[row] === curCells[row]) {
      cells[row] = [...curCells[row]];
    }
    if (cells[row][col] === curCells[row][col]) {
      cells[row][col] = { ...curCells[row][col] };
    }
    cells[row][col].value = value;
    if (!Notes.is(value)) {
      // updated related notes
      for (const rpos of getRelatedPositions(pos)) {
        const cell = this.getCell(rpos);
        if (!Notes.is(cell.value)) {
          // is not notes
          continue;
        }
        cells = this._txSetCellValue(cells, rpos, Notes.delete(cell.value, value));
      }
    }
    return cells;
  }

  getCurCells() {
    if (this._txCells) {
      // in transaction
      return this._txCells;
    }
    return this.cells;
  }

  getCell({ row, col }) {
    return this.getCurCells()[row][col];
  }

  _startTx() {
    if (!this._txCells) {
      this._txCells = this.getCurCells();
    }
  }

  _commit(desc = '') {
    if (this._txCells && this._txCells !== this.cells) {
      this._setCells(this._txCells, desc);
      this._txCells = null;
      this._notify();
    }
  }

  _rollback() {
    this._txCells = null;
  }

  _setCellValue(pos, value) {
    this._startTx();
    this._txCells = this._txSetCellValue(this._txCells, pos, value);
  }

  // actions
  static actions = {
    RESET: 'RESET',
    NOTE: 'NOTE',
    UPDATE_CELL_VALUE: 'U CELL_VALUE',
    AUTO_NOTE: 'A NOTE',
    AUTO_POINTING: 'A POINTING',
    AUTO_CLAIMING: 'A CLAIMING',
    AUTO_PLACE: 'A PLACE',
    AUTO_PLACE_POINTING_CLAIMING: 'A PLACE/POINTING/CLAIMING',
    ELIMINATE_GROUP: '- GROUP',
    ELIMINATE_XGROUP: '- XGROUP',
    ELIMINATE_CHAIN: '- CHAIN',
    ELIMINATE_TRIAL_ERROR: '- TRIAL_ERROR',
    HANDLE_TIP: 'HANDLE_TIP',
  };

  _handlActions(action, payload = {}) {
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
        this._eliminateGroup(payload);
        break;
      case Sudoku.actions.ELIMINATE_XGROUP:
        this._eliminateXGroup(payload);
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
    this._handlActions(action, payload, options);

    if (options.log) {
      console.groupEnd();
    }

    if (options.commit) {
      this._commit(action);
    }
  }

  reset() {
    this.dispatch(Sudoku.actions.RESET);
  }

  note(pos) {
    this.dispatch(Sudoku.actions.NOTE, { pos });
  }

  updateCellValue(isNoting, pos, value) {
    this.dispatch(Sudoku.actions.UPDATE_CELL_VALUE, { isNoting, pos, value });
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
    this.dispatch(Sudoku.actions.ELIMINATE_GROUP, { group });
  }

  eliminateXGroup(tip) {
    this.dispatch(Sudoku.actions.ELIMINATE_XGROUP, { tip });
  }

  eliminateChain(tip) {
    this.dispatch(Sudoku.actions.ELIMINATE_CHAIN, { tip });
  }

  eliminateTrialError(tip) {
    this.dispatch(Sudoku.actions.ELIMINATE_TRIAL_ERROR, { tip });
  }

  handleTip(tip) {
    this.dispatch(Sudoku.actions.HANDLE_TIP, { tip });
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
        return false;
      }
    }
    return true;
  }

  _note({ pos }) {
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
      this.dispatch(Sudoku.actions.NOTE, { pos }, { commit: false, log: false });
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
          this.dispatch(Sudoku.actions.ELIMINATE_GROUP, { group }, { commit: false });
          count++;
          placed = true;
          break;
        }
        /* use current cells for every find */
        if (placed) {
          continue;
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
    for (const tip of findNXGroup(this.getCurCells(), 1, { br: true, bc: true })) {
      console.log(tip);
      this.dispatch(Sudoku.actions.ELIMINATE_XGROUP, { tip }, { commit: false });
      count++;
    }
    console.groupEnd();
    return count;
  }

  // row/col eliminate block
  _autoClaiming() {
    let count = 0;
    console.group('[auto claiming]');
    for (const tip of findNXGroup(this.getCurCells(), 1, { rb: true, cb: true })) {
      this.dispatch(Sudoku.actions.ELIMINATE_XGROUP, { tip }, { commit: false });
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
          group.type = 'group';
          return group;
        }
      }
    }
  }

  _eliminateGroup({ group }) {
    if (group.n === 1) {
      // place value
      const pos = [...group.poses][0];
      const d = [...group.notes][0];

      this._setCellValue(pos, d);
    } else if (group.cls === 0) {
      // naked
      // to eliminate other cells
      let otherPoses = [];
      if (group.domain === 'row') {
        otherPoses = positions.getRowPositions(group.row);
      } else if (group.domain === 'col') {
        otherPoses = positions.getColPositions(group.col);
      } else if (group.domain === 'block') {
        otherPoses = positions.getBlockFlattenPositions(group.block);
      }
      otherPoses = otherPoses.filter(pos => {
        const { value } = this.getCell(pos);
        return !(!Notes.is(value) || group.poses.has(pos));
      });
      for (const pos of otherPoses) {
        const { value } = this.getCell(pos);
        this._setCellValue(pos, Notes.delete(value, ...group.notes));
      }
    } else if (group.cls === 1) {
      // hidden
      // to eliminate other notes
      for (const pos of group.poses) {
        const { value } = this.getCell(pos);
        this._setCellValue(pos, Notes.new(...Notes.entries(value).filter(n => group.notes.has(n))));
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

  _eliminateXGroup({ tip }) {
    const otherPositions = [];
    if (tip.effect === 'row') {
      for (const row of tip.rows) {
        otherPositions.push(...positions.getRowPositions(row));
      }
    } else if (tip.effect === 'col') {
      for (const col of tip.cols) {
        otherPositions.push(...positions.getColPositions(col));
      }
    } else if (tip.effect === 'block') {
      for (const block of tip.blocks) {
        otherPositions.push(...positions.getBlockFlattenPositions(block));
      }
    }

    for (const pos of otherPositions) {
      const { value } = this.getCell(pos);
      if (!Notes.is(value) || tip.poses.has(pos)) {
        continue;
      }

      this._setCellValue(pos, Notes.delete(value, tip.d));
    }
  }

  findTip(options = { trial: true }) {
    const cells = this.getCurCells();
    return (
      this.findGroup(cells) ||
      this.findXGroup(cells) ||
      this.findChain(cells) ||
      (options.trial && this.findTrialError())
    );
  }

  _handleTip({ tip }) {
    if (tip.type === 'group') {
      this.eliminateGroup(tip);
    } else if (tip.type === 'X-Group') {
      this.eliminateXGroup(tip);
    } else if (tip.type === 'chain') {
      this.eliminateChain(tip);
    } else if (tip.type === 'trial-error') {
      this.eliminateTrialError(tip);
    }
  }

  findTrialError() {
    this._disableNotify();
    const startIdx = this._curCellsIdx;
    const poses = shuffleArray(positions.flattenPositions);
    for (const tryTip of [false, true]) {
      // randomize this pos choice
      for (const pos of poses) {
        const { value } = this.getCell(pos);
        if (!Notes.is(value)) {
          continue;
        }
        for (const d of Notes.entries(value)) {
          // start trial for d@pos
          let deepTried = 0;
          this.updateCellValue(false, pos, d);
          this.autoPlacePointingClaiming();
          let err = this._checkValidity();
          if (!err && tryTip) {
            let tip = this.findTip({ trial: false });
            while (tip) {
              deepTried++;
              this.handleTip(tip);
              this.autoPlacePointingClaiming();
              err = this._checkValidity();
              if (err) {
                break;
              }
              tip = this.findTip({ trial: false });
            }
            if (this._checkComplete()) {
              err = true;
            }
          }
          if (err) {
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

  _eliminateTrialError({ tip }) {
    const { startIdx, pos, d, err } = tip;
    if (err === true) {
      // complete
      return;
    }
    this.revertTo(startIdx);
    const { value } = this.getCell(pos);
    if (Notes.is(value)) {
      this._setCellValue(pos, Notes.delete(value, d));
    }
  }

  findChain(cells) {
    const [dPoses, dGroupPoses, dLinks] = getDigitPosesAndLinks(cells);
    console.log('chain info:', dGroupPoses, dLinks);
    // randomize digits.
    const ds = shuffleArray(digits);
    for (const maxLen of [20, Number.MAX_VALUE]) {
      for (const tryCellLinks of [false, true]) {
        for (const tryGroupLinks of [false, true]) {
          // for (const getPoses of [d => dPoses[d] || [] /*, d => (dGroupPoses[d] || []).filter(p => p.isGroup)*/]) {
          for (const getPoses of [d => dPoses[d] || [], d => (dGroupPoses[d] || []).filter(p => p.isGroup)]) {
            let dRes = null;
            let maxLength = maxLen;
            for (const d of ds) {
              for (const pos of getPoses(d)) {
                const val = false;
                const startNode = { pos, d, val };
                const extraData = {
                  dLinks,
                  val: false,
                  cells,
                  td: d,
                  tryGroupLinks,
                  tryCellLinks,
                  maxLength,
                };
                for (const chain of searchChain([], startNode, extraData)) {
                  if (chain.chain.length < maxLength) {
                    dRes = chain;
                    maxLength = dRes.chain.length;
                    extraData.maxLength = maxLength;
                    if (maxLength <= 10) {
                      return prepareChainResult(dRes);
                    }
                  }
                }
              }
            }
            if (dRes) {
              return prepareChainResult(dRes);
            }
          }
        }
      }
    }
  }

  _eliminateChain({ tip }) {
    for (const pos of tip.effectedPoses) {
      const { value } = this.getCell(pos);
      if (!Notes.is(value)) {
        continue;
      }
      let newValue = value;
      if (tip.keep) {
        newValue = Notes.new(...tip.keepDs);
      } else {
        newValue = Notes.delete(value, tip.d);
      }
      this._setCellValue(pos, newValue);
    }
  }
}

const prepareChainResult = res => {
  res.type = 'chain';
  const startPos = res.chain[0].pos;
  const endNode = res.chain[res.chain.length - 1];
  const endPos = endNode.pos;
  const d = res.d;
  let hasMulti = false;
  let hasGroup = false;
  for (const node of res.chain) {
    if (node.d !== d) {
      hasMulti = true;
    }
    if (node.pos.isGroup) {
      hasGroup = true;
    }
    if (hasMulti && hasGroup) {
      break;
    }
  }
  const parts = [res.chain.length - 1];
  if (hasGroup) {
    parts.push('G');
  }
  parts.push(hasMulti ? 'XY' : 'X', 'Chain');
  parts.push([startPos.isGroup ? 'g' : 'd', endPos.isGroup ? 'g' : 'd', endNode.d === d ? '-x' : '-xy'].join(''));
  res.name = parts.join('-');
  return res;
};

const checkExistAndEqual = (a, b) => a !== undefined && a === b;

function* searchChain(chain, node, extraData) {
  // optimize
  if (chain.length + 1 >= extraData.maxLength) {
    return;
  }

  const { pos, d, val } = node;
  const { dLinks, cells, td } = extraData;

  if (extraData.val === false && val === true) {
    // strong link
    const startPos = chain[0].pos;
    // strong link is reversable.
    // digit(startPos) -> group(endPos)
    if (!(startPos.isGroup && !pos.isGroup)) {
      if (d === td) {
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
        }
      } else {
        // xy-chain
        // two types:
        // 1. same pos
        if (startPos.key === pos.key) {
          // pos and startPos are all groups of all not.
          //
          // but at this case, start and end poses must not be groups.
          // diffrenet digits' group keys are all different.
          const poses = pos.isGroup ? [...pos.poses] : [pos];
          const ds = new Set();
          for (const p of poses) {
            const { value } = positions.getCell(cells, p);
            Notes.entries(value).forEach(d => ds.add(d));
          }
          if (ds.size > 2) {
            // eliminate other digits of this position
            ds.delete(d);
            ds.delete(td);
            yield {
              chain: [...chain, node],
              effectedPoses: new Set(poses),
              d: td,
              effectedDs: ds,
              keep: true,
              keepDs: [d, td],
            };
          }
          // 2. different poses
        } else {
          if (!pos.isGroup) {
            // pos is cell then startPos should also be cell.
            // pos is one of startPos's related positions.
            if (
              checkExistAndEqual(pos.row, startPos.row) ||
              checkExistAndEqual(pos.col, startPos.col) ||
              checkExistAndEqual(pos.block, startPos.block)
            ) {
              const { value } = positions.getCell(cells, pos);
              if (Notes.has(value, td)) {
                yield { chain: [...chain, node], effectedPoses: new Set([pos]), d: td };
              }
            }
          }
        }
      }
    }
  }
  // try related links or group links
  for (const targets of [dLinks[d][pos][val], extraData.tryGroupLinks ? dLinks[d][pos].group[val] : []]) {
    for (const tpos of targets) {
      const nextNode = { pos: tpos, val: !val, d };

      if (chainHasNode(chain, nextNode)) {
        continue;
      }

      yield* searchChain([...chain, node], nextNode, extraData);
    }
  }

  if (extraData.tryCellLinks) {
    // try cell links
    for (const cd of dLinks[d][pos].cell[val]) {
      const nextNode = { pos, val: !val, d: cd };

      if (chainHasNode(chain, nextNode)) {
        continue;
      }

      yield* searchChain([...chain, node], nextNode, extraData);
    }
  }
}

const chainHasNode = (chain, node) => {
  const poses = node.pos.isGroup ? node.pos.poses : [node.pos];
  for (const n of chain) {
    if (n.val === node.val && n.d === node.d && n.pos === node.pos) {
      return true;
    }
    if (n.pos.isGroup || node.pos.isGroup) {
      if (hasCommon(poses, n.pos.isGroup ? n.pos.poses : [n.pos])) {
        return true;
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

export const getRealPoses = pos => (pos.isGroup ? pos.poses : [pos]);

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
  const sb = new Set(b);
  return a.filter(v => sb.has(v)).length > 0;
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

function getGroupPosLink(groupPoses, pos, d) {
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
  return { false: [...strongTargets], true: [...weakTargets] };
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
  return { false: [...strongTargets], true: [...weakTargets] };
}

function getDigitPosesAndLinks(cells) {
  const dGroupPoses = getDigitGroupPoses(cells);
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
      const link = getPosLink(cells, d, pos);
      links[pos] = link;
      link.group = getGroupPosLink(dGroupPoses[d], pos, d);

      const otherDs = ds.filter(v => v !== d);
      link.cell = { false: ds.length === 2 ? otherDs : [], true: otherDs };
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
      link.cell = { false: [], true: [] };
    }
  }

  return [dPoses, dGroupPoses, dLinks];
}

function getPositionsLinks(cells, positions) {
  const links = [];
  for (const pos of positions) {
    const { value } = cells[pos.row][pos.col];
    if (!Notes.is(value)) {
      continue;
    }

    for (const note of Notes.entries(value)) {
      links.push([pos, note]);
    }
  }
  return links;
}

function* findNGroup(cells, n, cls) {
  // rows
  for (const row of positions.rows) {
    const links = getPositionsLinks(cells, positions.getRowPositions(row));
    for (const group of findNGroupFromLinks(links, n, cls, { checkClear: n > 1 })) {
      const poses = group[cls];
      const notes = group[(cls + 1) % 2];
      yield { cls, n, domain: 'row', row: row, poses, notes, name: ['naked', 'hidden'][cls] + `-${n}-group` };
    }
  }
  // cols
  for (const col of positions.cols) {
    const links = getPositionsLinks(cells, positions.getColPositions(col));
    for (const group of findNGroupFromLinks(links, n, cls, { checkClear: n > 1 })) {
      const poses = group[cls];
      const notes = group[(cls + 1) % 2];
      yield { cls, n, domain: 'col', col: col, poses, notes, name: ['naked', 'hidden'][cls] + `-${n}-group` };
    }
  }
  // blocks
  for (const block of positions.blocks) {
    const links = getPositionsLinks(cells, positions.getBlockFlattenPositions(block));
    for (const group of findNGroupFromLinks(links, n, cls, { checkClear: n > 1 })) {
      const poses = group[cls];
      const notes = group[(cls + 1) % 2];
      yield { cls, n, domain: 'block', block: block, poses, notes, name: ['naked', 'hidden'][cls] + `-${n}-group` };
    }
  }
}

const getAToBLinks = (getPositions, getEnd) => (cells, d) => {
  const links = [];
  for (let a = 0; a < 9; a++) {
    for (const pos of getPositions(a)) {
      const { value } = cells[pos.row][pos.col];
      if (!Notes.is(value)) {
        continue;
      }
      if (Notes.has(value, d)) {
        links.push([a, getEnd(pos)]);
      }
    }
  }
  return links;
};

const getRowToColLinks = getAToBLinks(positions.getRowPositions, pos => pos.col);
const getRowToBlockLinks = getAToBLinks(positions.getRowPositions, pos => rowColToBlock(pos.row, pos.col));
const getColToBlockLinks = getAToBLinks(positions.getColPositions, pos => rowColToBlock(pos.row, pos.col));

const getPositionsForDigit = (cells, d, positions) => {
  const poses = [];
  for (const pos of positions) {
    const { value } = cells[pos.row][pos.col];
    if (Notes.is(value) && Notes.has(value, d)) {
      poses.push(pos);
    }
  }
  return poses;
};

function* findNXGroup(cells, n, types = { rc: true, cr: true, rb: true, br: true, cb: true, bc: true }) {
  for (let d = 1; d <= 9; d++) {
    if (types.rc || types.cr) {
      // row->col
      const rcLinks = getRowToColLinks(cells, d);
      if (types.rc) {
        for (const group of findNGroupFromLinks(rcLinks, n, 0)) {
          const [rows, cols] = group;
          const poses = [];
          let isXWing = true;
          for (const row of rows) {
            const rowPositions = getPositionsForDigit(cells, d, positions.getRowPositions(row));
            if (rowPositions.length !== n) {
              isXWing = false;
            }
            poses.push(...rowPositions);
          }
          const name = isXWing ? `${n}-X-Wing` : `${n}-XRC-Group`;
          yield { name, domain: 'row', effect: 'col', rows, cols, poses: new Set(poses), d };
        }
      }
      // col->row
      if (types.cr) {
        for (const group of findNGroupFromLinks(rcLinks, n, 1)) {
          const [cols, rows] = group;
          const poses = [];
          let isXWing = true;
          for (const col of cols) {
            const colPositions = getPositionsForDigit(cells, d, positions.getColPositions(col));
            if (colPositions.length !== n) {
              isXWing = false;
            }
            poses.push(...getPositionsForDigit(cells, d, positions.getColPositions(col)));
          }
          const name = isXWing ? `${n}-X-Wing` : `${n}-XCR-Group`;
          yield { name, domain: 'col', effect: 'row', rows, cols, poses: new Set(poses), d };
        }
      }
    }

    if (types.rb || types.br) {
      // row->block, 1-xrb-group is claiming
      const rbLinks = getRowToBlockLinks(cells, d);
      if (types.rb) {
        for (const group of findNGroupFromLinks(rbLinks, n, 0)) {
          const [rows, blocks] = group;
          const poses = [];
          for (const row of rows) {
            poses.push(...getPositionsForDigit(cells, d, positions.getRowPositions(row)));
          }
          const name = n === 1 ? 'claiming' : `${n}-XRB-Group`;
          yield { name, domain: 'row', effect: 'block', rows, blocks, poses: new Set(poses), d };
        }
      }
      // block-row, 1-xbr-group is pointing
      if (types.br) {
        for (const group of findNGroupFromLinks(rbLinks, n, 1)) {
          const [blocks, rows] = group;
          const poses = [];
          for (const block of blocks) {
            poses.push(...getPositionsForDigit(cells, d, positions.getBlockFlattenPositions(block)));
          }
          const name = n === 1 ? 'pointing' : `${n}-XBR-Group`;
          yield { name, domain: 'block', effect: 'row', rows, blocks, poses: new Set(poses), d };
        }
      }
    }

    if (types.cb || types.bc) {
      // col->block, 1-xcb-group is claiming
      const cbLinks = getColToBlockLinks(cells, d);
      if (types.cb) {
        for (const group of findNGroupFromLinks(cbLinks, n, 0)) {
          const [cols, blocks] = group;
          const poses = [];
          for (const col of cols) {
            poses.push(...getPositionsForDigit(cells, d, positions.getColPositions(col)));
          }
          const name = n === 1 ? 'claiming' : `${n}-XCB-Group`;
          yield { name, domain: 'col', effect: 'block', cols, blocks, poses: new Set(poses), d };
        }
      }

      // block-col, 1-xbc-group is pointing
      if (types.bc) {
        for (const group of findNGroupFromLinks(cbLinks, n, 1)) {
          const [blocks, cols] = group;
          const poses = [];
          for (const block of blocks) {
            poses.push(...getPositionsForDigit(cells, d, positions.getBlockFlattenPositions(block)));
          }
          const name = n === 1 ? 'pointing' : `${n}-XBC-Group`;
          yield { name, domain: 'block', effect: 'col', cols, blocks, poses: new Set(poses), d };
        }
      }
    }
  }
}
