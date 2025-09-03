/** @jest-environment jsdom */
import React from 'react';
import ReactDOM from 'react-dom';
import CartActions from '../src/renderer/components/CartActions';

describe('CartActions Import Button', () => {
  it('renders disabled import button when cart empty', () => {
    const div = document.createElement('div');
    ReactDOM.render(
      <CartActions hasItems={false} onClear={() => {}} onImport={() => {}} />,
      div,
    );
    const buttons = div.querySelectorAll('button');
    expect(buttons.length).toBe(2);
    const importBtn = buttons[1] as HTMLButtonElement;
    expect(importBtn.disabled).toBe(true);
  });

  it('renders enabled import button when cart has items', () => {
    const div = document.createElement('div');
    ReactDOM.render(
      <CartActions hasItems={true} onClear={() => {}} onImport={() => {}} />,
      div,
    );
    const importBtn = div.querySelectorAll('button')[1] as HTMLButtonElement;
    expect(importBtn.disabled).toBe(false);
  });
});
