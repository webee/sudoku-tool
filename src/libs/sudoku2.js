import {
  flattenPositions,
  getRelatedPositions,
  getRelatedBlockPositions,
  getRelatedRowPositions,
  getRelatedColPositions,
  mapPositionsTo,
  rowColToBlock,
} from './position';
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
    this.setCurCells(Sudoku.parse(puzzle));
    this.puzzle = puzzle;
  }

  get cells() {
    return this._cells;
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

  getCurCells() {
    return this._cells;
  }

  setCurCells(cells) {
    this._cells = cells;
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
          for (const [row, col] of getRelatedPositions(pos)) {
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

  getCell({ row, col }) {
    if (this._txCells) {
      // in transaction
      return this._txCells[row][col];
    }
    return this.getCurCells()[row][col];
  }

  _startTx(tx) {
    if (!this._txCells) {
      this._txCells = this.getCurCells();
    }
    tx((pos, value) => {
      this._txCells = this._txSetCellValue(this._txCells, pos, value);
    });
  }

  _commit() {
    if (this._txCells && this._txCells !== this.getCurCells()) {
      this.setCurCells(this._txCells);
      this._txCells = null;
      this._notify();
    }
  }

  setCellValue(pos, value) {
    this._startTx(setPosValue => {
      setPosValue(pos, value);
    });
  }

  // actions
  static actions = {
    RESET: 'RESET',
    NOTE: 'NOTE',
    UPDATE_CELL_VALUE: 'UPDATE_CELL_VALUE',
    AUTO_NOTE: 'AUTO_NOTE',
    AUTO_PLACE: 'AUTO_PLACE',
    POINTING: 'POINTING',
    CLAIMING: 'CLAIMING',
    ELIMINATE_GROUP: 'ELIMINATE_GROUP',
    ELIMINATE_XWING: 'eliminate_XWING',
    ELIMINATE_XGROUP: 'ELIMINATE_XGROUP',
    HANDLE_TIP: 'HANDLE_TIP',
  };

  _handlActions(action, payload = {}, { commit = true }) {
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
      case Sudoku.actions.UPDATE_CELL_VALUE:
        this._updateCellValue(payload);
        break;
      case Sudoku.actions.POINTING:
        this._pointing();
        break;
      case Sudoku.actions.CLAIMING:
        this._claiming();
        break;
      case Sudoku.actions.ELIMINATE_GROUP:
        this._eliminateGroup(payload);
        break;
      case Sudoku.actions.ELIMINATE_XWING:
        this._eliminateXWing(payload);
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
    if (commit) {
      this._commit();
    }
  }

  dispatch(action, payload, options = {}) {
    console.log('[action]', action, payload, options);
    this._handlActions(action, payload, options);
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

  autoPlace() {
    this.dispatch(Sudoku.actions.AUTO_PLACE);
  }

  pointing() {
    this.dispatch(Sudoku.actions.POINTING);
  }

  claiming() {
    this.dispatch(Sudoku.actions.CLAIMING);
  }

  eliminateGroup(group) {
    this.dispatch(Sudoku.actions.ELIMINATE_GROUP, { group });
  }

  eliminateXWing(tip) {
    this.dispatch(Sudoku.actions.ELIMINATE_XWING, { tip });
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
      this.dispatch(Sudoku.actions.NOTE, { pos }, { commit: false });
    }
  }

  // auto place naked/hidden single value
  _autoPlace() {
    let placed = true;

    console.group('[place]');
    while (placed) {
      placed = false;
      for (const pos of flattenPositions) {
        const cell = this.getCell(pos);
        if (!Notes.is(cell.value)) {
          continue;
        }

        // note cell
        const notes = cell.value;
        if (Notes.size(notes) === 1) {
          placed = true;
          // 1. naked single
          const note = Notes.first(notes);
          this.setCellValue(pos, note);
          console.log(`naked single: ${note}@${pos}`);
        } else {
          // 1. hidden single/unique value of row, col or block;
          const uv =
            this.findUniqueNote(notes, getRelatedRowPositions(pos)) ||
            this.findUniqueNote(notes, getRelatedColPositions(pos)) ||
            this.findUniqueNote(notes, getRelatedBlockPositions(pos));
          if (uv) {
            placed = true;
            this.setCellValue(pos, uv);
            console.log(`hidden single: ${uv}@${pos}`);
          }
        }
      }
    }

    console.groupEnd();
  }

  // find unique note of notes to cells.
  findUniqueNote(notes, positions) {
    let remNotes = new Set(Notes.entries(notes));
    for (const pos of positions) {
      const { value } = this.getCell(pos);
      if (!Notes.is(value)) {
        continue;
      }
      for (const n of Notes.entries(value)) {
        remNotes.delete(n);
      }
    }
    if (remNotes.size === 1) {
      return [...remNotes][0];
    }
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

  // block eliminate row/col
  _pointing() {
    console.group('[pointing]');
    for (const b of positions.blocks) {
      // {pos:[row, col], to:null} / {to:[row|col],row|col,n} / false
      const results = {};
      for (const pos of positions.getBlockFlattenPositions(b)) {
        const { value } = this.getCell(pos);
        if (!Notes.is(value)) {
          continue;
        }
        for (const n of Notes.entries(value)) {
          if (!results.hasOwnProperty(n)) {
            results[n] = { pos, to: null };
            continue;
          }
          if (results[n] === false) {
            continue;
          }
          switch (results[n].to) {
            case 'row':
              if (results[n].row !== pos.row) {
                results[n] = false;
              }
              break;
            case 'col':
              if (results[n].col !== pos.col) {
                results[n] = false;
              }
              break;
            default:
              if (results[n].pos.row === pos.row) {
                results[n] = { to: 'row', row: pos.row, n };
              } else if (results[n].pos.col === pos.col) {
                results[n] = { to: 'col', col: pos.col, n };
              } else {
                results[n] = false;
              }
              break;
          }
        }
      }
      // results
      for (const res of Object.values(results)) {
        if (res === false || !res.to) {
          continue;
        }
        if (res.to === 'row') {
          // clear r.row for r.n
          for (const col of positions.cols) {
            const pos = positions.getPosition(res.row, col);
            const { value } = this.getCell(pos);
            if (!Notes.is(value)) {
              continue;
            }
            if (b === rowColToBlock(res.row, col)) {
              continue;
            }

            if (!Notes.has(value, res.n)) {
              continue;
            }

            console.log(`block:${b}=>row:${res.row}, n:${res.n}, col:${col}`);

            this.setCellValue(pos, Notes.delete(value, res.n));
          }
        } else if (res.to === 'col') {
          // clear r.col for r.n
          for (const row of positions.rows) {
            const pos = positions.getPosition(row, res.col);
            const { value } = this.getCell(pos);
            if (!Notes.is(value)) {
              continue;
            }
            if (b === rowColToBlock(row, res.col)) {
              continue;
            }

            if (!Notes.has(value, res.n)) {
              continue;
            }

            console.log(`block:${b}=>col:${res.col}, n:${res.n}, row:${row}`);

            this.setCellValue(pos, Notes.delete(value, res.n));
          }
        }
      }
    }
    console.groupEnd();
  }

  // row/col eliminate block
  _claiming() {
    console.group('[claiming]');
    // rows
    for (const row of positions.rows) {
      // {block, n} / false
      const results = {};
      for (const col of positions.cols) {
        const pos = positions.getPosition(row, col);
        const { value } = this.getCell(pos);
        if (!Notes.is(value)) {
          continue;
        }
        for (const n of Notes.entries(value)) {
          const block = rowColToBlock(row, col);
          if (!results.hasOwnProperty(n)) {
            results[n] = { block, n };
            continue;
          }
          if (results[n] === false) {
            continue;
          }
          if (results[n].block !== block) {
            results[n] = false;
          }
        }
      }
      // results
      for (const res of Object.values(results)) {
        if (res === false) {
          continue;
        }

        for (const pos of positions.getBlockFlattenPositions(res.block)) {
          const { value } = this.getCell(pos);
          if (!Notes.is(value)) {
            continue;
          }

          if (row === pos.row) {
            continue;
          }

          if (!Notes.has(value, res.n)) {
            continue;
          }
          console.log(`row:${row}=>block:${res.block}, n:${res.n}, row:${pos.row}, col:${pos.col}`);

          this.setCellValue(pos, Notes.delete(value, res.n));
        }
      }
    }
    // cols
    for (const col of positions.cols) {
      // {block, n} / false
      const results = {};
      for (const row of positions.rows) {
        const pos = positions.getPosition(row, col);
        const { value } = this.getCell(pos);
        if (!Notes.is(value)) {
          continue;
        }
        for (const n of Notes.entries(value)) {
          const block = rowColToBlock(row, col);
          if (!results.hasOwnProperty(n)) {
            results[n] = { block, n };
            continue;
          }
          if (results[n] === false) {
            continue;
          }
          if (results[n].block !== block) {
            results[n] = false;
          }
        }
      }
      // results
      for (const res of Object.values(results)) {
        if (res === false) {
          continue;
        }

        for (const pos of positions.getBlockFlattenPositions(res.block)) {
          const { value } = this.getCell(pos);
          if (!Notes.is(value)) {
            continue;
          }

          if (col === pos.col) {
            continue;
          }

          if (!Notes.has(value, res.n)) {
            continue;
          }

          console.log(`col:${col}=>block:${res.block}, n:${res.n}, row:${pos.row}, col:${pos.col}`);

          this.setCellValue(pos, Notes.delete(value, res.n));
        }
      }
    }
    console.groupEnd();
  }

  findGroup() {
    for (let n = 1; n <= 8; n++) {
      // 0:naked group, 1: hidden group
      for (const cls of [0, 1]) {
        for (const group of findNGroup(this.getCurCells(), n, cls)) {
          // only return the first group
          group.type = 'group';
          group.name = ['naked', 'hidden'][cls] + `-${n}-group`;
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

  findXWing() {
    for (const res of searchXWing(this.getCurCells())) {
      res.type = 'X-Wing';
      return res;
    }
  }

  _eliminateXWing({ tip }) {
    const otherPositions = [];
    if (tip.domain === 'row') {
      for (const col of tip.cols) {
        otherPositions.push(...positions.getColPositions(col));
      }
    } else if (tip.domain === 'col') {
      for (const row of tip.rows) {
        otherPositions.push(...positions.getRowPositions(row));
      }
    }
    otherPositions
      .filter(pos => {
        const { value } = this.getCell(pos);
        return !(!Notes.is(value) || tip.poses.has(pos));
      })
      .forEach(pos => {
        const { value } = this.getCell(pos);
        this.setCellValue(pos, Notes.delete(value, tip.d));
      });
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
      yield { cls, n, domain: 'row', row: row, poses, notes };
    }
  }
  // cols
  for (const col of positions.cols) {
    const links = getPositionsLinks(cells, positions.getColPositions(col));
    for (const group of findNGroupFromLinks(links, n, cls, { checkClear: n > 1 })) {
      const poses = group[cls];
      const notes = group[(cls + 1) % 2];
      yield { cls, n, domain: 'col', col: col, poses, notes };
    }
  }
  // blocks
  for (const block of positions.blocks) {
    const links = getPositionsLinks(cells, positions.getBlockFlattenPositions(block));
    for (const group of findNGroupFromLinks(links, n, cls, { checkClear: n > 1 })) {
      const poses = group[cls];
      const notes = group[(cls + 1) % 2];
      yield { cls, n, domain: 'block', block: block, poses, notes };
    }
  }
}

function* scanNXwing(cells, d, getPositions, getOtherPositions, yi) {
  const dist = {};
  for (let x = 0; x < 9; x++) {
    const ys = [];
    getPositions(x).forEach(pos => {
      const y = pos[yi];
      const { value } = cells[pos.row][pos.col];
      if (!Notes.is(value)) {
        return;
      }
      if (Notes.has(value, d)) {
        ys.push(y);
      }
    });
    if (ys.length > 1) {
      const key = ys.join('');
      const res = dist[key] || { xs: [], ys };
      dist[key] = res;
      res.xs.push(x);
    }
  }
  // handle dist
  for (const res of Object.values(dist)) {
    if (res.xs.length !== res.ys.length) {
      continue;
    }

    const s = res.xs.length;
    const poses = new Set();
    for (const x of res.xs) {
      for (const y of res.ys) {
        if (yi === 'col') {
          poses.add(positions.getPosition(x, y));
        } else {
          poses.add(positions.getPosition(y, x));
        }
      }
    }

    let cleared = true;
    // check if x-wing is cleared
    const otherPositions = [];
    for (const y of res.ys) {
      otherPositions.push(...getOtherPositions(y));
    }
    for (const pos of otherPositions.filter(pos => {
      const { value } = cells[pos.row][pos.col];
      return !(!Notes.is(value) || poses.has(pos));
    })) {
      const { value } = cells[pos.row][pos.col];
      if (Notes.has(value, d)) {
        // need clear
        cleared = false;
        break;
      }
    }

    if (!cleared) {
      yield {
        name: `${s}-X-Wing`,
        domain: yi,
        [{ row: 'cols', col: 'rows' }[yi]]: new Set(res.xs),
        [{ col: 'rows', row: 'cols' }[yi]]: new Set(res.ys),
        poses,
        d,
      };
    }
  }
}

function* searchNXWing(cells, d) {
  // rows
  yield* scanNXwing(cells, d, positions.getRowPositions, positions.getColPositions, 'col');

  // cols
  yield* scanNXwing(cells, d, positions.getColPositions, positions.getRowPositions, 'row');
}

function* searchXWing(cells) {
  for (let d = 1; d <= 9; d++) {
    yield* searchNXWing(cells, d);
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

function* findNXGroup(cells, n) {
  for (let d = 1; d <= 9; d++) {
    // row->col
    const rcLinks = getRowToColLinks(cells, d);
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
    // col->row
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
    // row->block, 1-xrb-group is claiming
    const rbLinks = getRowToBlockLinks(cells, d);
    for (const group of findNGroupFromLinks(rbLinks, n, 0)) {
      const [rows, blocks] = group;
      const poses = [];
      for (const row of rows) {
        poses.push(...getPositionsForDigit(cells, d, positions.getRowPositions(row)));
      }
      const name = n === 1 ? 'claiming' : `${n}-XRB-Group`;
      yield { name, domain: 'row', effect: 'block', rows, blocks, poses: new Set(poses), d };
    }
    // block-row, 1-xbr-group is pointing
    for (const group of findNGroupFromLinks(rbLinks, n, 1)) {
      const [blocks, rows] = group;
      const poses = [];
      for (const block of blocks) {
        poses.push(...getPositionsForDigit(cells, d, positions.getBlockFlattenPositions(block)));
      }
      const name = n === 1 ? 'pointing' : `${n}-XBR-Group`;
      yield { name, domain: 'block', effect: 'row', rows, blocks, poses: new Set(poses), d };
    }

    // col->block, 1-xcb-group is claiming
    const cbLinks = getColToBlockLinks(cells, d);
    for (const group of findNGroupFromLinks(cbLinks, n, 0)) {
      const [cols, blocks] = group;
      const poses = [];
      for (const col of cols) {
        poses.push(...getPositionsForDigit(cells, d, positions.getColPositions(col)));
      }
      const name = n === 1 ? 'claiming' : `${n}-XCB-Group`;
      yield { name, domain: 'col', effect: 'block', cols, blocks, poses: new Set(poses), d };
    }

    // block-col, 1-xbc-group is pointing
    for (const group of findNGroupFromLinks(cbLinks, n, 1)) {
      const [blocks, cols] = group;
      const poses = [];
      for (const block of blocks) {
        poses.push(...getPositionsForDigit(cells, d, positions.getBlockFlattenPositions(block)));
      }
      const name = n === 1 ? 'pointing' : `${n}-XBC-Group`;
      yield { name, domain: 'block', effect: 'row', cols, blocks, poses: new Set(poses), d };
    }
  }
}
