import React, { useState } from 'react';
import StepFile from './StepFile';
import StepMapping from './StepMapping';
import StepPreview from './StepPreview';
import StepResult from './StepResult';
import type { ParsedFile, Mapping, PreviewRow, ImportResult } from './types';

type Props = { open: boolean; onClose: () => void };

const ImportWizard: React.FC<Props> = ({ open, onClose }) => {
  const [step, setStep] = useState(0);
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [mapping, setMapping] = useState<Mapping>({});
  const [result, setResult] = useState<ImportResult | null>(null);

  if (!open) return null;

  const handleParsed = (p: ParsedFile) => {
    setParsed(p);
    setStep(1);
  };

    const handleMapped = (r: PreviewRow[], m: Mapping) => {
    setRows(r);
    setMapping(m);
    setStep(2);
  };

  const reset = () => {
    setStep(0);
    setParsed(null);
    setRows([]);
    setMapping({});
    setResult(null);
  };

  const handleCancel = () => {
    reset();
    onClose();
  };

  const handleComplete = (res: ImportResult) => {
    setResult(res);
    setStep(3);
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
          <StepPreview
            rows={rows}
            mapping={mapping}
            onBack={() => setStep(1)}
            onCancel={handleCancel}
            onComplete={handleComplete}
          />
        )}
        {step === 3 && result && (
          <StepResult
            result={result}
            onClose={handleCancel}
            onRestart={() => {
              reset();
              setStep(0);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ImportWizard;
