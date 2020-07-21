import React from 'react';
import styles from './Button.module.scss';

const Button = ({ type, onClick, children }) => {
  const classes = [styles.Button, styles[type]];
  return (
    <button className={classes.join(' ')} onClick={onClick}>
      {children}
    </button>
  );
};

export default Button;
