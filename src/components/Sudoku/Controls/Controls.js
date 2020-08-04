import React from 'react';
import Digits from './Digits/Digits';
import Button from '../../UI/Button/Button';
import styles from './Controls.module.scss';

const Controls = ({
  cellsRecord,
  hasPrev,
  hasNext,
  jump,
  jumpToFirst,
  jumpToLast,
  remainingDigits,
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
  autoPlacePointingClaimingHandler,
  tip,
  tipHandler,
}) => {
  return (
    <div className={styles.Controls}>
      <div className={styles.History}>
        <Button disabled={!hasPrev} onClick={jumpToFirst}>
          first
        </Button>
        <Button disabled={!hasPrev} onClick={() => jump(-1)}>
          prev
        </Button>
        <span>#{cellsRecord.idx}</span>
        <Button disabled={!hasNext} onClick={() => jump(1)}>
          next
        </Button>
        <Button disabled={!hasNext} onClick={jumpToLast}>
          last
        </Button>
        <span>{cellsRecord.desc}</span>
      </div>
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
        <Button onClick={autoPlacePointingClaimingHandler}>place/point/claim</Button>
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
