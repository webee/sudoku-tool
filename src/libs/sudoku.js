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

export const getCellBlock = (row, col) =>
  row >= 0 && col >= 0 ? cellToBlockMapping[row][col] : -1;

export const getBlockCells = block => blockToCellsMapping[block];

export const getRelatedBlockCells = (row, col) =>
  blockToCellsMapping[getCellBlock(row, col)].filter(
    c => c[0] !== row || c[1] !== col
  );

export const getRelatedRowCells = (row, col) =>
  [
    [row, 0],
    [row, 1],
    [row, 2],
    [row, 3],
    [row, 4],
    [row, 5],
    [row, 6],
    [row, 7],
    [row, 8],
  ].filter(c => c[1] !== col);

export const getRelatedColCells = (row, col) =>
  [
    [0, col],
    [1, col],
    [2, col],
    [3, col],
    [4, col],
    [5, col],
    [6, col],
    [7, col],
    [8, col],
  ].filter(c => c[0] !== row);

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

export const parsePuzzle = puzzle => {
  if (puzzle.length < 81) {
    throw new Error(`bad sudoku puzzle format [${puzzle}]`);
  }
  // split cell
  const cells = puzzle.match(cellPattern);
  if (cells.length !== 81) {
    throw new Error(`bad sudoku puzzle format [${puzzle}]`);
  }

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
    throw new Error(`bad sudoku puzzle format [${puzzle}]`);
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
          // 1. check last value
          tryCopyValues();
          values[r][c] = { ...cell, value: [...notes][0] };
          updateRelatedNotes(values, r, c);
        } else {
          let uv;
          // 1. check unique value of row, col or block;
          uv =
            checkUniqueValue(values, notes, getRelatedRowCells(r, c)) ||
            checkUniqueValue(values, notes, getRelatedColCells(r, c)) ||
            checkUniqueValue(values, notes, getRelatedBlockCells(r, c));
          if (uv) {
            placed = true;
            tryCopyValues();
            values[r][c] = { ...cell, value: uv };
            updateRelatedNotes(values, r, c);
          }
        }
      }
    }
  }

  return values;
};

export const pointing = curValues => {
  let copied = false;
  let values = curValues;

  const tryCopyValues = () => {
    if (!copied) {
      values = copyValues(values);
      copied = true;
    }
  };

  for (let b = 0; b < 9; b++) {
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

          console.log(
            `[pointing] block: ${b}, row:${res.row}, n:${res.n}, col:${c}`
          );

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

          console.log(
            `[pointing] block: ${b}, col:${res.col}, n:${res.n}, row:${r}`
          );

          tryCopyValues();
          values[r][res.col] = {
            ...curValue,
            value: new Set([...curValue.value].filter(n => n !== res.n)),
          };
        }
      }
    }
  }
  return values;
};

export const claiming = curValues => {
  let copied = false;
  let values = curValues;

  const tryCopyValues = () => {
    if (!copied) {
      values = copyValues(values);
      copied = true;
    }
  };

  // rows
  for (let r = 0; r < 9; r++) {
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
        console.log(
          `[claiming] row: ${r}, block:${res.block}, n:${res.n}, row: ${row}, col:${col}`
        );

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

        console.log(
          `[claiming] row: ${c}, block:${res.block}, n:${res.n}, row: ${row}, col:${col}`
        );

        tryCopyValues();
        values[row][col] = {
          ...curValue,
          value: new Set([...curValue.value].filter(n => n !== res.n)),
        };
      }
    }
  }
  return values;
};
