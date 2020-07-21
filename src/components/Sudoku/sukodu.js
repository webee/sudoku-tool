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

export const getRelatedCells = (row, col) => [
  [row, 0],
  [row, 1],
  [row, 2],
  [row, 3],
  [row, 4],
  [row, 5],
  [row, 6],
  [row, 7],
  [row, 8],
  [0, col],
  [1, col],
  [2, col],
  [3, col],
  [4, col],
  [5, col],
  [6, col],
  [7, col],
  [8, col],
  ...getBlockCells(getCellBlock(row, col)),
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
      if (r === row && c === col) {
        // self
        continue;
      }
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
    return false;
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
        if (value === d) {
          // clear
          for (const [row, col] of getRelatedCells(r, c)) {
            res[row][col] = false;
          }
        } else {
          res[r][c] = false;
        }
      }
    }
  }
  return res;
};

const cellPattern = /(\d)|(p\d)|(n[1-9]*N)/g;
const valuePattern = /^[1-9]$/;

export const parsePuzzle = puzzle => {
  // split cell
  const cells = puzzle.match(cellPattern);
  if (cells.length !== 81) {
    throw new Error('bad sudoku puzzle format');
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
    throw new Error('impossible');
  });

  // organize the values
  const values = Array.from(new Array(9)).map(() => new Array(9));
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      values[i][j] = cellValues[9 * i + j];
    }
  }
  return values;
};

export const updateValues = (curValues, row, col, value) => {
  const oldValue = { ...curValues[row][col] };
  const newValues = [...curValues];
  newValues[row] = [...curValues[row]];
  newValues[row][col] = {
    ...oldValue,
    value,
  };
  return newValues;
};
