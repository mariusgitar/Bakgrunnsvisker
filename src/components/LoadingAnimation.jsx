import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const ANIMATION_URL =
  'https://lottie.host/49f0784f-5abb-42c9-8949-22648bea47c8/l6k2QpWbi8.lottie';

export default function LoadingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
      <div className="flex h-[200px] w-[200px] items-center justify-center overflow-hidden">
        <DotLottieReact src={ANIMATION_URL} loop autoplay className="h-full w-full" />
      </div>
      <p className="mt-3 text-sm font-medium text-slate-600">Fjerner bakgrunn...</p>
    </div>
  );
}
