import { pipeline } from '@huggingface/transformers';

const MODEL_ID = 'briaai/RMBG-1.4';
const TASK = 'image-segmentation';

let segmenterPromise;

async function getSegmenter() {
  if (!segmenterPromise) {
    self.postMessage({ type: 'LOADING' });
    segmenterPromise = pipeline(TASK, MODEL_ID).catch((error) => {
      segmenterPromise = undefined;
      throw error;
    });
  }

  return segmenterPromise;
}

function extractMaskData(segmentationResult) {
  const results = Array.isArray(segmentationResult)
    ? segmentationResult
    : [segmentationResult];

  const primaryResult = results.find((result) => result?.mask) ?? results[0];
  const rawMaskData = primaryResult?.mask?.data;

  if (!rawMaskData) {
    throw new Error('Fikk ikke ut maskedata fra segmenteringsresultatet.');
  }

  return rawMaskData;
}

self.onmessage = async (event) => {
  const { type, imageUrl } = event.data ?? {};

  if (type !== 'REMOVE_BG') {
    return;
  }

  if (!imageUrl) {
    self.postMessage({
      type: 'ERROR',
      error: 'Mangler bildeadresse for bakgrunnsfjerning.',
    });
    return;
  }

  try {
    const segmenter = await getSegmenter();
    const segmentationResult = await segmenter(imageUrl);
    const maskData = extractMaskData(segmentationResult);

    self.postMessage({
      type: 'RESULT',
      maskData,
    });
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      error: error instanceof Error ? error.message : 'Ukjent feil under bakgrunnsfjerning.',
    });
  }
};
