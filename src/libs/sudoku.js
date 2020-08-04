import { flattenPositions, getRelatedPositions, mapPositionsTo, rowColToBlock } from './position';
import * as positions from './position';
import { findNGroupFromLinks, console } from './utils';

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
    return (value & (1 << n)) !== 0;
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
    this.subscribers = [];
    this.setPuzzle(puzzle || Sudoku.defaultPuzzle);
  }

  setPuzzle(puzzle) {
    this._setCells(Sudoku.parse(puzzle));
    this.puzzle = puzzle;
  }

  get cells() {
    return this._cells;
  }

  _setCells(cells) {
    this._cells = cells;
  }

  get initialPuzzle() {
    return this.puzzle;
  }

  subscribe(f) {
    this.subscribers.push(f);
  }

  unsubscribe(f) {
    this.subscribers = this.subscribers.filter(s => s !== f);
  }

  _notify() {
    for (const f of this.subscribers) {
      f(n => n + 1);
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

  stringify() {
    const res = [];
    for (const pos of flattenPositions) {
      const { origin, value } = this.getCell(pos);
      if (Notes.is(value)) {
        // notes
        if (Notes.isEmpty(value)) {
          res.push('0');
        } else {
          res.push('n', ...Notes.entries(value), 'N');
        }
      } else if (origin) {
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
    return this._cells;
  }

  getCell({ row, col }) {
    return this.getCurCells()[row][col];
  }

  _startTx() {
    if (!this._txCells) {
      this._txCells = this.getCurCells();
    }
  }

  _commit() {
    if (this._txCells && this._txCells !== this.cells) {
      this._setCells(this._txCells);
      this._txCells = null;
      this._notify();
    }
  }

  setCellValue(pos, value) {
    this._startTx();
    this._txCells = this._txSetCellValue(this._txCells, pos, value);
  }

  // actions
  static actions = {
    RESET: 'RESET',
    NOTE: 'NOTE',
    UPDATE_CELL_VALUE: 'UPDATE_CELL_VALUE',
    AUTO_NOTE: 'AUTO_NOTE',
    AUTO_POINTING: 'AUTO_POINTING',
    AUTO_CLAIMING: 'AUTO_CLAIMING',
    AUTO_PLACE: 'AUTO_PLACE',
    AUTO_PLACE_POINTING_CLAIMING: 'AUTO_PLACE_POINTING_CLAIMING',
    ELIMINATE_GROUP: 'ELIMINATE_GROUP',
    ELIMINATE_XGROUP: 'ELIMINATE_XGROUP',
    HANDLE_TIP: 'HANDLE_TIP',
  };

  _handlActions(action, payload = {}) {
    switch (action) {
      case Sudoku.actions.RESET:
        this.setPuzzle(this.puzzle);
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
      this._commit();
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

  handleTip(tip) {
    this.dispatch(Sudoku.actions.HANDLE_TIP, { tip });
  }

  _note({ pos }) {
    const { value } = this.getCell(pos);
    if (!Notes.is(value)) {
      return;
    }
    this.setCellValue(pos, Notes.new(...this.calcAvailableDigits(pos)));
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
        this._commit();
        count += this._autoPointing();
        this._commit();
        count += this._autoClaiming();
        this._commit();
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

    this.setCellValue(pos, value);
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

    this.setCellValue(pos, notes);
  }

  findGroup() {
    for (let n = 1; n <= 8; n++) {
      // 0:naked group, 1: hidden group
      for (const cls of [0, 1]) {
        for (const group of findNGroup(this.getCurCells(), n, cls)) {
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

      this.setCellValue(pos, d);
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
        this.setCellValue(pos, Notes.delete(value, ...group.notes));
      }
    } else if (group.cls === 1) {
      // hidden
      // to eliminate other notes
      for (const pos of group.poses) {
        const { value } = this.getCell(pos);
        this.setCellValue(pos, Notes.new(...Notes.entries(value).filter(n => group.notes.has(n))));
      }
    }
  }

  findXGroup() {
    for (let n = 1; n <= 8; n++) {
      for (const group of findNXGroup(this.getCurCells(), n)) {
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

      this.setCellValue(pos, Notes.delete(value, tip.d));
    }
  }

  findTip() {
    const cells = this.getCurCells();
    return this.findGroup(cells) || this.findXGroup(cells);
  }

  _handleTip({ tip }) {
    if (tip.type === 'group') {
      this.eliminateGroup(tip);
    } else if (tip.type === 'X-Group') {
      this.eliminateXGroup(tip);
    }
  }
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
