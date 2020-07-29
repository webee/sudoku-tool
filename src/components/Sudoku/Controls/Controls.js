import React, { useMemo } from 'react';
import Digits from './Digits/Digits';
import Button from '../../UI/Button/Button';
import styles from './Controls.module.scss';
import * as sudoku from '../../../libs/sudoku';

const Controls = ({
  values,
  activeVal,
  availableDigits,
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
  pointingHandler,
  claimingHandler,
  tip,
  tipHandler,
}) => {
  // calculated states
  const remainingDigits = useMemo(() => sudoku.calcRemainingDigits(values), [values]);
  return (
    <div className={styles.Controls}>
      <div className={styles.Panel}>
        <Button onClick={resetHandler}>Reset</Button>
        <Button onClick={eraseValueHandler}>Erase</Button>
        <Button onClick={deselectHandler}>Deselect</Button>
        <Button type={showAvail ? 'On' : 'Off'} onClick={toggleShowAvailHandler}>
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
        <Button onClick={autoNoteHandler}>note</Button>
        <Button onClick={pointingHandler}>point</Button>
        <Button onClick={claimingHandler}>claim</Button>
        <Button onClick={autoPlaceHandler}>place</Button>
        <div className={styles.Tip}>
          <Button type={tip && 'On'} onClick={tipHandler}>
            {tip ? tip.name : 'tip'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Controls;
