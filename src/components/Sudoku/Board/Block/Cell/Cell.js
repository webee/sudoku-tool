import React from 'react';
import styles from './Cell.module.scss';
import digits from '../../../../UI/Digits/Digits';
import * as sudoku from '../../../../../libs/sudoku';

const noteClassName = (n, activeVal, notes) => {
  const classes = [styles.Note];
  if (n === activeVal) {
    classes.push(styles.ActiveValue);
  }
  if (notes && notes.has(n)) {
    classes.push(styles.MarkedValue);
  }
  return classes.join(' ');
};

const Cell = React.memo(
  ({ value, origin, row, col, activePos, activeVal, available, showAvail, isNoting, onClick, marks }) => {
    const block = sudoku.getCellBlock(row, col);
    const classes = [];
    let content = null;
    let isSelected = false;

    if (activePos) {
      const [activeRow, activeCol] = activePos;
      const activeBlock = sudoku.getCellBlock(activeRow, activeCol);
      if (row === activeRow && col === activeCol) {
        // active
        isSelected = true;
        classes.push(styles.Selected);
      } else if (row === activeRow || col === activeCol || block === activeBlock) {
        // related area
        classes.push(styles.Related);
      }
    }

    let clickable = available;
    if (available) {
      classes.push(styles.Available);
      if (showAvail) {
        // show background
        classes.push(isNoting ? styles.Note : styles.Place);
      }
    } else if (available === null) {
      // deselected
      classes.push(styles.Available);
      clickable = true;
    } else if (!isNoting && !origin && value === activeVal) {
      // place mode, placed value === activeVal
      classes.push(styles.Available);
      clickable = true;
    }

    // marks
    let highlighted = false;
    let domainMarked = false;
    let effectMarked = false;
    if (marks) {
      const { domain, effect, highlights } = marks;
      if (domain) {
        const { rows, cols, blocks } = domain;
        if (rows && rows.has(row)) {
          domainMarked = true;
        }
        if (cols && cols.has(col)) {
          domainMarked = true;
        }
        if (blocks && blocks.has(block)) {
          domainMarked = true;
        }
      }
      if (effect) {
        const { rows, cols, blocks } = effect;
        if (rows && rows.has(row)) {
          effectMarked = true;
        }
        if (cols && cols.has(col)) {
          effectMarked = true;
        }
        if (blocks && blocks.has(block)) {
          effectMarked = true;
        }
      }
      if (highlights && highlights.poses.has(sudoku.encodePos([row, col]))) {
        highlighted = true;
      }
    }
    if (highlighted) {
      classes.push(styles.MarkedHighlight);
    } else if (domainMarked) {
      classes.push(styles.MarkedDomain);
    } else if (effectMarked) {
      classes.push(styles.MarkedEffect);
    }

    const valueMarked = highlighted || effectMarked;

    if (typeof value === 'number') {
      classes.push(styles.Value);
      // it's placed value
      !origin && classes.push(styles.Placed);
      // it's active value
      if (value === activeVal && !isSelected) {
        classes.push(styles.ActiveValue);
      }
      // it's marked value
      if (valueMarked && marks.highlights.values && marks.highlights.values.has(value)) {
        classes.push(styles.MarkedValue);
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
              <div className={noteClassName(1, activeVal, valueMarked && marks.highlights.notes)}>
                {notes.has(1) ? digits[1] : null}
              </div>
              <div className={noteClassName(2, activeVal, valueMarked && marks.highlights.notes)}>
                {notes.has(2) ? digits[2] : null}
              </div>
              <div className={noteClassName(3, activeVal, valueMarked && marks.highlights.notes)}>
                {notes.has(3) ? digits[3] : null}
              </div>
            </div>
            <div className={styles.RowNotes}>
              <div className={noteClassName(4, activeVal, valueMarked && marks.highlights.notes)}>
                {notes.has(4) ? digits[4] : null}
              </div>
              <div className={noteClassName(5, activeVal, valueMarked && marks.highlights.notes)}>
                {notes.has(5) ? digits[5] : null}
              </div>
              <div className={noteClassName(6, activeVal, valueMarked && marks.highlights.notes)}>
                {notes.has(6) ? digits[6] : null}
              </div>
            </div>
            <div className={styles.RowNotes}>
              <div className={noteClassName(7, activeVal, valueMarked && marks.highlights.notes)}>
                {notes.has(7) ? digits[7] : null}
              </div>
              <div className={noteClassName(8, activeVal, valueMarked && marks.highlights.notes)}>
                {notes.has(8) ? digits[8] : null}
              </div>
              <div className={noteClassName(9, activeVal, valueMarked && marks.highlights.notes)}>
                {notes.has(9) ? digits[9] : null}
              </div>
            </div>
          </>
        );
      }
    }
    return (
      <div className={classes.join(' ')} onClick={clickable ? () => onClick(row, col) : undefined}>
        {content}
      </div>
    );
  }
);

export default Cell;
