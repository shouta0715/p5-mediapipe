import './style.css';
import p5 from 'p5';
import {
  ResultsListener,
  SelfieSegmentation,
} from '@mediapipe/selfie_segmentation';
import { Camera } from '@mediapipe/camera_utils';

let segmentMask: p5.Image | null = null;
let segmentImage: p5.Image | null = null;
let selfieImage: p5.Graphics;
let p: p5;

const width = window.innerWidth;
const height = window.innerHeight;

// Webカメラ用video要素生成
const videoElement = document.createElement('video');
videoElement.className = 'input_video';
videoElement.style.display = 'none';
document.body.appendChild(videoElement);

// セルフィーセグメンテーションの結果ハンドラー
function onSelfieSegmentationResults(results: {
  segmentationMask: ImageBitmap;
  image: ImageBitmap;
}): ReturnType<ResultsListener> {
  const _segmentMaskBitMap = results.segmentationMask;
  const _segmentImageBitMap = results.image;

  if (_segmentImageBitMap && _segmentMaskBitMap && selfieImage) {
    const ctx = selfieImage.drawingContext as CanvasRenderingContext2D;
    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(_segmentMaskBitMap, 0, 0, width, height);
    ctx.globalCompositeOperation = 'source-in';
    ctx.drawImage(_segmentImageBitMap, 0, 0, width, height);
    ctx.restore();

    segmentMask = createImageFromBitmap(_segmentMaskBitMap);
    segmentImage = createImageFromBitmap(_segmentImageBitMap);
  }
}

// SelfieSegmentationインスタンス作成
const selfieSegmentation = new SelfieSegmentation({
  locateFile: (file: string) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1/${file}`;
  },
});

selfieSegmentation.setOptions({
  modelSelection: 1,
});
selfieSegmentation.onResults(onSelfieSegmentationResults as ResultsListener);

// カメラ設定
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await selfieSegmentation.send({ image: videoElement });
  },
  width,
  height,
});
camera.start();

// ImageBitmapからp5.Imageを生成するヘルパー関数
function createImageFromBitmap(bitmap: ImageBitmap): p5.Image {
  const imgG = p.createGraphics(bitmap.width, bitmap.height);
  (imgG.drawingContext as CanvasRenderingContext2D).drawImage(bitmap, 0, 0);
  const pImg = p.createImage(bitmap.width, bitmap.height);
  pImg.copy(
    imgG,
    0,
    0,
    bitmap.width,
    bitmap.height,
    0,
    0,
    bitmap.width,
    bitmap.height
  );
  return pImg;
}

const sketch = (_p: p5) => {
  p = _p;
  p.setup = () => {
    p.createCanvas(width, height);
    selfieImage = p.createGraphics(width, height);
  };

  p.draw = () => {
    p.background(255);

    p.push();

    // テストとして取得したsegmentMaskを小さく表示
    if (segmentMask && segmentImage) {
      p.image(segmentMask, 0, 0, width, height);
    }

    p.pop();
  };
};

const main = () => {
  new p5(sketch);
};

main();
