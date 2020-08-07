import React from 'react';
import styles from './Cell.module.scss';
import digits from '../../../../UI/Digits/Digits';
import { Notes } from '../../../../../libs/sudoku';
import * as positions from '../../../../../libs/position';

const noteClassName = (n, activeVal, highlighted, effectMarked, marks) => {
  const classes = [styles.Note];
  if (n === activeVal) {
    classes.push(styles.ActiveValue);
  }

  if (marks) {
    let src = null;
    if (highlighted) {
      src = marks.highlights;
    } else if (effectMarked) {
      src = marks.effect;
    }

    if (src) {
      const { notes, subNotes } = src;
      if (notes && notes.has(n)) {
        classes.push(styles.MarkedNoteValue);
      } else if (subNotes && subNotes.has(n)) {
        classes.push(styles.MarkedValue);
      }
    }
  }

  return classes.join(' ');
};

const Cell = React.memo(
  ({ value, origin, pos, activePos, activeVal, available, showAvail, isNoting, onClick, marks }) => {
    const { block, row, col } = pos;
    const classes = [];
    let content = null;
    let isSelected = false;

    if (activePos) {
      const { row: activeRow, col: activeCol, block: activeBlock } = activePos;
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
        const { rows, cols, blocks, poses } = effect;
        if (rows && rows.has(row)) {
          effectMarked = true;
        }
        if (cols && cols.has(col)) {
          effectMarked = true;
        }
        if (blocks && blocks.has(block)) {
          effectMarked = true;
        }
        if (poses && poses.has(pos)) {
          effectMarked = true;
        }
      }
      if (highlights && highlights.poses.has(pos)) {
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

    if (!Notes.is(value)) {
      classes.push(styles.Value);
      // it's placed value
      !origin && classes.push(styles.Placed);
      // it's active value
      if (value === activeVal && !isSelected) {
        classes.push(styles.ActiveValue);
      }
      // it's marked value
      if (highlighted && marks.highlights.values && marks.highlights.values.has(value)) {
        classes.push(styles.MarkedValue);
      }

      content = digits[value];
    } else {
      classes.push(styles.Notes);
      // Set: [1-9]
      const notes = value;
      if (Notes.size(notes) > 0) {
        content = positions.blockShape.map((rows, idx) => (
          <div key={idx} className={styles.RowNotes}>
            {rows.map(i => (
              <div key={i} className={noteClassName(i + 1, activeVal, highlighted, effectMarked, marks)}>
                {Notes.has(notes, i + 1) ? digits[i + 1] : null}
              </div>
            ))}
          </div>
        ));
      }
    }
    return (
      <div className={classes.join(' ')} onClick={clickable ? () => onClick(pos) : undefined}>
        {content}
      </div>
    );
  }
);

export default Cell;
