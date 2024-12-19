import p5 from 'p5';
import {
  FilesetResolver,
  ImageSegmenter,
  ImageSegmenterResult,
  ImageSegmenterCallback,
} from '@mediapipe/tasks-vision';

let lastWebcamTime = -1;
let segmentMask: p5.Image | null = null;

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
  // TODO: 画像に変換する。
};

// p5.jsスケッチ
const sketch = (_p: p5) => {
  p = _p;
  let imageSegmenter: ImageSegmenter | null = null;

  let video: HTMLVideoElement | null = null;

  let videoTime = -1;
  p.setup = async () => {
    p.createCanvas(width, height);

    imageSegmenter = await createImageSegmenter();
    const cap = p.createCapture('video');
    cap.hide();
    video = cap.elt;
  };

  p.draw = async () => {
    p.background(255);
    if (!video) return;
    if (!imageSegmenter) return;
    if (!video.videoWidth || !video.videoWidth) return;
    if (video.currentTime === videoTime) return;

    lastWebcamTime = video.currentTime;

    imageSegmenter.segmentForVideo(video, video.currentTime, callbackForVideo);
    videoTime = video.currentTime;

    if (segmentMask) {
      p.image(segmentMask, 0, 0, width, height);
    }
  };
};

const main = () => {
  new p5(sketch);
};

main();
