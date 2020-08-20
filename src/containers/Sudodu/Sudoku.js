import React, { useState, useEffect, useCallback } from 'react';
import Main from './Main';
import NewGame from './NewGame';
import styles from './Sudoku.module.scss';
import * as sudokus from '../../libs/sudoku';
import * as utils from '../../libs/utils';

const Sudoku = () => {
  const [alertInfo, setAlertInfo] = useState();

  const checkSudokuResults = useCallback(results => {
    if (results) {
      if (results.length === 0) {
        setAlertInfo('this sudoku has no solution');
      } else if (results.length > 1) {
        setAlertInfo('this sudoku has multi solutions');
      }
    }
  }, []);

  const [sudoku, setSudoku] = useState(() => {
    // get puzzle from url search parameter: puzzle
    const puzzle = new URLSearchParams(window.location.search).get('puzzle');
    try {
      const instance = new sudokus.Sudoku(puzzle);
      checkSudokuResults(instance.results);
      return instance;
    } catch (error) {
      console.error(error);
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

  const newGameHandler = useCallback(
    (puzzle, checkResults = true) => {
      try {
        const instance = new sudokus.Sudoku(puzzle);
        if (checkResults) {
          checkSudokuResults(instance.results);
        }
        setSudoku(instance);
        setIsNewGame(false);
        setPuzzleError(null);
      } catch (error) {
        console.error(error);
        setPuzzleError(error);
      }
    },
    [checkSudokuResults]
  );

  const emptyHandler = useCallback(() => {
    newGameHandler();
  }, [newGameHandler]);

  // effects
  useEffect(() => {
    if (alertInfo) {
      alert(alertInfo);
      setAlertInfo(null);
    }
  }, [alertInfo]);

  useEffect(() => {
    // set debug
    const isDebug = new URLSearchParams(window.location.search).get('debug');
    utils.setDebug(isDebug !== null);
  }, []);

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
