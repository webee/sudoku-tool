import React, { useState } from 'react';
import Board from './Board/Board';
import styles from './Sudoku.module.scss';

const puzzle = `
901002708
570060000
000000004
000000000
700421900
000098030
300506070
009003000
000080p351
`;

const Sudoku = () => {
  const [values] = useState(() => parsePuzzle(puzzle));

  return (
    <div className={styles.Sudoku}>
      <div className={styles.Board}>
        <Board values={values} />
      </div>
    </div>
  );
};

const cellPattern = /(\d)|(p\d)|(n[1-9]*N)/g;
const valuePattern = /^[1-9]$/;
const parsePuzzle = puzzle => {
  // split cell
  const cells = puzzle.match(cellPattern);
  if (cells.length !== 81) {
    throw new Error('bad sudoku puzzle format');
  }

  // parse values
  const cellValues = cells.map(cell => {
    if (cell.startsWith('n') && cell.endsWith('N')) {
      console.log(cell);
      // it's note
      const notes = cell
        .slice(1, -1)
        .split('')
        .map(s => parseInt(s));
      return { value: new Set(notes) };
    } else if (cell.startsWith('p')) {
      // it's placed value
      return { value: parseInt(cell[1]) };
    } else if (valuePattern.test(cell)) {
      // it's value
      return {
        value: parseInt(cell),
        // puzzle origin value
        origin: true,
      };
    } else if (cell === '0') {
      // it's empty
      return { value: new Set() };
    }
    throw new Error('impossible');
  });

  // organize the values
  const values = Array.from(new Array(9)).map(() => new Array(9));
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      values[i][j] = cellValues[9 * i + j];
    }
  }
  return values;
};

export default Sudoku;
