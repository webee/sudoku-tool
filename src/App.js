import React from 'react';
import SudokuBoard from './components/SudokuBoard/SudokuBoard';
import styles from './App.module.scss';

export default function App() {
  return (
    <div className={styles.App}>
      <div className={styles.Board}>
        <SudokuBoard />
      </div>
      <h1>Control Panel</h1>
    </div>
  );
}
