import React from 'react';
import AspectRatioWrapper from '../../../UI/AspectRatio/AspectRatioWrapper';
import digits from '../../../UI/Digits/Digits';
import styles from './Digits.module.scss';

const Digits = React.memo(
  ({ activeVal, availableDigits, remainingDigits, digitClickedHandler }) => {
    const genClassName = d => {
      const classes = [styles.Digit];
      if (d === activeVal) {
        classes.push(styles.active);
      }
      if (!availableDigits.has(d)) {
        classes.push(styles.Disabled);
      }
      return classes.join(' ');
    };

    return (
      <div className={styles.Digits}>
        <AspectRatioWrapper
          className={genClassName(1)}
          onClick={
            availableDigits.has(1) ? () => digitClickedHandler(1) : undefined
          }
        >
          {digits[1]}
          <div className={styles.Count}>{digits[remainingDigits[1]]}</div>
        </AspectRatioWrapper>
        {[2, 3, 4, 5, 6, 7, 8, 9].map(d => (
          <div
            key={d}
            className={genClassName(d)}
            onClick={
              availableDigits.has(d) ? () => digitClickedHandler(d) : undefined
            }
          >
            {digits[d]}
            <div className={styles.Count}>{digits[remainingDigits[d]]}</div>
          </div>
        ))}
      </div>
    );
  }
);

export default Digits;
