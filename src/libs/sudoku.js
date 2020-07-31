import { findNGroupFromLinks } from './utils';

const cellToBlockMapping = [
  [0, 0, 0, 1, 1, 1, 2, 2, 2],
  [0, 0, 0, 1, 1, 1, 2, 2, 2],
  [0, 0, 0, 1, 1, 1, 2, 2, 2],
  [3, 3, 3, 4, 4, 4, 5, 5, 5],
  [3, 3, 3, 4, 4, 4, 5, 5, 5],
  [3, 3, 3, 4, 4, 4, 5, 5, 5],
  [6, 6, 6, 7, 7, 7, 8, 8, 8],
  [6, 6, 6, 7, 7, 7, 8, 8, 8],
  [6, 6, 6, 7, 7, 7, 8, 8, 8],
];

const blockToCellsMapping = [[], [], [], [], [], [], [], [], []];
for (let r = 0; r < 9; r++) {
  for (let c = 0; c < 9; c++) {
    blockToCellsMapping[cellToBlockMapping[r][c]].push([r, c]);
  }
}

export const getCellBlock = (row, col) => (row >= 0 && col >= 0 ? cellToBlockMapping[row][col] : -1);

export const getBlockCells = block => blockToCellsMapping[block];
export const getRowCells = row => [
  [row, 0],
  [row, 1],
  [row, 2],
  [row, 3],
  [row, 4],
  [row, 5],
  [row, 6],
  [row, 7],
  [row, 8],
];
export const getColCells = col => [
  [0, col],
  [1, col],
  [2, col],
  [3, col],
  [4, col],
  [5, col],
  [6, col],
  [7, col],
  [8, col],
];

export const getRelatedBlockCells = (row, col) =>
  blockToCellsMapping[getCellBlock(row, col)].filter(c => !(c[0] === row && c[1] === col));

export const getRelatedRowCells = (row, col) => getRowCells(row).filter(c => c[1] !== col);

export const getRelatedColCells = (row, col) => getColCells(col).filter(c => c[0] !== row);

//  related cells without self.
export const getRelatedCells = (row, col) => [
  ...getRelatedRowCells(row, col),
  ...getRelatedColCells(row, col),
  ...getRelatedBlockCells(row, col),
];

// calcuate available digits for cell at postion <pos>.
export const calcAvailableDigits = (values, pos) => {
  let res = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  if (pos) {
    const [row, col] = pos;
    const value = values[row][col];
    if (value.origin) {
      // origin can't be changed
      return new Set();
    }

    for (const [r, c] of getRelatedCells(row, col)) {
      const v = values[r][c].value;
      if (typeof v === 'number') {
        res.delete(v);
      }
    }
  }
  return res;
};

export const calcRemainingDigits = values => {
  const res = { 1: 9, 2: 9, 3: 9, 4: 9, 5: 9, 6: 9, 7: 9, 8: 9, 9: 9 };
  for (const row of values) {
    for (const cell of row) {
      const { value } = cell;
      if (typeof value === 'number') {
        res[value]--;
      }
    }
  }
  return res;
};

export const calcAvailableCells = (values, d) => {
  if (d <= 0) {
    return null;
  }

  const res = [
    [true, true, true, true, true, true, true, true, true],
    [true, true, true, true, true, true, true, true, true],
    [true, true, true, true, true, true, true, true, true],
    [true, true, true, true, true, true, true, true, true],
    [true, true, true, true, true, true, true, true, true],
    [true, true, true, true, true, true, true, true, true],
    [true, true, true, true, true, true, true, true, true],
    [true, true, true, true, true, true, true, true, true],
    [true, true, true, true, true, true, true, true, true],
  ];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const { value } = values[r][c];
      if (typeof value === 'number') {
        res[r][c] = false;
        if (value === d) {
          // clear
          for (const [row, col] of getRelatedCells(r, c)) {
            res[row][col] = false;
          }
        }
      }
    }
  }
  return res;
};

const cellPattern = /(\d)|(p\d)|(n[1-9]*N)/g;
const valuePattern = /^[1-9]$/;

export const simpleCheckPuzzle = puzzle => {
  if (!puzzle || puzzle.length < 81) {
    throw new Error(`bad sudoku puzzle format [${puzzle}]`);
  }
  // split cell
  const cells = puzzle.match(cellPattern);
  if (cells.length !== 81) {
    throw new Error(`bad sudoku puzzle format [${puzzle}]`);
  }
  return cells;
};

export const parsePuzzle = puzzle => {
  const cells = simpleCheckPuzzle(puzzle);

  // parse values
  const cellValues = cells.map(cell => {
    if (cell.startsWith('n') && cell.endsWith('N')) {
      // it's note
      const notes = cell
        .slice(1, -1)
        .split('')
        .map(s => parseInt(s));
      return { value: new Set(notes) };
    } else if (cell.startsWith('p')) {
      // it's placed value
      return { value: parseInt(cell[1]) };
    } else if (valuePattern.test(cell)) {
      // it's value
      return {
        value: parseInt(cell),
        // puzzle origin value
        origin: true,
      };
    } else if (cell === '0') {
      // it's empty
      return { value: new Set() };
    }
    throw new Error('impossible');
  });

  // organize the values
  const values = Array.from(new Array(9)).map(() => new Array(9));
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      values[i][j] = cellValues[9 * i + j];
    }
  }
  // TODO: check board integrity
  return values;
};

export const stringify = values => {
  const res = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = values[r][c];
      if (cell.origin) {
        // origin
        res.push(cell.value);
      } else if (typeof cell.value === 'number') {
        // placed
        res.push('p', cell.value);
      } else {
        // notes
        if (cell.value.size > 0) {
          res.push('n', ...cell.value, 'N');
        } else {
          res.push('0');
        }
      }
    }
  }
  return res.join('');
};

export const setValues = (curValues, row, col, value) => {
  let values = [...curValues];
  values[row] = [...curValues[row]];
  values[row][col] = {
    ...curValues[row][col],
    value,
  };
  if (typeof value === 'number') {
    values = copyValues(values);
    updateRelatedNotes(values, row, col);
  }
  return values;
};

export const updateValues = (isNoting, row, col, value) => {
  return curValues => {
    // TODO: add basic row, col, block check
    if (!isNoting) {
      // place
      const oldValue = curValues[row][col];
      if (oldValue.origin) {
        // can't place origin value
        return curValues;
      }

      if (oldValue.value === value) {
        // cancel current value
        value = new Set();
      }

      return setValues(curValues, row, col, value);
    } else {
      // note
      const oldValue = curValues[row][col];
      if (oldValue.origin) {
        // can't note origin value
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

      return setValues(curValues, row, col, notes);
    }
  };
};

const copyValues = curValues => {
  const values = [...curValues];
  for (let i = 0; i < 9; i++) {
    values[i] = [...values[i]];
  }
  return values;
};

// auto note based on related cells
export const autoNote = curValues => {
  const values = copyValues(curValues);

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = values[r][c];
      if (typeof cell.value === 'number') {
        continue;
      }
      values[r][c] = { ...cell, value: calcAvailableDigits(values, [r, c]) };
    }
  }
  return values;
};

// find unique note of notes to cells.
const checkUniqueValue = (values, notes, cells) => {
  let remNotes = new Set(notes);
  for (const [r, c] of cells) {
    const cell = values[r][c];
    if (typeof cell.value === 'number') {
      continue;
    }
    const otherNotes = cell.value;
    otherNotes.forEach(v => {
      remNotes.delete(v);
    });
  }
  if (remNotes.size === 1) {
    return [...remNotes][0];
  }
};

const updateRelatedNotes = (values, row, col) => {
  const { value } = values[row][col];
  for (const [r, c] of getRelatedCells(row, col)) {
    const cell = values[r][c];
    if (typeof cell.value === 'number') {
      continue;
    }
    values[r][c] = {
      ...cell,
      value: new Set([...cell.value].filter(n => n !== value)),
    };
  }
};

// auto place last value of cell and unique value of row, col or block.
// based on naked/hidden single
export const autoPlace = curValues => {
  let copied = false;
  let placed = true;
  let values = curValues;

  const tryCopyValues = () => {
    if (!copied) {
      values = copyValues(values);
      copied = true;
    }
  };

  console.group('[place]');
  while (placed) {
    placed = false;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = values[r][c];
        if (typeof cell.value === 'number') {
          continue;
        }
        // note cell
        const notes = cell.value;
        if (notes.size === 1) {
          placed = true;
          // 1. naked single
          tryCopyValues();
          const value = [...notes][0];
          values[r][c] = { ...cell, value };
          updateRelatedNotes(values, r, c);
          console.log(`naked single: ${value}@${r}${c}`);
        } else {
          let uv;
          // 1. hidden single/unique value of row, col or block;
          uv =
            checkUniqueValue(values, notes, getRelatedRowCells(r, c)) ||
            checkUniqueValue(values, notes, getRelatedColCells(r, c)) ||
            checkUniqueValue(values, notes, getRelatedBlockCells(r, c));
          if (uv) {
            placed = true;
            tryCopyValues();
            values[r][c] = { ...cell, value: uv };
            updateRelatedNotes(values, r, c);
            console.log(`hidden single: ${uv}@${r}${c}`);
          }
        }
      }
    }
  }

  console.groupEnd();
  return values;
};

// block eliminate row/col
export const pointing = curValues => {
  let copied = false;
  let values = curValues;

  const tryCopyValues = () => {
    if (!copied) {
      values = copyValues(values);
      copied = true;
    }
  };

  console.group('[pointing]');
  for (let b = 0; b < 9; b++) {
    // {pos:[row, col], to:null} / {to:[row|col],row|col,n} / false
    const results = {};
    for (const [r, c] of getBlockCells(b)) {
      const { value } = values[r][c];
      if (typeof value === 'number') {
        continue;
      }
      for (const n of value) {
        if (!results.hasOwnProperty(n)) {
          results[n] = { pos: [r, c], to: null };
          continue;
        }
        if (results[n] === false) {
          continue;
        }
        switch (results[n].to) {
          case 'row':
            if (results[n].row !== r) {
              results[n] = false;
            }
            break;
          case 'col':
            if (results[n].col !== c) {
              results[n] = false;
            }
            break;
          default:
            if (results[n].pos[0] === r) {
              results[n] = { to: 'row', row: r, n };
            } else if (results[n].pos[1] === c) {
              results[n] = { to: 'col', col: c, n };
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
        for (let c = 0; c < 9; c++) {
          const curValue = values[res.row][c];
          if (typeof curValue.value === 'number') {
            continue;
          }
          if (b === getCellBlock(res.row, c)) {
            continue;
          }

          if (!curValue.value.has(res.n)) {
            continue;
          }

          console.log(`block:${b + 1}=>row:${res.row + 1}, n:${res.n}, col:${c + 1}`);

          tryCopyValues();
          values[res.row][c] = {
            ...curValue,
            value: new Set([...curValue.value].filter(n => n !== res.n)),
          };
        }
      } else if (res.to === 'col') {
        // clear r.col for r.n
        for (let r = 0; r < 9; r++) {
          const curValue = values[r][res.col];
          if (typeof curValue.value === 'number') {
            continue;
          }
          if (b === getCellBlock(r, res.col)) {
            continue;
          }

          if (!curValue.value.has(res.n)) {
            continue;
          }

          console.log(`block:${b + 1}=>col:${res.col + 1}, n:${res.n}, row:${r + 1}`);

          tryCopyValues();
          values[r][res.col] = {
            ...curValue,
            value: new Set([...curValue.value].filter(n => n !== res.n)),
          };
        }
      }
    }
  }
  console.groupEnd();
  return values;
};

// row/col eliminate block
export const claiming = curValues => {
  let copied = false;
  let values = curValues;

  const tryCopyValues = () => {
    if (!copied) {
      values = copyValues(values);
      copied = true;
    }
  };

  console.group('[claiming]');
  // rows
  for (let r = 0; r < 9; r++) {
    // {block, n} / false
    const results = {};
    for (let c = 0; c < 9; c++) {
      const { value } = values[r][c];
      if (typeof value === 'number') {
        continue;
      }
      for (const n of value) {
        if (!results.hasOwnProperty(n)) {
          results[n] = { block: getCellBlock(r, c), n };
          continue;
        }
        if (results[n] === false) {
          continue;
        }
        if (results[n].block !== getCellBlock(r, c)) {
          results[n] = false;
        }
      }
    }
    // results
    for (const res of Object.values(results)) {
      if (res === false) {
        continue;
      }

      for (const [row, col] of getBlockCells(res.block)) {
        const curValue = values[row][col];
        if (typeof curValue.value === 'number') {
          continue;
        }

        if (r === row) {
          continue;
        }

        if (!curValue.value.has(res.n)) {
          continue;
        }
        console.log(`row:${r + 1}=>block:${res.block + 1}, n:${res.n}, row:${row + 1}, col:${col + 1}`);

        tryCopyValues();
        values[row][col] = {
          ...curValue,
          value: new Set([...curValue.value].filter(n => n !== res.n)),
        };
      }
    }
  }
  // cols
  for (let c = 0; c < 9; c++) {
    // {block, n} / false
    const results = {};
    for (let r = 0; r < 9; r++) {
      const { value } = values[r][c];
      if (typeof value === 'number') {
        continue;
      }
      for (const n of value) {
        if (!results.hasOwnProperty(n)) {
          results[n] = { block: getCellBlock(r, c), n };
          continue;
        }
        if (results[n] === false) {
          continue;
        }
        if (results[n].block !== getCellBlock(r, c)) {
          results[n] = false;
        }
      }
    }
    // results
    for (const res of Object.values(results)) {
      if (res === false) {
        continue;
      }

      for (const [row, col] of getBlockCells(res.block)) {
        const curValue = values[row][col];
        if (typeof curValue.value === 'number') {
          continue;
        }

        if (c === col) {
          continue;
        }

        if (!curValue.value.has(res.n)) {
          continue;
        }

        console.log(`col:${c + 1}=>block:${res.block + 1}, n:${res.n}, row:${row + 1}, col:${col + 1}`);

        tryCopyValues();
        values[row][col] = {
          ...curValue,
          value: new Set([...curValue.value].filter(n => n !== res.n)),
        };
      }
    }
  }
  console.groupEnd();
  return values;
};

export const encodePos = pos => `${pos[0]}${pos[1]}`;
export const decodePos = pos => [parseInt(pos[0]), parseInt(pos[1])];

const getCellsLinks = (values, cells) => {
  const links = [];
  for (const [r, c] of cells) {
    const value = values[r][c];
    if (typeof value.value === 'number') {
      continue;
    }
    const pos = encodePos([r, c]);
    for (const note of value.value) {
      links.push([pos, note]);
    }
  }
  return links;
};

function* findNGroup(values, n, cls) {
  // rows
  for (let r = 0; r < 9; r++) {
    const links = getCellsLinks(values, getRowCells(r));
    for (const group of findNGroupFromLinks(links, n, cls)) {
      const poses = group[cls];
      const notes = group[(cls + 1) % 2];
      yield { cls, n, domain: 'row', row: r, poses, notes };
    }
  }
  // cols
  for (let c = 0; c < 9; c++) {
    const links = getCellsLinks(values, getColCells(c));
    for (const group of findNGroupFromLinks(links, n, cls)) {
      const poses = group[cls];
      const notes = group[(cls + 1) % 2];
      yield { cls, n, domain: 'col', col: c, poses, notes };
    }
  }
  // blocks
  for (let b = 0; b < 9; b++) {
    const links = getCellsLinks(values, getBlockCells(b));
    for (const group of findNGroupFromLinks(links, n, cls)) {
      const poses = group[cls];
      const notes = group[(cls + 1) % 2];
      yield { cls, n, domain: 'block', block: b, poses, notes };
    }
  }
}

export const findGroup = values => {
  for (let n = 1; n <= 8; n++) {
    // 0:naked group, 1: hidden group
    for (const cls of [0, 1]) {
      for (const group of findNGroup(values, n, cls)) {
        // only return the first group
        group.type = 'group';
        group.name = ['naked', 'hidden'][cls] + `-${n}-group`;
        return group;
      }
    }
  }
};

export const eliminateGroup = group => curValues => {
  const values = copyValues(curValues);
  if (group.n === 1) {
    // place value
    const [row, col] = [...group.poses][0];
    const value = values[row][col];
    const d = [...group.notes][0];
    values[row][col] = { ...value, value: d };
    updateRelatedNotes(values, row, col);
  } else if (group.cls === 0) {
    // naked
    // to eliminate other cells
    let otherCells = [];
    if (group.domain === 'row') {
      otherCells = getRowCells(group.row);
    } else if (group.domain === 'col') {
      otherCells = getColCells(group.col);
    } else if (group.domain === 'block') {
      otherCells = getBlockCells(group.block);
    }
    otherCells = otherCells.filter(([row, col]) => {
      const value = values[row][col];
      return !(typeof value.value === 'number' || group.poses.has(encodePos([row, col])));
    });
    otherCells.forEach(([row, col]) => {
      const value = values[row][col];
      values[row][col] = {
        ...value,
        value: new Set([...value.value].filter(n => !group.notes.has(n))),
      };
    });
  } else if (group.cls === 1) {
    // hidden
    // to eliminate other notes
    const cells = [...group.poses].map(pos => decodePos(pos));
    cells.forEach(([row, col]) => {
      const value = values[row][col];
      values[row][col] = {
        ...value,
        value: new Set([...value.value].filter(n => group.notes.has(n))),
      };
    });
  }

  return values;
};

function* scanNXwing(values, d, getCells, getOtherCells, yi) {
  const dist = {};
  for (let x = 0; x < 9; x++) {
    const ys = [];
    getCells(x).forEach(pos => {
      const y = pos[yi];
      const { value } = values[pos[0]][pos[1]];
      if (typeof value === 'number') {
        return;
      }
      if (value.has(d)) {
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
        if (yi === 1) {
          poses.add(encodePos([x, y]));
        } else {
          poses.add(encodePos([y, x]));
        }
      }
    }

    let cleared = true;
    // check if x-wing is cleared
    const otherCells = [];
    for (const y of res.ys) {
      otherCells.push(...getOtherCells(y));
    }
    for (const [x, y] of otherCells.filter(([x, y]) => {
      const { value } = values[x][y];
      return !(typeof value === 'number' || poses.has(encodePos([x, y])));
    })) {
      const { value } = values[x][y];
      if (value.has(d)) {
        // need clear
        cleared = false;
        break;
      }
    }

    if (!cleared) {
      yield {
        name: `${s}-X-Wing`,
        domain: ['col', 'row'][yi],
        [['cols', 'rows'][yi]]: new Set(res.xs),
        [['rows', 'cols'][yi]]: new Set(res.ys),
        poses,
        d,
      };
    }
  }
}

function* searchNXWing(values, d) {
  // rows
  yield* scanNXwing(values, d, getRowCells, getColCells, 1);

  // cols
  yield* scanNXwing(values, d, getColCells, getRowCells, 0);
}

function* searchXWing(values) {
  for (let d = 1; d <= 9; d++) {
    yield* searchNXWing(values, d);
  }
}

export const findXWing = values => {
  for (const res of searchXWing(values)) {
    res.type = 'X-Wing';
    return res;
  }
};

export const eliminateXWing = tip => curValues => {
  const values = copyValues(curValues);
  const otherCells = [];
  if (tip.domain === 'row') {
    for (const col of tip.cols) {
      otherCells.push(...getColCells(col));
    }
  } else if (tip.domain === 'col') {
    for (const row of tip.rows) {
      otherCells.push(...getRowCells(row));
    }
  }
  otherCells
    .filter(([row, col]) => {
      const value = values[row][col];
      return !(typeof value.value === 'number' || tip.poses.has(encodePos([row, col])));
    })
    .forEach(([row, col]) => {
      const value = values[row][col];
      values[row][col] = {
        ...value,
        value: new Set([...value.value].filter(n => n !== tip.d)),
      };
    });

  return values;
};

const getAToBLinks = (getCells, getEnd) => (values, d) => {
  const links = [];
  for (let a = 0; a < 9; a++) {
    for (const [r, c] of getCells(a)) {
      const { value } = values[r][c];
      if (typeof value === 'number') {
        continue;
      }
      if (value.has(d)) {
        links.push([a, getEnd(r, c)]);
      }
    }
  }
  return links;
};

const getRowToColLinks = getAToBLinks(getRowCells, (r, c) => c);
const getRowToBlockLinks = getAToBLinks(getRowCells, (r, c) => getCellBlock(r, c));
const getColToBlockLinks = getAToBLinks(getColCells, (r, c) => getCellBlock(r, c));

const getEncodedPosesForDigit = (values, d, cells) => {
  const poses = [];
  for (const [r, c] of cells) {
    const { value } = values[r][c];
    if (typeof value !== 'number' && value.has(d)) {
      poses.push(encodePos([r, c]));
    }
  }
  return poses;
};

function* findNXGroup(values, n) {
  for (let d = 1; d <= 9; d++) {
    // row->col
    const rcLinks = getRowToColLinks(values, d);
    for (const group of findNGroupFromLinks(rcLinks, n, 0)) {
      const [rows, cols] = group;
      const poses = [];
      rows.forEach(r => poses.push(...getEncodedPosesForDigit(values, d, getRowCells(r))));
      yield { name: `${n}-XRC-Group`, domain: 'row', effect: 'col', rows, cols, poses: new Set(poses), d };
    }
    // col->row
    for (const group of findNGroupFromLinks(rcLinks, n, 1)) {
      const [cols, rows] = group;
      const poses = [];
      cols.forEach(c => poses.push(...getEncodedPosesForDigit(values, d, getColCells(c))));
      yield { name: `${n}-XCR-Group`, domain: 'col', effect: 'row', rows, cols, poses: new Set(poses), d };
    }
    // row->block, 1-xrb-group is claiming
    const rbLinks = getRowToBlockLinks(values, d);
    for (const group of findNGroupFromLinks(rbLinks, n, 0)) {
      const [rows, blocks] = group;
      const poses = [];
      rows.forEach(c => poses.push(...getEncodedPosesForDigit(values, d, getRowCells(c))));
      const name = n === 1 ? 'claiming' : `${n}-XRB-Group`;
      yield { name, domain: 'row', effect: 'block', rows, blocks, poses: new Set(poses), d };
    }
    // block-row, 1-xbr-group is pointing
    for (const group of findNGroupFromLinks(rbLinks, n, 1)) {
      const [blocks, rows] = group;
      const poses = [];
      blocks.forEach(b => poses.push(...getEncodedPosesForDigit(values, d, getBlockCells(b))));
      const name = n === 1 ? 'pointing' : `${n}-XBR-Group`;
      yield { name, domain: 'block', effect: 'row', rows, blocks, poses: new Set(poses), d };
    }

    // col->block, 1-xcb-group is claiming
    const cbLinks = getColToBlockLinks(values, d);
    for (const group of findNGroupFromLinks(cbLinks, n, 0)) {
      const [cols, blocks] = group;
      const poses = [];
      cols.forEach(c => poses.push(...getEncodedPosesForDigit(values, d, getColCells(c))));
      const name = n === 1 ? 'claiming' : `${n}-XCB-Group`;
      yield { name, domain: 'col', effect: 'block', cols, blocks, poses: new Set(poses), d };
    }

    // block-col, 1-xbc-group is pointing
    for (const group of findNGroupFromLinks(cbLinks, n, 1)) {
      const [blocks, cols] = group;
      const poses = [];
      blocks.forEach(b => poses.push(...getEncodedPosesForDigit(values, d, getBlockCells(b))));
      const name = n === 1 ? 'pointing' : `${n}-XBC-Group`;
      yield { name, domain: 'block', effect: 'row', cols, blocks, poses: new Set(poses), d };
    }
  }
}

export const findXGroup = values => {
  for (let n = 1; n <= 8; n++) {
    for (const group of findNXGroup(values, n)) {
      group.type = 'X-Group';
      return group;
    }
  }
};

const eliminateXGroup = tip => curValues => {
  const values = copyValues(curValues);
  const otherCells = [];
  if (tip.effect === 'row') {
    for (const row of tip.rows) {
      otherCells.push(...getRowCells(row));
    }
  } else if (tip.effect === 'col') {
    for (const col of tip.cols) {
      otherCells.push(...getColCells(col));
    }
  } else if (tip.effect === 'block') {
    for (const block of tip.blocks) {
      otherCells.push(...getBlockCells(block));
    }
  }

  otherCells
    .filter(([row, col]) => {
      const value = values[row][col];
      return !(typeof value.value === 'number' || tip.poses.has(encodePos([row, col])));
    })
    .forEach(([row, col]) => {
      const value = values[row][col];
      values[row][col] = {
        ...value,
        value: new Set([...value.value].filter(n => n !== tip.d)),
      };
    });

  return values;
};

export const findTip = values => {
  // return findGroup(values) || findXWing(values) || findXGroup(values);
  return findGroup(values) || findXGroup(values);
};

export const handleTip = tip => curValues => {
  if (tip.type === 'group') {
    return eliminateGroup(tip)(curValues);
  } else if (tip.type === 'X-Wing') {
    return eliminateXWing(tip)(curValues);
  } else if (tip.type === 'X-Group') {
    return eliminateXGroup(tip)(curValues);
  }
};
