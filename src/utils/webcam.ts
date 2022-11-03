import * as params from "./params";
export function isiOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

export function isMobile() {
  return isAndroid() || isiOS();
}
const $size = params.VIDEO_SIZE["640 X 480"];
/**
 * Class to handle webcam
 */
export class Webcam {
  canvas: any;
  video: any;
  ctx: any;
  constructor(video: any, canvas: any) {
    this.video = document.getElementById("video");
    this.canvas = document.getElementById("canvas");
    this.ctx = this.canvas.getContext("2d");
  }
  /**
   * Open webcam and stream it through video tag.
   * @param {React.MutableRefObject} videoRef video tag reference
   * @param {function} onLoaded callback function to be called when webcam is open
   */
  open = (videoRef: any, onLoaded: any, facingMode: string) => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          audio: false,
          video: {
            facingMode: facingMode,
            width: isMobile()
              ? params.VIDEO_SIZE["360 X 270"].width
              : $size.width,
            height: isMobile()
              ? params.VIDEO_SIZE["360 X 270"].height
              : $size.height,
          },
        })
        .then((stream) => {
          // @ts-ignore
          window.localStream = stream;
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            this.video.play();
            const videoWidth = this.video.videoWidth;
            const videoHeight = this.video.videoHeight;
            this.video.width = videoWidth;
            this.video.height = videoHeight;
  
            this.canvas.width = videoWidth;
            this.canvas.height = videoHeight;
            const canvasContainer = document.querySelector('.canvas-wrapper');
            // @ts-ignore
            canvasContainer.style = `width: ${videoWidth}px; height: ${videoHeight}px`;
  
            // 翻转视频
            // this.ctx.translate(this.video.videoWidth, 0);
            // this.ctx.scale(-1, 1);
            onLoaded();
           
          };
      
     
        });
    } else alert("Can't open Webcam!");
  };

  /**
   * Close opened webcam.
   * @param {React.MutableRefObject} videoRef video tag reference
   */
  close = (videoRef: any) => {
    if (videoRef.current.srcObject) {
      videoRef.current.srcObject = null;
      // @ts-ignore
      window.localStream.getTracks().forEach((track) => {
        track.stop();
      });
    } else alert("Please open Webcam first!");
  };
  drawCtx() {
    this.ctx.drawImage(
      this.video,
      0,
      0,
      this.video.videoWidth,
      this.video.videoHeight
    );
  }
  /**
   * 绘制手部关键点识别结果
   * @param hands
   */
  drawResults(hands: any) {
    // Sort by right to left hands.
    hands.sort((hand1: any, hand2: any) => {
      if (hand1.handedness < hand2.handedness) return 1;
      if (hand1.handedness > hand2.handedness) return -1;
      return 0;
    });

    // Pad hands to clear empty scatter GL plots.
    while (hands.length < 2) hands.push({});

    for (let i = 0; i < hands.length; ++i) {
      // Third hand and onwards scatterGL context is set to null since we
      // don't render them.
      const ctxt = null;
      this.drawResult(hands[i], ctxt);
    }
  }
  /**
   * 绘制手部关键点识别结果
   * @param hand A hand with keypoints to render.
   * @param ctxt Scatter GL context to render 3D keypoints to.
   */
  drawResult(hand: any, ctxt: any) {
    if (hand.keypoints != null) {
      this.drawKeypoints(hand.keypoints, hand.handedness);
    }
    // Don't render 3D hands after first two.
    if (ctxt == null) {
      return;
    }
  }
  /**
   * 绘制手部关键点
   * @param keypoints
   * @param handedness
   */
  drawKeypoints(keypoints: any, handedness: any) {
    const keypointsArray = keypoints;
    this.ctx.fillStyle = handedness === "Left" ? "Red" : "Blue";
    this.ctx.strokeStyle = "White";
    this.ctx.lineWidth = params.DEFAULT_LINE_WIDTH;

    for (let i = 0; i < keypointsArray.length; i++) {
      const y = keypointsArray[i].x;
      const x = keypointsArray[i].y;
      this.drawPoint(x - 2, y - 2, 3);
    }

    const fingers = Object.keys(params.fingerLookupIndices);
    for (let i = 0; i < fingers.length; i++) {
      const finger = fingers[i];
      // @ts-ignore
      const points = params.fingerLookupIndices[finger].map(
        (idx: any) => keypoints[idx]
      );
      this.drawPath(points, false);
    }
  }

  drawPath(points: any, closePath: any) {
    const region = new Path2D();
    region.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      region.lineTo(point.x, point.y);
    }

    if (closePath) {
      region.closePath();
    }
    this.ctx.stroke(region);
  }

  drawPoint(y: number, x: number, r: number) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, 2 * Math.PI);
    this.ctx.fill();
  }
}
