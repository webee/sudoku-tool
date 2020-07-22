import React, { useState, useCallback } from 'react';
import Button from '../UI/Button/Button';
import styles from './NewGame.module.scss';

const samplePuzzle = `901002708
570060000
000000004
000000000
700421900
000098030
300506070
009003000
000080051`;

const NewGame = ({ cancelNewGameHandler, newGameHandler, error }) => {
  const [puzzle, setPuzzle] = useState('');
  const puzzleChangedHandler = useCallback(event => {
    setPuzzle(event.target.value);
  }, []);

  return (
    <div className={styles.NewGame}>
      <h1>input a new puzzle</h1>
      {error && <div className={styles.Error}>{error.message}</div>}
      <textarea
        id="puzzle"
        name="puzzle"
        onChange={puzzleChangedHandler}
        value={puzzle}
        placeholder={samplePuzzle}
      />
      <Button onClick={cancelNewGameHandler}>Cancel</Button>
      <Button onClick={() => newGameHandler(puzzle)}>Done</Button>
    </div>
  );
};

export default NewGame;
