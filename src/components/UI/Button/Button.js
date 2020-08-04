import React from 'react';
import styles from './Button.module.scss';

const Button = ({ type, onClick, disabled = false, children }) => {
  const classes = [styles.Button];
  if (type) {
    classes.push(styles[type]);
  }
  return (
    <button className={classes.join(' ')} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
};

export default Button;
