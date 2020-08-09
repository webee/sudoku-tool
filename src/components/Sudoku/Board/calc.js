import * as positions from '../../../libs/position';

// percentage for a cell
export const perCell = (1 - 1.5 / 100) / 9;

export const getCoord = ({ row, col }, d) => {
  const [localRow, localCol] = positions.getDigitLocalPos(d);

  // block margin: 0.25%
  // cell margin:1%, padding: 2.5% of block
  const x = (col + (localCol + 0.5) / 3 + 0.35 / 100) * perCell + ((Math.floor(col / 3) + 1) * 0.5 - 0.25) / 100;
  const y = (row + (localRow + 0.5) / 3 + 0.35 / 100) * perCell + ((Math.floor(row / 3) + 1) * 0.5 - 0.25) / 100;

  return [x, y];
};

export const calcDistance = ([sx, sy], [ex, ey]) => {
  const [dx, dy] = [ex - sx, ey - sy];

  return Math.sqrt(dx * dx + dy * dy);
};

export const calcDeg = ([sx, sy], [ex, ey], d) => {
  const [dx, dy] = [ex - sx, ey - sy];
  return ((Math.acos(dx / d) * (dy < 0 ? -1 : 1)) / Math.PI) * 180;
};
