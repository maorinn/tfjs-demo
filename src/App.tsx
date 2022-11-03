import { useState, useEffect, useRef } from "react";
import reactLogo from "./assets/react.svg";
import * as tf from "@tensorflow/tfjs";
import { loadGraphModel } from "@tensorflow/tfjs-converter";
import "./style/App.css";
import { renderBoxes } from "./utils/renderBox";
import { Webcam } from "./utils/webcam";
import * as handdetection from "@tensorflow-models/hand-pose-detection";
import * as handPoseDetection from "@tensorflow-models/hand-pose-detection";
let detector: {
  estimateHands: (arg0: any, arg1: { flipHorizontal: boolean }) => any;
  dispose: () => void;
} | null = null;
let rafId;
// 是否开始加载模型
let isModelReady = false;
// TODO fix: 目标检测和手部检测 的预测结果会出现 两个 canvas 重叠的情况
function App() {
  const videoRef: any = useRef();
  const canvasRef: any = useRef();
  const [facingMode, setFacingMode] = useState("environment");
  const threshold = 0.3;
  let model = null;

  let webcam: any;
  const loadModel = async () => {
    // const model = await loadGraphModel(
    //   "https://raw.githubusercontent.com/Hyuto/yolov5-tfjs/master/public/yolov5n_web_model/model.json"
    // );
    // const model = await loadGraphModel(
    //   "./models/yolov5s_web_model/model.json"
    // );
    const model = await loadGraphModel("./models/belly_web_model/model.json");
    return model;
  };
  const process_input = (model: any) => {
    let [modelWidth, modelHeight] = model.inputs[0].shape.slice(1, 3);
    if (videoRef.current) {
      try {
        const input = tf.tidy(() => {
          return tf.image
            .resizeBilinear(tf.browser.fromPixels(videoRef.current), [
              modelWidth,
              modelHeight,
            ])
            .div(255.0)
            .expandDims(0);
        });
        return input;
      } catch (e) {
        console.log(e);
        return null;
      }
    } else {
      return null;
    }
  };
  const detectFrame = async (model: any) => {
    tf.engine().startScope();
    // 获取输入tensor
    const input = process_input(model);
    // 切换视频流，input可能会为空
    if (input) {
      // 执行模型推理
      await model.executeAsync(input).then((predictions: any) => {
        const [boxes, scores, classes] = predictions.slice(0, 3);
        const boxes_data = boxes.dataSync();
        const scores_data = scores.dataSync();
        const classes_data = classes.dataSync();
        // 渲染检测结果
        renderBoxes(
          canvasRef,
          threshold,
          boxes_data,
          scores_data,
          classes_data
        );
        tf.dispose(predictions);
      });
    }
    requestAnimationFrame(() => {
      input && input.dispose(); // 清除输入tensor
      detectFrame(model);
    });
    tf.engine().endScope();
  };
  const switchCamera = () => {
    webcam.close(videoRef);
    let newFacingMode = "";
    if (facingMode == "environment") {
      setFacingMode("user");
      newFacingMode = "user";
    } else {
      setFacingMode("environment");
      newFacingMode = "environment";
    }
    webcam.open(videoRef, () => {}, newFacingMode);
  };
  /**
   * 初始化 手部检测模型
   * @returns
   */
  const createDetector = async () => {
    const model = handPoseDetection.SupportedModels.MediaPipeHands;
    return handdetection.createDetector(model, {
      runtime: "mediapipe",
      modelType: "lite",
      maxHands: 2,
      solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/hands",
    });
  };
  const renderResult = async () => {
    if (webcam.video.readyState < 2) {
      await new Promise((resolve) => {
        webcam.video.onloadeddata = () => {
          resolve(webcam);
        };
      });
    }
    let hands = null;
    // Detector can be null if initialization failed (for example when loading
    // from a URL that does not exist).
    if (detector != null) {
      // Detectors can throw errors, for example when using custom URLs that
      // contain a model that doesn't provide the expected output.
      try {
        hands = await detector.estimateHands(videoRef.current, {
          flipHorizontal: false,
        });
      } catch (error) {
        detector.dispose();
        detector = null;
        alert(error);
      }
    }
    // The null check makes sure the UI is not in the middle of changing to a
    // different model. If during model change, the result is from an old model,
    // which shouldn't be rendered.
    if (hands && hands.length > 0) {
      webcam.drawResults(hands);
    }
  };
  const renderPrediction = async () => {
    if (!detector && !isModelReady) {
      isModelReady = true
      detector = await createDetector()
    }
    await renderResult();
    rafId = requestAnimationFrame(renderPrediction);
  };

  useEffect(() => {
    webcam = new Webcam(videoRef.current, canvasRef.current);
    loadModel().then(async (_model) => {
      // 预热
      const dummyInput = tf.ones(_model.inputs[0].shape as any);
      // @ts-ignore
      await _model.executeAsync(dummyInput).then((warmupResult: any) => {
        // 清除预热结果
        tf.dispose(warmupResult);
        tf.dispose(dummyInput);
        // 打开摄像头，之后开始检测
        webcam.open(videoRef, () => detectFrame(_model), facingMode);
      });
    });
    // // 加载手部检测模型
    renderPrediction();
  }, []);
  return (
    <div className="App">
      <h2>胰岛素场景医疗AI识别demo YOLOv5 & Tensorflow.js</h2>
      <p>Currently running model : YOLOv5</p>
      <div className="content">
        <video id="video" autoPlay playsInline muted ref={videoRef} />
        <canvas id="canvas" width={640} height={480} ref={canvasRef} />
        <button onClick={switchCamera}>切换摄像头</button>
      </div>
    </div>
  );
}

export default App;
