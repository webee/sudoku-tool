import React from 'react';
import AspectRatioBox from '../../UI/AspectRatioBox/AspectRatioBox';
import digits from '../../UI/Digits/Digits';
import styles from './Controls.module.scss';

const Controls = () => {
  return (
    <div className={styles.Controls}>
      <div className={styles.Digit}>
        <AspectRatioBox>
          {digits[1]}
          <div className={styles.Count}>{digits[9]}</div>
        </AspectRatioBox>
      </div>
      <div className={styles.Digit}>
        {digits[2]}
        <div className={styles.Count}>{digits[8]}</div>
      </div>
      <div className={styles.Digit}>
        {digits[3]}
        <div className={styles.Count}>{digits[7]}</div>
      </div>
      <div className={styles.Digit}>
        {digits[4]}
        <div className={styles.Count}>{digits[6]}</div>
      </div>
      <div className={styles.Digit}>
        {digits[5]}
        <div className={styles.Count}>{digits[5]}</div>
      </div>
      <div className={styles.Digit}>
        {digits[6]}
        <div className={styles.Count}>{digits[4]}</div>
      </div>
      <div className={styles.Digit}>
        {digits[7]}
        <div className={styles.Count}>{digits[3]}</div>
      </div>
      <div className={styles.Digit}>
        {digits[8]}
        <div className={styles.Count}>{digits[2]}</div>
      </div>
      <div className={styles.Digit}>
        {digits[9]}
        <div className={styles.Count}>{digits[1]}</div>
      </div>
    </div>
  );
};

export default Controls;
