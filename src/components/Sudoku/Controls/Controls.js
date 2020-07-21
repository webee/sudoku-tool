import React from 'react';
import Digits from './Digits/Digits';
import Button from '../../UI/Button/Button';
import styles from './Controls.module.scss';

const Controls = ({
  activeVal,
  availableDigits,
  remainingDigits,
  digitClickedHandler,
  isNoting,
  toggleIsNotingHandler,
  eraseValueHandler,
}) => {
  return (
    <div className={styles.Controls}>
      <div className={styles.Panel}>
        <Button>Deselect</Button>
        <Button type={isNoting ? 'On' : 'Off'} onClick={toggleIsNotingHandler}>
          Note
        </Button>
        <Button onClick={eraseValueHandler}>Erase</Button>
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
