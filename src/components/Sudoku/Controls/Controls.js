import React from 'react';
import AspectRatioWrapper from '../../UI/AspectRatio/AspectRatioWrapper';
import digits from '../../UI/Digits/Digits';
import styles from './Controls.module.scss';

const Controls = ({ availableDigits, togglePlaceHandler }) => {
  console.log(availableDigits);
  return (
    <div className={styles.Controls}>
      <div className={styles.Digits}>
        <AspectRatioWrapper
          className={`${styles.Digit} ${
            availableDigits.has(1) ? '' : styles.Disabled
          }`}
          onClick={
            availableDigits.has(1) ? () => togglePlaceHandler(1) : undefined
          }
        >
          {digits[1]}
          <div className={styles.Count}>{digits[9]}</div>
        </AspectRatioWrapper>
        <div
          className={`${styles.Digit} ${
            availableDigits.has(2) ? '' : styles.Disabled
          }`}
          onClick={
            availableDigits.has(2) ? () => togglePlaceHandler(2) : undefined
          }
        >
          {digits[2]}
          <div className={styles.Count}>{digits[8]}</div>
        </div>
        <div
          className={`${styles.Digit} ${
            availableDigits.has(3) ? '' : styles.Disabled
          }`}
          onClick={
            availableDigits.has(3) ? () => togglePlaceHandler(3) : undefined
          }
        >
          {digits[3]}
          <div className={styles.Count}>{digits[7]}</div>
        </div>
        <div
          className={`${styles.Digit} ${
            availableDigits.has(4) ? '' : styles.Disabled
          }`}
          onClick={
            availableDigits.has(4) ? () => togglePlaceHandler(4) : undefined
          }
        >
          {digits[4]}
          <div className={styles.Count}>{digits[6]}</div>
        </div>
        <div
          className={`${styles.Digit} ${
            availableDigits.has(5) ? '' : styles.Disabled
          }`}
          onClick={
            availableDigits.has(5) ? () => togglePlaceHandler(5) : undefined
          }
        >
          {digits[5]}
          <div className={styles.Count}>{digits[5]}</div>
        </div>
        <div
          className={`${styles.Digit} ${
            availableDigits.has(6) ? '' : styles.Disabled
          }`}
          onClick={
            availableDigits.has(6) ? () => togglePlaceHandler(6) : undefined
          }
        >
          {digits[6]}
          <div className={styles.Count}>{digits[4]}</div>
        </div>
        <div
          className={`${styles.Digit} ${
            availableDigits.has(7) ? '' : styles.Disabled
          }`}
          onClick={
            availableDigits.has(7) ? () => togglePlaceHandler(7) : undefined
          }
        >
          {digits[7]}
          <div className={styles.Count}>{digits[3]}</div>
        </div>
        <div
          className={`${styles.Digit} ${
            availableDigits.has(8) ? '' : styles.Disabled
          }`}
          onClick={
            availableDigits.has(8) ? () => togglePlaceHandler(8) : undefined
          }
        >
          {digits[8]}
          <div className={styles.Count}>{digits[2]}</div>
        </div>
        <div
          className={`${styles.Digit} ${
            availableDigits.has(9) ? '' : styles.Disabled
          }`}
          onClick={
            availableDigits.has(9) ? () => togglePlaceHandler(9) : undefined
          }
        >
          {digits[9]}
          <div className={styles.Count}>{digits[1]}</div>
        </div>
      </div>
    </div>
  );
};

export default Controls;
