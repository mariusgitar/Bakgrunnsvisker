/**
 * Converts a File object into a fully loaded HTMLImageElement.
 *
 * @param {File} file - The image file to load.
 * @returns {Promise<HTMLImageElement>} A promise that resolves with the loaded image element.
 */
export function fileToImageElement(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not load image file.'));
    };

    image.src = objectUrl;
  });
}

/**
 * Draws an image onto a canvas and applies a pixel alpha mask.
 *
 * @param {HTMLImageElement} imageElement - The loaded image element to draw.
 * @param {Uint8ClampedArray} maskData - Alpha values with one entry per image pixel.
 * @returns {HTMLCanvasElement} A canvas containing the masked image.
 */
export function applyMaskToCanvas(imageElement, maskData) {
  const canvas = document.createElement('canvas');
  const width = imageElement.naturalWidth || imageElement.width;
  const height = imageElement.naturalHeight || imageElement.height;

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');

  context.drawImage(imageElement, 0, 0, width, height);

  const imageData = context.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  for (let pixelIndex = 0; pixelIndex < maskData.length; pixelIndex += 1) {
    pixels[pixelIndex * 4 + 3] = maskData[pixelIndex];
  }

  context.putImageData(imageData, 0, 0);

  return canvas;
}
