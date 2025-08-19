import React from 'react';
import ImportDatanorm from './ImportDatanorm';
import Search from './Search';
import Cart from './Cart';
import LabelOptions from './LabelOptions';
import Preview from './Preview';

const Shell: React.FC = () => {
  return (
    <div>
      <h1>Etiketten</h1>
      <ImportDatanorm />
      <Search />
      <Cart />
      <LabelOptions />
      <Preview />
    </div>
  );
};

export default Shell;
