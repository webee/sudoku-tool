import React from 'react';
import styles from './Digits.module.scss';

const styleColor = c => (c ? { backgroundColor: c } : {});

const generateDigit = digitClass => ({
  color,
  digitClassName = 'digit',
  className,
  children,
}) => (
  <div
    className={`${digitClass} ${digitClassName} ${className}`}
    style={styleColor(color)}
  >
    {children}
  </div>
);

export const Zero = generateDigit(styles.Zero);
export const One = generateDigit(styles.One);
export const Two = generateDigit(styles.Two);
export const Three = generateDigit(styles.Three);
export const Four = generateDigit(styles.Four);
export const Five = generateDigit(styles.Five);
export const Six = generateDigit(styles.Six);
export const Seven = generateDigit(styles.Seven);
export const Eight = generateDigit(styles.Eight);
export const Nine = generateDigit(styles.Nine);

export default [
  <Zero />,
  <One />,
  <Two />,
  <Three />,
  <Four />,
  <Five />,
  <Six />,
  <Seven />,
  <Eight />,
  <Nine />,
];
