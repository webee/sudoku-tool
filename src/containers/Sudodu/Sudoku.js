import React, { useState, useCallback } from 'react';
import Main from './Main';
import NewGame from './NewGame';
import styles from './Sudoku.module.scss';
import * as sudoku from '../../libs/sudoku';

const defaultPuzzle = `
090000000
000800230
006004070
500083100
600090003
001560007
010200700
084001000
000000020
`;

const Sudoku = () => {
  const [puzzle, setPuzzle] = useState(() => {
    // get puzzle from url search parameter: puzzle
    return (
      new URLSearchParams(window.location.search).get('puzzle') || defaultPuzzle
    );
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
      // just for check
      sudoku.parsePuzzle(puzzle);
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
