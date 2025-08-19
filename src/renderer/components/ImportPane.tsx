import React, { useState } from 'react';
import { Button, Input } from '@fluentui/react-components';

const ImportPane: React.FC = () => {
  const [path, setPath] = useState('');
  const handleImport = async () => {
    if (path) {
      await window.api.importDatanorm(path);
    }
  };
  return (
    <div>
      <Input value={path} onChange={(_, v) => setPath(v.value)} placeholder="DATANORM Pfad" />
      <Button onClick={handleImport}>Importieren</Button>
    </div>
  );
};

export default ImportPane;
