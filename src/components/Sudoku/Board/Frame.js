import React from 'react';
import styled from 'styled-components';
import * as positions from '../../../libs/position';
import * as calc from './calc';

const dd = 0.8;

const Frame = styled.div.attrs(({ sx, sy, ex, ey }) => ({
  style: {
    top: `${sy * 100 - dd}%`,
    left: `${sx * 100 - dd}%`,
    right: `${(1 - ex) * 100 - dd}%`,
    bottom: `${(1 - ey) * 100 - dd}%`,
  },
}))`
  user-select: none;
  pointer-events: none;
  position: absolute;
  border: 1px solid red;
`;

export default ({ domain, row, col, block }) => {
  let startRow;
  let startCol;
  let endRow;
  let endCol;

  if (domain === 'row') {
    startRow = endRow = row;

    startCol = positions.blockCols(block)[0];
    endCol = startCol + 2;
  } else if (domain === 'col') {
    startCol = endCol = col;

    startRow = positions.blockRows(block)[0];
    endRow = startRow + 2;
  }

  const [sx, sy] = calc.getCoord({ row: startRow, col: startCol }, 1);
  const [ex, ey] = calc.getCoord({ row: endRow, col: endCol }, 9);
  return <Frame sx={sx} sy={sy} ex={ex} ey={ey} />;
};
