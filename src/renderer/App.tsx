import React from 'react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import Shell from './components/Shell';

const App: React.FC = () => {
  return (
    <FluentProvider theme={webLightTheme}>
      <Shell />
    </FluentProvider>
  );
};

export default App;
