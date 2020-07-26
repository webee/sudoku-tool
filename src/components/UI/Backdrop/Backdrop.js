import React from 'react';
import styles from './Backdrop.module.css';

const Backdrop = ({ show, onClick }) =>
  show ? <div className={styles.Backdrop} onClick={onClick} /> : null;

export default Backdrop;
