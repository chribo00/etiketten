import React, { useEffect, useRef } from 'react';

const LabelPreview: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#eee';
      ctx.fillRect(0, 0, 300, 150);
      ctx.fillStyle = '#000';
      ctx.fillText('Preview', 120, 75);
    }
  }, []);
  return <canvas ref={canvasRef} width={300} height={150} />;
};

export default LabelPreview;
