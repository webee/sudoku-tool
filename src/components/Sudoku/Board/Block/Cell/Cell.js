import React from 'react';
import styles from './Cell.module.scss';
import digits from '../../../../UI/Digits/Digits';
import * as sudoku from '../../../../../libs/sudoku';

const noteClassName = active =>
  `${styles.Note} ${active ? styles.ActiveValue : ''}`;

const Cell = React.memo(
  ({
    value,
    origin,
    row,
    col,
    activePos,
    activeVal,
    available,
    showAvail,
    isNoting,
    onClick,
  }) => {
    const classes = [];
    let content = null;
    let isSelected = false;

    if (activePos) {
      const [activeRow, activeCol] = activePos;
      const block = sudoku.getCellBlock(row, col);
      const activeBlock = sudoku.getCellBlock(activeRow, activeCol);
      if (row === activeRow && col === activeCol) {
        // active
        isSelected = true;
        classes.push(styles.Selected);
      } else if (
        row === activeRow ||
        col === activeCol ||
        block === activeBlock
      ) {
        // related area
        classes.push(styles.Related);
      }
    }

    let clickable = available;
    if (available && showAvail) {
      classes.push(styles.Available, isNoting ? styles.Note : styles.Place);
    } else if (available === null) {
      // deselected
      classes.push(styles.Available);
      clickable = true;
    } else if (!isNoting && !origin && value === activeVal) {
      // place mode, placed value === activeVal
      classes.push(styles.Available);
      clickable = true;
    }

    if (typeof value === 'number') {
      classes.push(styles.Value);
      // it's placed value
      !origin && classes.push(styles.Placed);
      // it's active value
      if (value === activeVal && !isSelected) {
        classes.push(styles.ActiveValue);
      }

      content = digits[value];
    } else {
      classes.push(styles.Notes);
      // Set: [1-9]
      const notes = value;
      if (notes.size > 0) {
        content = (
          <>
            <div className={styles.RowNotes}>
              <div className={noteClassName(1 === activeVal)}>
                {notes.has(1) ? digits[1] : null}
              </div>
              <div className={noteClassName(2 === activeVal)}>
                {notes.has(2) ? digits[2] : null}
              </div>
              <div className={noteClassName(3 === activeVal)}>
                {notes.has(3) ? digits[3] : null}
              </div>
            </div>
            <div className={styles.RowNotes}>
              <div className={noteClassName(4 === activeVal)}>
                {notes.has(4) ? digits[4] : null}
              </div>
              <div className={noteClassName(5 === activeVal)}>
                {notes.has(5) ? digits[5] : null}
              </div>
              <div className={noteClassName(6 === activeVal)}>
                {notes.has(6) ? digits[6] : null}
              </div>
            </div>
            <div className={styles.RowNotes}>
              <div className={noteClassName(7 === activeVal)}>
                {notes.has(7) ? digits[7] : null}
              </div>
              <div className={noteClassName(8 === activeVal)}>
                {notes.has(8) ? digits[8] : null}
              </div>
              <div className={noteClassName(9 === activeVal)}>
                {notes.has(9) ? digits[9] : null}
              </div>
            </div>
          </>
        );
      }
    }
    return (
      <div
        className={classes.join(' ')}
        onClick={clickable ? () => onClick(row, col) : undefined}
      >
        {content}
      </div>
    );
  }
);

export default Cell;
