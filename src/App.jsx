import React, { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import ImageDropzone from './components/ImageDropzone';
import LoadingAnimation from './components/LoadingAnimation';
import {
  applyMaskToCanvas,
  fileToImageElement,
  removeWhiteBackground,
} from './utils/canvasUtils';

const MODES = {
  PHOTO: 'photo',
  WHITE_BG: 'white-background',
};

const launchConfetti = () => {
  const end = Date.now() + 2200;

  const frame = () => {
    confetti({
      origin: { y: 0.6 },
      spread: 70,
      particleCount: 100,
      startVelocity: 35,
      scalar: 0.9,
    });

    if (Date.now() < end) {
      window.requestAnimationFrame(frame);
    }
  };

  frame();
};

export default function App() {
  const worker = useMemo(
    () => new Worker(new URL('./workers/bgRemovalWorker.js', import.meta.url)),
    []
  );
  const objectUrlRef = useRef('');
  const currentImageRef = useRef(null);
  const originalFileNameRef = useRef('');
  const resultContainerRef = useRef(null);
  const shouldTriggerConfettiRef = useRef(false);
  const hasTriggeredConfettiRef = useRef(false);
  const [selectedMode, setSelectedMode] = useState(MODES.PHOTO);
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

        if (shouldTriggerConfettiRef.current && !hasTriggeredConfettiRef.current) {
          launchConfetti();
          hasTriggeredConfettiRef.current = true;
        }

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
      resultCanvas.className = 'h-auto w-full max-w-[480px] rounded-xl border border-slate-200 bg-white shadow-sm';
      container.appendChild(resultCanvas);
    }
  }, [resultCanvas]);

  const handleDownloadResult = () => {
    if (!resultCanvas) {
      return;
    }

    resultCanvas.toBlob((blob) => {
      if (!blob) {
        setErrorMessage('Kunne ikke generere PNG-filen for nedlasting.');
        return;
      }

      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const originalName = originalFileNameRef.current || 'bilde';
      const extensionIndex = originalName.lastIndexOf('.');
      const baseName = extensionIndex > 0 ? originalName.slice(0, extensionIndex) : originalName;

      link.href = downloadUrl;
      link.download = `${baseName}-uten-bakgrunn.png`;
      link.click();

      URL.revokeObjectURL(downloadUrl);
    }, 'image/png');
  };

  const handleImageSelected = async (file) => {
    setErrorMessage('');
    setResultCanvas(null);
    setIsProcessing(true);
    setIsModelLoading(false);
    shouldTriggerConfettiRef.current = selectedMode === MODES.PHOTO;
    hasTriggeredConfettiRef.current = false;

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = '';
    }

    try {
      const imageElement = await fileToImageElement(file);

      currentImageRef.current = imageElement;
      originalFileNameRef.current = file.name;

      if (selectedMode === MODES.WHITE_BG) {
        const canvas = removeWhiteBackground(imageElement);
        setResultCanvas(canvas);
        setIsProcessing(false);
        return;
      }

      const imageUrl = URL.createObjectURL(file);
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

        <div className="mx-auto w-full max-w-[600px] space-y-4">
          <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Modus</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-sky-300">
                <input
                  type="radio"
                  name="processing-mode"
                  value={MODES.PHOTO}
                  checked={selectedMode === MODES.PHOTO}
                  onChange={(event) => setSelectedMode(event.target.value)}
                  className="mt-1"
                />
                <span>
                  <span className="block font-medium text-slate-900">Foto/kompleks bakgrunn</span>
                  <span className="block text-sm text-slate-600">
                    Bruk ML-modellen for bilder med motiv og ujevn bakgrunn.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-sky-300">
                <input
                  type="radio"
                  name="processing-mode"
                  value={MODES.WHITE_BG}
                  checked={selectedMode === MODES.WHITE_BG}
                  onChange={(event) => setSelectedMode(event.target.value)}
                  className="mt-1"
                />
                <span>
                  <span className="block font-medium text-slate-900">Hvit bakgrunn (illustrasjon)</span>
                  <span className="block text-sm text-slate-600">
                    Fjerner lyse piksler direkte uten å bruke ML-modellen.
                  </span>
                </span>
              </label>
            </div>
          </section>

          <div className="w-full">
            {isProcessing ? (
              <div className="flex w-full items-center justify-center [&>div]:flex [&>div]:min-h-[260px] [&>div]:w-full [&>div]:max-w-xl [&>div]:items-center [&>div]:justify-center">
                <LoadingAnimation />
              </div>
            ) : (
              <ImageDropzone onImageSelected={handleImageSelected} />
            )}
          </div>
        </div>

        {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

        <div className="mx-auto w-full max-w-[480px] space-y-3">
          <h2 className="text-lg font-medium text-slate-900">Resultat</h2>
          <div ref={resultContainerRef} className="flex justify-center" />
          {resultCanvas ? (
            <button
              type="button"
              onClick={handleDownloadResult}
              className="w-full rounded-lg bg-blue-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            >
              Last ned PNG
            </button>
          ) : null}
        </div>
      </div>
    </main>
  );
}
