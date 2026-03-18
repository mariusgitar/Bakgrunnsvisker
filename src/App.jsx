import React from 'react';
import ImageDropzone from './components/ImageDropzone';

export default function App() {
  const handleImageSelected = (file) => {
    console.log('Valgt bildefil:', file.name);
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
      </div>
    </main>
  );
}
