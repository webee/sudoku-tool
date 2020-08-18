import * as positions from './position';
import { Notes, digits } from './notes';
import { findNGroup } from './logic';
// import { findNXGroup } from './logic';
import { console } from './utils';

const initValue = Notes.new(...digits);

export const solve = cells => {
  const xCells = positions.newCells(() => ({ value: initValue }));
  for (const pos of positions.flattenPositions) {
    const cell = positions.getCell(cells, pos);
    if (Notes.is(cell.value)) {
      continue;
    }

    // copy origin
    xCells[pos.row][pos.col].origin = cell.origin;

    if (!setCellValue(xCells, pos, cell.value)) {
      // unsolvable
      return [];
    }
  }

  const st = new Date();
  const stat = { search: 0, setCellValue: 0, basicEliminate: 0, eliminate: 0 };
  const results = [];
  for (const res of search(xCells, stat)) {
    const et = new Date();
    console.log(`#${results.length}>puzzle solving time: ${et - st}ms, ${JSON.stringify(stat)}`);
    results.push(res);
    if (results.length > 1) {
      // multi results
      break;
    }
  }
  const et = new Date();
  console.log(`puzzle solving final time: ${et - st}ms, ${JSON.stringify(stat)}`);
  return results;
};

function* search(cells, stat) {
  stat && stat.search++;
  if (isSolved(cells)) {
    yield cells;
    return;
  }

  const [pos, candidates] = chooseNextCell(cells);

  for (const d of candidates) {
    const nextCells = positions.copyCells(cells);

    if (!(setCellValue(nextCells, pos, d, stat) && eliminate(nextCells, stat))) {
      continue;
    }

    yield* search(nextCells, stat);
  }
}

const isSolved = cells => {
  for (const pos of positions.flattenPositions) {
    const { value } = positions.getCell(cells, pos);
    if (Notes.is(value)) {
      return false;
    }
  }
  return true;
};

const chooseNextCell = cells => {
  // strategies:
  // #1. choose the unplaced cell with the fewest candidates.
  // #2. choose the next unplaced cell.
  // *#3. random

  // #1.
  let xpos;
  let xvals;
  let minLen = 10;
  for (const pos of positions.flattenPositions) {
    const { value } = positions.getCell(cells, pos);
    if (!Notes.is(value)) {
      continue;
    }
    const vals = Notes.entries(value);
    // #3.
    // xpos = pos;
    // xvals = vals;
    // if (Math.random() > 0.5) {
    //   break;
    // }
    // #1.
    if (vals.length < minLen) {
      xpos = pos;
      xvals = vals;
      minLen = vals.length;
    }

    // #2.
    // return [pos, vals];
  }

  // #1.#3.
  return [xpos, xvals];
};

const setCellValue = (cells, pos, d, stat) => {
  stat && stat.setCellValue++;
  const { value } = positions.getCell(cells, pos);
  if (!Notes.has(value, d)) {
    // can't set d at pos as candidates don't contain d.
    return false;
  }

  // assign  d
  cells[pos.row][pos.col].value = d;

  return basicEliminate(cells, positions.getRelatedPositions(pos), d, stat);
};

const basicEliminate = (cells, poses, d, stat) => {
  stat && stat.basicEliminate++;
  // basic: eliminate d from related positions.
  for (const rpos of poses) {
    const { value } = positions.getCell(cells, rpos);
    if (!Notes.has(value, d)) {
      continue;
    }

    // eliminate
    const newValue = Notes.delete(value, d);
    if (Notes.isEmpty(newValue)) {
      // empty cell
      return false;
    }
    cells[rpos.row][rpos.col].value = newValue;
  }
  return true;
};

// logic eliminate
const eliminate = (cells, stat) => {
  stat && stat.eliminate++;
  let changed;
  do {
    changed = false;

    // 1. naked/hidden single
    // 0:naked, 1:hidden
    for (const cls of [0, 1]) {
      for (const group of findNGroup(cells, 1, cls)) {
        const pos = [...group.poses][0];
        const d = [...group.notes][0];
        if (!setCellValue(cells, pos, d, stat)) {
          return false;
        }
        changed = true;
      }
    }

    // 2. pointing/claiming
    // for (const group of findNXGroup(cells, 1, { br: true, bc: true, rb: true, cb: true })) {
    //   const effectedPoses = [];
    //   if (group.effect === 'row') {
    //     for (const row of group.rows) {
    //       effectedPoses.push(...positions.getRowPositions(row));
    //     }
    //   } else if (group.effect === 'col') {
    //     for (const col of group.cols) {
    //       effectedPoses.push(...positions.getColPositions(col));
    //     }
    //   } else if (group.effect === 'block') {
    //     for (const block of group.blocks) {
    //       effectedPoses.push(...positions.getBlockFlattenPositions(block));
    //     }
    //   }
    //   if (
    //     !basicEliminate(
    //       cells,
    //       effectedPoses.filter(p => !group.poses.has(p)),
    //       group.d,
    //       stat
    //     )
    //   ) {
    //     return false;
    //   }
    //   changed = true;
    // }
  } while (changed);
  return true;
};
