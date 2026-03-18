import React, { useEffect, useMemo, useRef, useState } from 'react';
import ImageDropzone from './components/ImageDropzone';
import { applyMaskToCanvas, fileToImageElement } from './utils/canvasUtils';

export default function App() {
  const worker = useMemo(
    () => new Worker(new URL('./workers/bgRemovalWorker.js', import.meta.url)),
    []
  );
  const objectUrlRef = useRef('');
  const currentImageRef = useRef(null);
  const resultContainerRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resultCanvas, setResultCanvas] = useState(null);

  useEffect(() => {
    const handleWorkerMessage = (event) => {
      const { type, maskData, error } = event.data ?? {};

      if (type === 'LOADING') {
        setIsModelLoading(true);
        setIsProcessing(true);
        setErrorMessage('');
        return;
      }

      if (type === 'RESULT') {
        if (!currentImageRef.current) {
          setErrorMessage('Fant ikke bildet som skulle behandles.');
          setIsProcessing(false);
          setIsModelLoading(false);
          return;
        }

        const canvas = applyMaskToCanvas(currentImageRef.current, maskData);
        setResultCanvas(canvas);
        setErrorMessage('');
        setIsProcessing(false);
        setIsModelLoading(false);

        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = '';
        }

        return;
      }

      if (type === 'ERROR') {
        setErrorMessage(error || 'Noe gikk galt under behandling av bildet.');
        setIsProcessing(false);
        setIsModelLoading(false);

        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = '';
        }
      }
    };

    worker.addEventListener('message', handleWorkerMessage);

    return () => {
      worker.removeEventListener('message', handleWorkerMessage);
      worker.terminate();

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, [worker]);

  useEffect(() => {
    const container = resultContainerRef.current;

    if (!container) {
      return;
    }

    container.innerHTML = '';

    if (resultCanvas) {
      container.appendChild(resultCanvas);
    }
  }, [resultCanvas]);

  const handleImageSelected = async (file) => {
    setErrorMessage('');
    setResultCanvas(null);
    setIsProcessing(true);
    setIsModelLoading(false);

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = '';
    }

    try {
      const imageElement = await fileToImageElement(file);
      const imageUrl = URL.createObjectURL(file);

      currentImageRef.current = imageElement;
      objectUrlRef.current = imageUrl;

      worker.postMessage({ type: 'REMOVE_BG', imageUrl });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Kunne ikke laste inn valgt bilde.'
      );
      setIsProcessing(false);
      setIsModelLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-12 text-center">
      <div className="w-full max-w-3xl space-y-6">
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold text-slate-900">Bakgrunnsfjerner</h1>
          <p className="text-lg text-slate-600">
            Last opp et bilde for å fjerne bakgrunnen
          </p>
        </div>

        <ImageDropzone onImageSelected={handleImageSelected} />

        {isModelLoading ? <p className="text-sm text-slate-600">Laster modell...</p> : null}

        {isProcessing ? <p className="text-sm text-slate-600">Behandler bilde...</p> : null}

        {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

        <div className="space-y-2">
          <h2 className="text-lg font-medium text-slate-900">Resultat</h2>
          <div ref={resultContainerRef} className="flex justify-center" />
        </div>
      </div>
    </main>
  );
}
