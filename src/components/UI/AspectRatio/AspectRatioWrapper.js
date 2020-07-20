import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  &::before {
    content: '';
    width: 1px;
    margin-left: -1px;
    float: left;
    height: 0;
    padding-top: ${({ ratio }) => 100 / ratio}%;
  }
  &::after {
    content: '';
    display: table;
    clear: both;
  }
`;

export default ({ ratio = 1.0, className, children }) => {
  return (
    <Wrapper ratio={ratio} className={className}>
      {children}
    </Wrapper>
  );
};
