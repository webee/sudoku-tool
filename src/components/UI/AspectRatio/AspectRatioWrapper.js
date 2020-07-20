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

export default ({ ratio = 1.0, children, ...props }) => {
  return (
    <Wrapper ratio={ratio} {...props}>
      {children}
    </Wrapper>
  );
};
