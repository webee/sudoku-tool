import React, { useState, useCallback } from 'react';
import Main from './Main';
import NewGame from './NewGame';
import styles from './Sudoku.module.scss';
import * as sudokus from '../../libs/sudoku';

const Sudoku = () => {
  const [sudoku, setSudoku] = useState(() => {
    // get puzzle from url search parameter: puzzle
    const puzzle = new URLSearchParams(window.location.search).get('puzzle');
    try {
      return new sudokus.Sudoku(puzzle);
    } catch (error) {
      return new sudokus.Sudoku();
    }
  });
  const [isNewGame, setIsNewGame] = useState(false);
  const [puzzleError, setPuzzleError] = useState(null);

  // handlers
  const startNewGameHandler = useCallback(() => {
    setIsNewGame(true);
  }, []);
  const cancelNewGameHandler = useCallback(() => {
    setIsNewGame(false);
  }, []);

  const newGameHandler = useCallback(puzzle => {
    console.log('xxxxxxx', puzzle);
    try {
      setSudoku(new sudokus.Sudoku(puzzle));
      setIsNewGame(false);
    } catch (error) {
      setPuzzleError(error);
    }
  }, []);

  const emptyHandler = useCallback(() => {
    newGameHandler();
  }, [newGameHandler]);

  let content = null;
  if (isNewGame) {
    content = (
      <NewGame cancelNewGameHandler={cancelNewGameHandler} newGameHandler={newGameHandler} error={puzzleError} />
    );
  } else {
    content = (
      <Main
        sudoku={sudoku}
        startNewGameHandler={startNewGameHandler}
        newGameHandler={newGameHandler}
        emptyHandler={emptyHandler}
      />
    );
  }

  return <div className={styles.Sudoku}>{content}</div>;
};

export default Sudoku;
