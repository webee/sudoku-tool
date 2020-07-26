import React from 'react';
import Backdrop from '../Backdrop/Backdrop';
import styles from './Modal.module.scss';

const Modal = ({ show = false, close, children }) => {
  const classes = [styles.Modal];
  if (show) {
    classes.push(styles.Show);
  }
  return (
    <>
      <Backdrop show={show} onClick={close} />
      <div className={classes.join(' ')}>
        <div className={styles.Close} onClick={close}>
          X
        </div>
        {children}
      </div>
    </>
  );
};

export default React.memo(React.memo(Modal), (prevProps, nextProps) => {
  return !prevProps.show && !nextProps.show;
});
