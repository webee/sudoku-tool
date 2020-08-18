import * as positions from './position';
import { Notes, digits } from './notes';
import { findNGroup } from './logic';
import { console } from './utils';

const initValue = Notes.new(...digits);

export const solve = cells => {
  const xCells = positions.newCells(initValue);
  for (const pos of positions.flattenPositions) {
    const { value } = positions.getCell(cells, pos);
    if (Notes.is(value)) {
      continue;
    }
    try {
      setCellValue(xCells, pos, value);
    } catch (err) {
      console.error(err);
      // unsolvable
      // return [];
      return;
    }
  }

  return search(xCells);
};

const search = cells => {
  if (isSolved(cells)) {
    // return [cells];
    return cells;
  }

  const [pos, candidates] = chooseNextCell(cells);
  if (candidates.length === 0) {
    // empty cell
    // unsolvable
    // return [];
    return;
  }

  // const results = [];
  for (const d of candidates) {
    // console.log(`befere: ${d}@${pos}`);
    const nextCells = positions.copyCells(cells);
    if (!assign(nextCells, pos, d)) {
      continue;
    }
    // console.log(`after: ${d}@${pos}`);
    // results.push(...search(nextCells, pos, d));
    const res = search(nextCells, pos, d);
    if (res) {
      return res;
    }
  }
  // return results;
};

const isSolved = cells => {
  for (const pos of positions.flattenPositions) {
    const value = positions.getCell(cells, pos);
    if (Notes.is(value)) {
      return false;
    }
  }
  return true;
};

const chooseNextCell = cells => {
  // strategies:
  // 1. choose the unplaced cell with the fewest candidates.
  // *2. choose the next unplaced cell.
  for (const pos of positions.flattenPositions) {
    const value = positions.getCell(cells, pos);
    if (!Notes.is(value)) {
      continue;
    }
    const vals = Notes.entries(value);
    return [pos, vals];
  }
};

// set d at pos and do further eliminations and assigns
const assign = (cells, pos, d) => {
  try {
    setCellValue(cells, pos, d);
    eliminate(cells);
    return true;
  } catch (err) {
    return false;
  }
};

const setCellValue = (cells, pos, d) => {
  const value = positions.getCell(cells, pos);
  if (!Notes.has(value, d)) {
    throw new Error(`bad sudoku: can't set ${d}@${pos}`);
  }

  // assign  d
  cells[pos.row][pos.col] = d;

  // basic: eliminate d from related positions.
  for (const rpos of positions.getRelatedPositions(pos)) {
    const value = positions.getCell(cells, rpos);
    if (!Notes.has(value, d)) {
      continue;
    }

    // eliminate
    const newValue = Notes.delete(value, d);
    if (Notes.isEmpty(newValue)) {
      throw new Error(`bad sudoku: eliminate last candidate ${d}@${rpos}`);
    }
    cells[rpos.row][rpos.col] = newValue;
  }
};

const eliminate = cells => {
  let assigned;
  do {
    assigned = false;
    // 0:naked, 1:hidden
    for (const cls of [0, 1]) {
      for (const group of findNGroup(cells, 1, cls)) {
        const pos = [...group.poses][0];
        const d = [...group.notes][0];
        setCellValue(cells, pos, d);
        assigned = true;
        break;
      }
    }
  } while (assigned);
};
