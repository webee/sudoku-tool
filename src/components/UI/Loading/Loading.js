import React from 'react';
import styles from './Loading.module.scss';
import Backdrop from '../Backdrop/Backdrop';
import Spinner from '../Spinner/Spinner';

export default () => {
  return (
    <>
      <Backdrop show absolute />
      <div className={styles.Spinner}>
        <Spinner />
      </div>
    </>
  );
};
