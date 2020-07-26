import React, { useState, useCallback, useRef } from 'react';
import Button from '../../components/UI/Button/Button';
import styles from './NewGame.module.scss';
import { useEffect } from 'react';

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

  const textareaRef = useRef();
  useEffect(() => {
    textareaRef.current.focus();
  }, []);

  // event listeners
  useEffect(() => {
    const keydownHandler = e => {
      // console.log(e);
      if (e.key === 'Escape') {
        cancelNewGameHandler();
      } else if (e.key === 'Enter' && e.shiftKey) {
        newGameHandler(puzzle);
      } else {
        return;
      }
      e.preventDefault();
    };
    document.addEventListener('keydown', keydownHandler);

    return () => {
      document.removeEventListener('keydown', keydownHandler);
    };
  }, [cancelNewGameHandler, newGameHandler, puzzle]);

  return (
    <div className={styles.NewGame}>
      <h1>input a new puzzle</h1>
      {error && <div className={styles.Error}>{error.message}</div>}
      <textarea
        ref={textareaRef}
        id="puzzle"
        name="puzzle"
        inputMode="numeric"
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
