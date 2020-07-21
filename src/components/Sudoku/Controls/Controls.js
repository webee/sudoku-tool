import React from 'react';
import Digits from './Digits/Digits';
import styles from './Controls.module.scss';

const Controls = ({
  activeVal,
  availableDigits,
  remainingDigits,
  digitClickedHandler,
}) => {
  return (
    <div className={styles.Controls}>
      <div className={styles.Panel}>
        <button>Deselect</button>
        <button>Note</button>
        <button>Erase</button>
      </div>
      <Digits
        activeVal={activeVal}
        availableDigits={availableDigits}
        remainingDigits={remainingDigits}
        digitClickedHandler={digitClickedHandler}
      />
      <div className={styles.Tools}>Tools</div>
    </div>
  );
};

export default Controls;
