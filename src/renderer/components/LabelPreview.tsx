import React, { useEffect, useRef } from 'react';
import type { LabelOptions } from './LabelOptionsPane';

interface Props {
  opts: LabelOptions;
}

const LabelPreview: React.FC<Props> = ({ opts }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 300, 150);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 300, 150);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(0, 0, 300, 150);
    ctx.fillStyle = '#000';
    let y = 20;
    if (opts.showArticleNumber) {
      ctx.fillText('Art.-Nr: 12345', 10, y);
      y += 20;
    }
    if (opts.showShortText) {
      ctx.fillText('Beispieltext', 10, y);
      y += 20;
    }
    if (opts.showListPrice) {
      ctx.fillText('9,99 €', 10, y);
      y += 20;
    }
    if (opts.showEan) {
      ctx.fillRect(10, 90, 120, 40);
    }
    if (opts.showImage) {
      ctx.fillStyle = '#ccc';
      ctx.fillRect(10, 60, 60, 60);
      ctx.fillStyle = '#000';
    }
  }, [opts]);
  return <canvas ref={canvasRef} width={300} height={150} />;
};

export default LabelPreview;
