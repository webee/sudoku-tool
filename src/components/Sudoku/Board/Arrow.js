import React from 'react';
import styles from './Arrow.module.scss';
import styled from 'styled-components';
import * as calc from './calc';

// shortend arrow length, to avoid tail-head contact.
const dd = 0.02;

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

export default ({ type = 'solid', startPos, startDigit, endPos, endDigit }) => {
  const sc = calc.getCoord(startPos, startDigit);
  const ec = calc.getCoord(endPos, endDigit);
  const distance = calc.calcDistance(sc, ec);
  const deg = calc.calcDeg(sc, ec, distance);

  return (
    <Arrow x={sc[0]} y={sc[1]} distance={distance - dd} deg={deg} type={type}>
      <div className={styles.Pointer}></div>
    </Arrow>
  );
};
