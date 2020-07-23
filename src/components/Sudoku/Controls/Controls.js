import React, { useMemo } from 'react';
import Digits from './Digits/Digits';
import Button from '../../UI/Button/Button';
import styles from './Controls.module.scss';
import * as sudoku from '../sukodu';

const Controls = ({
  values,
  activePos,
  activeVal,
  digitClickedHandler,
  showAvail,
  isNoting,
  deselectHandler,
  toggleShowAvailHandler,
  toggleIsNotingHandler,
  resetHandler,
  eraseValueHandler,
  autoNoteHandler,
  autoPlaceHandler,
}) => {
  // calculated states
  const availableDigits = useMemo(
    () => sudoku.calcAvailableDigits(values, activePos),
    [activePos, values]
  );
  const remainingDigits = useMemo(() => sudoku.calcRemainingDigits(values), [
    values,
  ]);
  return (
    <div className={styles.Controls}>
      <div className={styles.Panel}>
        <Button onClick={resetHandler}>Reset</Button>
        <Button onClick={eraseValueHandler}>Erase</Button>
        <Button onClick={deselectHandler}>Deselect</Button>
        <Button
          type={showAvail ? 'On' : 'Off'}
          onClick={toggleShowAvailHandler}
        >
          Avail
        </Button>
        <Button type={isNoting ? 'On' : 'Off'} onClick={toggleIsNotingHandler}>
          Note
        </Button>
      </div>
      <Digits
        isNoting={isNoting}
        activeVal={activeVal}
        availableDigits={availableDigits}
        remainingDigits={remainingDigits}
        digitClickedHandler={digitClickedHandler}
      />
      <div className={styles.Tools}>
        <Button onClick={autoNoteHandler}>Auto Note</Button>
        <Button onClick={autoPlaceHandler}>Auto Place</Button>
      </div>
    </div>
  );
};

export default Controls;
