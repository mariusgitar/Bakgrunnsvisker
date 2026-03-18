import React, { useRef, useState } from 'react';

export default function ImageDropzone({ onImageSelected }) {
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      return;
    }

    setFileName(file.name);
    onImageSelected?.(file);
  };

  const handleInputChange = (event) => {
    const [file] = event.target.files ?? [];
    handleFile(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    const [file] = event.dataTransfer.files ?? [];
    handleFile(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />
      <button
        type="button"
        onClick={openFilePicker}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex w-full max-w-xl cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition ${
          isDragging
            ? 'border-sky-500 bg-sky-50 text-sky-700'
            : 'border-slate-300 bg-slate-50 text-slate-700 hover:border-sky-400 hover:bg-sky-50'
        }`}
      >
        <span className="text-lg font-semibold text-slate-900">Dra og slipp et bilde her</span>
        <span className="mt-2 text-sm text-slate-600">
          Eller klikk for å velge en bildefil fra enheten din
        </span>
      </button>
      <p className="text-sm text-slate-600">
        {fileName ? `Valgt fil: ${fileName}` : 'Ingen fil valgt ennå'}
      </p>
    </div>
  );
}
