import p5 from 'p5';
import {
  FilesetResolver,
  ImageSegmenter,
  ImageSegmenterResult,
  ImageSegmenterCallback,
} from '@mediapipe/tasks-vision';

let lastWebcamTime = -1;
let segmentMask: p5.Image | null = null;
let previousMask: p5.Image | null = null;

const width = window.innerWidth;
const height = window.innerHeight;

const createImageSegmenter = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  );

  return await ImageSegmenter.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite',
      delegate: 'GPU',
    },
    outputCategoryMask: true,
    runningMode: 'VIDEO',
  });
};

let p: p5;

const callbackForVideo: ImageSegmenterCallback = (
  result: ImageSegmenterResult
) => {
  if (!result.categoryMask) return;
  const maskResult = result.categoryMask;

  const mask: Float32Array = maskResult.getAsFloat32Array();

  const pImg = p.createImage(maskResult.width, maskResult.height);
  pImg.loadPixels();

  for (let y = 0; y < maskResult.height; y++) {
    for (let x = 0; x < maskResult.width; x++) {
      const index = y * maskResult.width + x;
      const pixelIndex = (y * maskResult.width + x) * 4;

      const maskVal = Math.round(mask[index] * 255.0);

      const blendedValue =
        previousMask && previousMask.pixels[pixelIndex]
          ? (maskVal + previousMask.pixels[pixelIndex]) / 2
          : maskVal;

      pImg.pixels[pixelIndex] = blendedValue; // R
      pImg.pixels[pixelIndex + 1] = blendedValue; // G
      pImg.pixels[pixelIndex + 2] = blendedValue; // B
      pImg.pixels[pixelIndex + 3] = 255; // A
    }
  }

  pImg.updatePixels();

  previousMask = pImg;
  segmentMask = pImg;
};

const sketch = (_p: p5) => {
  p = _p;
  let imageSegmenter: ImageSegmenter | null = null;
  let video: HTMLVideoElement | null = null;

  p.setup = async () => {
    p.createCanvas(width, height);
    imageSegmenter = await createImageSegmenter();

    const cap = p.createCapture('video');
    cap.size(width, height);
    cap.hide();
    video = cap.elt;
  };

  p.draw = () => {
    if (!video || !imageSegmenter || !video.videoWidth || !video.videoHeight)
      return;

    if (video.currentTime === lastWebcamTime) return;
    lastWebcamTime = video.currentTime;

    imageSegmenter.segmentForVideo(video, video.currentTime, callbackForVideo);

    if (segmentMask) {
      p.push();
      p.translate(p.width, 0);

      p.scale(-1, 1);
      p.image(segmentMask, 0, 0, width, height);
      p.pop();
    }
  };
};

const main = () => {
  new p5(sketch);
};

main();
