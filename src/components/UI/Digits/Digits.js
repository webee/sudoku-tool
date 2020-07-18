import React from 'react';
import styles from './Digits.module.scss';

export const Zero = () => <div className={styles.Zero} />;

export const One = () => <div className={styles.One} />;
export const Two = () => <div className={styles.Two} />;
export const Three = () => <div className={styles.Three} />;
export const Four = () => <div className={styles.Four} />;
export const Five = () => <div className={styles.Five} />;
export const Six = () => <div className={styles.Six} />;
export const Seven = () => <div className={styles.Seven} />;
export const Eight = () => <div className={styles.Eight} />;
export const Nine = () => <div className={styles.Nine} />;

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
