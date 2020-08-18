import { rowColToBlock, getRowPositions, getColPositions, getBlockFlattenPositions } from './position';
import { Notes } from './notes';
import { findNGroupFromLinks } from './utils';
import * as positions from './position';

export const getPosDomains = poses => {
  const res = {};
  for (const domain of ['row', 'col', 'block']) {
    const ds = new Set();
    poses.forEach(p => ds.add(p[domain]));
    if (ds.size === 1) {
      res[domain] = [...ds][0];
    }
  }
  return res;
};

export function getPosDigitLinks(cells, poses) {
  const links = [];
  for (const pos of poses) {
    const { value } = positions.getCell(cells, pos);
    if (!Notes.is(value)) {
      continue;
    }

    for (const note of Notes.entries(value)) {
      links.push([pos, note]);
    }
  }
  return links;
}

export function* findNGroup(cells, n, cls) {
  for (const [domain, getPositions] of [
    ['row', getRowPositions],
    ['col', getColPositions],
    ['block', getBlockFlattenPositions],
  ]) {
    for (const idx of positions.indices) {
      const links = getPosDigitLinks(cells, getPositions(idx));
      for (const group of findNGroupFromLinks(links, n, cls, { checkClear: n > 1 })) {
        const poses = group[cls];
        const notes = group[(cls + 1) % 2];
        yield {
          type: 'group',
          cls,
          n,
          domains: cls === 0 ? getPosDomains(poses) : { [domain]: idx },
          poses,
          notes,
          name: ['naked', 'hidden'][cls] + `-${n}-group`,
        };
      }
    }
  }
}

export function eliminateGroup(group, getCell, setCellValue) {
  if (group.n === 1) {
    // place value
    const pos = [...group.poses][0];
    const d = [...group.notes][0];

    setCellValue(pos, d);
  } else if (group.cls === 0) {
    // naked
    // to eliminate other cells
    const { row, col, block } = group.domains;
    const otherPoses = [
      ...(getRowPositions(row) || []),
      ...(getColPositions(col) || []),
      ...(getBlockFlattenPositions(block) || []),
    ];
    for (const pos of otherPoses) {
      const { value } = getCell(pos);
      if (!Notes.is(value) || group.poses.has(pos)) {
        continue;
      }

      setCellValue(pos, Notes.delete(value, ...group.notes));
    }
  } else if (group.cls === 1) {
    // hidden
    // to eliminate other notes
    for (const pos of group.poses) {
      const { value } = getCell(pos);
      setCellValue(pos, Notes.new(...Notes.entries(value).filter(n => group.notes.has(n))));
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

export function* findNXGroup(cells, n, types = { rc: true, cr: true, rb: true, br: true, cb: true, bc: true }) {
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

export function eliminateXGroup(group, getCell, setCellValue) {
  const otherPositions = [];
  if (group.effect === 'row') {
    for (const row of group.rows) {
      otherPositions.push(...getRowPositions(row));
    }
  } else if (group.effect === 'col') {
    for (const col of group.cols) {
      otherPositions.push(...getColPositions(col));
    }
  } else if (group.effect === 'block') {
    for (const block of group.blocks) {
      otherPositions.push(...getBlockFlattenPositions(block));
    }
  }

  for (const pos of otherPositions) {
    const { value } = getCell(pos);
    if (!Notes.is(value) || group.poses.has(pos)) {
      continue;
    }

    setCellValue(pos, Notes.delete(value, group.d));
  }
}
