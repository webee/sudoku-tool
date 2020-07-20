import React from 'react';
import AspectRatioWrapper from '../../UI/AspectRatio/AspectRatioWrapper';
import digits from '../../UI/Digits/Digits';
import styles from './Controls.module.scss';

const Controls = ({ togglePlaceHandler }) => {
  return (
    <div className={styles.Controls}>
      <div className={styles.Digits}>
        <AspectRatioWrapper
          className={styles.Digit}
          onClick={() => togglePlaceHandler(1)}
        >
          {digits[1]}
          <div className={styles.Count}>{digits[9]}</div>
        </AspectRatioWrapper>
        <div className={styles.Digit} onClick={() => togglePlaceHandler(2)}>
          {digits[2]}
          <div className={styles.Count}>{digits[8]}</div>
        </div>
        <div className={styles.Digit} onClick={() => togglePlaceHandler(3)}>
          {digits[3]}
          <div className={styles.Count}>{digits[7]}</div>
        </div>
        <div className={styles.Digit} onClick={() => togglePlaceHandler(4)}>
          {digits[4]}
          <div className={styles.Count}>{digits[6]}</div>
        </div>
        <div className={styles.Digit} onClick={() => togglePlaceHandler(5)}>
          {digits[5]}
          <div className={styles.Count}>{digits[5]}</div>
        </div>
        <div className={styles.Digit} onClick={() => togglePlaceHandler(6)}>
          {digits[6]}
          <div className={styles.Count}>{digits[4]}</div>
        </div>
        <div className={styles.Digit} onClick={() => togglePlaceHandler(7)}>
          {digits[7]}
          <div className={styles.Count}>{digits[3]}</div>
        </div>
        <div className={styles.Digit} onClick={() => togglePlaceHandler(8)}>
          {digits[8]}
          <div className={styles.Count}>{digits[2]}</div>
        </div>
        <div className={styles.Digit} onClick={() => togglePlaceHandler(9)}>
          {digits[9]}
          <div className={styles.Count}>{digits[1]}</div>
        </div>
      </div>
    </div>
  );
};

export default Controls;
