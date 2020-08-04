const _baseArray = [0, 1, 2, 3, 4, 5, 6, 7, 8];
export const blockShape = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
];

export const blocks = _baseArray;
export const rows = _baseArray;
export const cols = _baseArray;

export const rowColToBlock = (row, col) => Math.floor(row / 3) * 3 + Math.floor(col / 3);
export const blockRowColIndex = (row, col) => (row % 3) * 3 + (col % 3);
export const blockRows = block => {
  const start = Math.floor(block / 3) * 3;
  return [start, start + 1, start + 2];
};

const _rowPositions = _baseArray.map(row =>
  _baseArray.map(col => ({
    row,
    col,
    block: rowColToBlock(row, col),
    key: `r${row}c${col}`,
    toString() {
      return this.key;
    },
  }))
);

// row positions without col
const _rowRelatedPositions = _baseArray.map(r => _baseArray.map(c => _rowPositions[r].filter(pos => pos.col !== c)));
const _colPositions = _baseArray.map(c => _baseArray.map(r => _rowPositions[r][c]));
// col positions without row
const _colRelatedPositions = _baseArray.map(c => _baseArray.map(r => _colPositions[c].filter(pos => pos.row !== r)));

// block positions 3x3
const _blockPositions = _baseArray.map(b => blockRows(b).map(row => _rowPositions[row].filter(pos => pos.block === b)));

const _blocFlattenkPositions = _baseArray.map(b => {
  const blockPoses = _blockPositions[b];
  return [...blockPoses[0], ...blockPoses[1], ...blockPoses[2]];
});
// block positions without it's row/col index
const _blockRelatedPositions = _baseArray.map(b =>
  _baseArray.map(i => _blocFlattenkPositions[b].filter((_, idx) => idx !== i))
);

// positions without row/col
const _relatedPositions = _baseArray.map(r =>
  _baseArray.map(c => {
    const b = rowColToBlock(r, c);
    const res = [];
    _rowPositions.forEach(rows =>
      rows.forEach(pos => {
        const { row, col, block } = pos;
        if (r === row && c === col && b === block) {
          return;
        }
        if (r === row || c === col || b === block) {
          res.push(pos);
        }
      })
    );
    return res;
  })
);

export const getPosition = (row, col) => _rowPositions[row][col];

export const getPosBlock = (row, col) => _rowPositions[row][col].block;

export const getBlockPositions = block => _blockPositions[block];
export const getBlockFlattenPositions = block => _blocFlattenkPositions[block];
export const getRowPositions = row => _rowPositions[row];
export const getColPositions = col => _colPositions[col];

export const getRelatedBlockPositions = ({ row, col, block }) =>
  _blockRelatedPositions[block === undefined ? rowColToBlock(row, col) : block][blockRowColIndex(row, col)];
export const getRelatedRowPositions = ({ row, col }) => _rowRelatedPositions[row][col];
export const getRelatedColPositions = ({ row, col }) => _colRelatedPositions[col][row];
export const getRelatedPositions = ({ row, col }) => _relatedPositions[row][col];

// all positions from left to right, top to bottom.
// used to iterate all positions
const _flattenPositions = [];
const _keyPositionMapping = {};
_rowPositions.forEach(rows => {
  _flattenPositions.push(...rows);
  for (const pos of rows) {
    _keyPositionMapping[pos.key] = pos;
  }
});

export const flattenPositions = _flattenPositions;
export const getPositionByKey = key => _keyPositionMapping[key];

export const mapPositionsTo = f => _baseArray.map(row => _baseArray.map(col => f(row, col)));
