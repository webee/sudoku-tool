import React, { useState, useCallback } from 'react';
import Main from './Main';
import NewGame from './NewGame';
import styles from './Sudoku.module.scss';
import * as sudoku from '../../libs/sudoku';

const defaultPuzzle = `
000000000
000000000
000000000
000000000
000000000
000000000
000000000
000000000
000000000
`;

const Sudoku = () => {
  const [puzzle, setPuzzle] = useState(() => {
    // get puzzle from url search parameter: puzzle
    const puzzle = new URLSearchParams(window.location.search).get('puzzle');
    try {
      sudoku.simpleCheckPuzzle(puzzle);
      return puzzle;
    } catch (error) {
      return defaultPuzzle;
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
    try {
      sudoku.simpleCheckPuzzle(puzzle);
      setPuzzle(puzzle);
      setIsNewGame(false);
    } catch (error) {
      setPuzzleError(error);
    }
  }, []);

  let content = null;
  if (isNewGame) {
    content = (
      <NewGame
        cancelNewGameHandler={cancelNewGameHandler}
        newGameHandler={newGameHandler}
        error={puzzleError}
      />
    );
  } else {
    content = (
      <Main puzzle={puzzle} startNewGameHandler={startNewGameHandler} />
    );
  }

  return <div className={styles.Sudoku}>{content}</div>;
};

export default Sudoku;
