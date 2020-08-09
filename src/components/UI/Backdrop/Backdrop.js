import React from 'react';
import styles from './Backdrop.module.scss';

const Backdrop = ({ show, onClick, absolute = false }) => {
  if (!show) {
    return null;
  }
  const classes = [styles.Backdrop];
  if (absolute) {
    classes.push(styles.Absolute);
  }
  return <div className={classes.join(' ')} onClick={onClick} />;
};

export default Backdrop;
