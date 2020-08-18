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
  withALS,
  deselectHandler,
  toggleShowAvailHandler,
  toggleIsNotingHandler,
  toggleWithALSHandler,
  solveHandler,
  resetHandler,
  eraseValueHandler,
  autoNoteHandler,
  autoPlacePointingClaimingHandler,
  tip,
  tipHandler,
  cancelTipHandler,
  changeChainStepHandler,
  jumpToTrailStartHandler,
}) => {
  return (
    <div className={styles.Controls}>
      <div className={styles.History}>
        <Button disabled={!hasPrev} onClick={jumpToFirst}>
          &lt;&lt;
        </Button>
        <Button disabled={!hasPrev} onClick={() => jump(-1)}>
          &lt;
        </Button>
        <Button disabled={!hasNext} onClick={() => jump(1)}>
          &gt;
        </Button>
        <Button disabled={!hasNext} onClick={jumpToLast}>
          &gt;&gt;
        </Button>
        <span>#{cellsRecord.idx}</span>
        <span>{cellsRecord.desc}</span>
      </div>
      <div className={styles.Panel}>
        <Button onClick={solveHandler}>Solve</Button>
        <Button onClick={resetHandler}>Reset</Button>
        <Button onClick={eraseValueHandler}>Erase</Button>
        <Button onClick={deselectHandler}>Deselect</Button>
        <Button type={showAvail ? 'On' : 'Off'} onClick={toggleShowAvailHandler}>
          Avail
        </Button>
        <Button type={isNoting ? 'On' : 'Off'} onClick={toggleIsNotingHandler}>
          Note
        </Button>
        <Button type={withALS ? 'On' : 'Off'} onClick={toggleWithALSHandler}>
          ALS
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
          {tip && (
            <Button type={'Warn'} onClick={cancelTipHandler}>
              X
            </Button>
          )}
          {tip && tip.type === 'chain' && (
            <>
              <span className={styles.ChainSteper} onClick={() => changeChainStepHandler(-1)}>
                &lt;
              </span>
              <span className={styles.ChainSteper} onClick={() => changeChainStepHandler(1)}>
                &gt;
              </span>
            </>
          )}
          {tip && tip.type === 'trial-error' && (
            <span className={styles.ChainSteper} onClick={jumpToTrailStartHandler}>
              &lt;start
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Controls;
