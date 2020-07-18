import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  height: 0;
  padding-top: ${({ ratio }) => 100 / ratio}%;
  position: relative;
`;

const Content = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  ${({ fixed }) =>
    fixed
      ? `
    height: 100%;
    overflow: scroll;
  `
      : `
  min-height: 100%;
  `}
`;

export default ({ ratio = 1.0, fixed = true, children }) => {
  return (
    <Wrapper ratio={ratio}>
      <Content fixed={fixed}>{children}</Content>
    </Wrapper>
  );
};
