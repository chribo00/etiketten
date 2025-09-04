import React, { useState } from 'react';
import StepFile from './StepFile';
import StepMapping from './StepMapping';
import StepPreview from './StepPreview';
import type { ParsedFile, ImportRow, Mapping } from './types';

type Props = { open: boolean; onClose: () => void };

const ImportWizard: React.FC<Props> = ({ open, onClose }) => {
  const [step, setStep] = useState(0);
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [mapping, setMapping] = useState<Mapping>({});

  if (!open) return null;

  const handleParsed = (p: ParsedFile) => {
    setParsed(p);
    setStep(1);
  };

  const handleMapped = (r: ImportRow[], m: Mapping) => {
    setRows(r);
    setMapping(m);
    setStep(2);
  };

  const handleImport = async (dryRun?: boolean) => {
    await window.api.import.run({ rows, dryRun });
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        {step === 0 && <StepFile onParsed={handleParsed} />}
        {step === 1 && parsed && (
          <StepMapping
            headers={parsed.headers}
            rows={parsed.rows}
            onBack={() => setStep(0)}
            onMapped={handleMapped}
          />
        )}
        {step === 2 && (
          <StepPreview rows={rows} onBack={() => setStep(1)} onImport={handleImport} />
        )}
      </div>
    </div>
  );
};

export default ImportWizard;
