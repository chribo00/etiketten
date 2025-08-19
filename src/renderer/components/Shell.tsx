import React from 'react';
import ImportPane from './ImportPane';
import SearchPane from './SearchPane';
import CartPane from './CartPane';
import LabelOptionsPane from './LabelOptionsPane';
import PreviewPane from './PreviewPane';

const Shell: React.FC = () => {
  return (
    <div>
      <h1>Etiketten</h1>
        <ImportPane />
        <SearchPane />
        <CartPane />
        <LabelOptionsPane />
        <PreviewPane />
      </div>
    );
  };

export default Shell;
