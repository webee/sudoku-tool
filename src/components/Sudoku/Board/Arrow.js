import React from 'react';
import styles from './Arrow.module.scss';
import styled from 'styled-components';
import * as positions from '../../../libs/position';

// shortend arrow length, to avoid tail-head contact.
const dd = 0.02;
// percentage for a cell
const pc = (1 - 1.5 / 100) / 9;

const Arrow = styled.div`
  user-select: none;
  pointer-events: none;
  position: absolute;
  border-top: 2px ${({ type }) => type} red;
  width: ${({ distance }) => distance * 100}%;
  height: ${({ distance }) => distance * 100}%;
  transform-origin: top left;
  transform: translate(${({ x, distance }) => (x / distance) * 100}%, ${({ y, distance }) => (y / distance) * 100}%)
    rotate(${({ deg }) => deg}deg) translate(${({ distance }) => (dd / 2 / distance) * 100}%);
`;

const getCoord = (pos, d) => {
  const { row, col } = pos;
  const [localRow, localCol] = positions.getDigitLocalPos(d);

  // block margin: 0.25%
  // cell margin:1%, padding: 2.5% of block
  const x = (col + (localCol + 0.5) / 3 + 0.35 / 100) * pc + ((Math.floor(col / 3) + 1) * 0.5 - 0.25) / 100;
  const y = (row + (localRow + 0.5) / 3 + 0.35 / 100) * pc + ((Math.floor(row / 3) + 1) * 0.5 - 0.25) / 100;

  return [x, y];
};

const calcDistance = ([sx, sy], [ex, ey]) => {
  const [dx, dy] = [ex - sx, ey - sy];

  return Math.sqrt(dx * dx + dy * dy);
};

const calcDeg = ([sx, sy], [ex, ey], d) => {
  const [dx, dy] = [ex - sx, ey - sy];
  return ((Math.acos(dx / d) * (dy < 0 ? -1 : 1)) / Math.PI) * 180;
};

export default ({ type = 'solid', startPos, startDigit, endPos, endDigit }) => {
  const sc = getCoord(startPos, startDigit);
  const ec = getCoord(endPos, endDigit);
  const distance = calcDistance(sc, ec);
  const deg = calcDeg(sc, ec, distance);
  console.log(type);

  return (
    <Arrow x={sc[0]} y={sc[1]} distance={distance - dd} deg={deg} type={type}>
      <div className={styles.Pointer}></div>
    </Arrow>
  );
};
