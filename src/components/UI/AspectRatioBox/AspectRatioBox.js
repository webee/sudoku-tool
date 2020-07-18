import React from 'react';
import styled from 'styled-components';

/*
  make sure the width is the same with a parent's,
  because padding refer to parent's width.
*/
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
  ${({ fixed, scroll }) =>
    fixed
      ? `
    height: 100%;
    overflow: ${scroll ? `scroll` : 'hidden'};
  `
      : `
  min-height: 100%;
  `}
`;

export default ({ ratio = 1.0, fixed = true, scroll = false, children }) => {
  return (
    <Wrapper ratio={ratio}>
      <Content fixed={fixed} scroll={scroll}>
        {children}
      </Content>
    </Wrapper>
  );
};
