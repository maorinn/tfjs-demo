import { useState, useEffect, useRef } from "react";
import reactLogo from "./assets/react.svg";
import * as tf from "@tensorflow/tfjs";
import { loadGraphModel } from "@tensorflow/tfjs-converter";
import "./style/App.css";
import { renderBoxes } from "./utils/renderBox";
import { Webcam } from "./utils/webcam";
function App() {
  const videoRef: any = useRef();
  const canvasRef: any = useRef();
  const [facingMode, setFacingMode] = useState("environment");
  const threshold = 0.70;
  let model = null;
  const webcam = new Webcam();
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
      }catch(e){
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

  useEffect(() => {
    loadModel().then(async (_model) => {
      // 预热
      const dummyInput = tf.ones(_model.inputs[0].shape as any);
      await _model.executeAsync(dummyInput).then((warmupResult: any) => {
        // 清除预热结果
        tf.dispose(warmupResult);
        tf.dispose(dummyInput);
        // 打开摄像头，之后开始检测
        webcam.open(videoRef, () => detectFrame(_model), facingMode);
      });
    });
  }, []);
  return (
    <div className="App">
      <h2>胰岛素场景医疗AI识别demo YOLOv5 & Tensorflow.js</h2>
      <p>Currently running model : YOLOv5</p>
      <div className="content">
        <video autoPlay playsInline muted ref={videoRef} />
        <canvas width={640} height={640} ref={canvasRef} />
        <button onClick={switchCamera}>切换摄像头</button>
      </div>
    </div>
  );
}

export default App;
