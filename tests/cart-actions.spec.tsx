/** @jest-environment jsdom */
import React from 'react';
import ReactDOM from 'react-dom';
import CartActions from '../src/renderer/components/CartActions';

describe('CartActions Import Button', () => {
  it('enables import and disables clear button when cart empty', () => {
    const div = document.createElement('div');
    ReactDOM.render(
      <CartActions hasItems={false} onClear={() => {}} onImport={() => {}} />,
      div,
    );
    const buttons = div.querySelectorAll('button');
    expect(buttons.length).toBe(2);
    const clearBtn = buttons[0] as HTMLButtonElement;
    const importBtn = buttons[1] as HTMLButtonElement;
    expect(clearBtn.disabled).toBe(true);
    expect(importBtn.disabled).toBe(false);
  });

  it('enables both buttons when cart has items', () => {
    const div = document.createElement('div');
    ReactDOM.render(
      <CartActions hasItems={true} onClear={() => {}} onImport={() => {}} />,
      div,
    );
    const buttons = div.querySelectorAll('button');
    expect(buttons.length).toBe(2);
    const clearBtn = buttons[0] as HTMLButtonElement;
    const importBtn = buttons[1] as HTMLButtonElement;
    expect(clearBtn.disabled).toBe(false);
    expect(importBtn.disabled).toBe(false);
  });
});
