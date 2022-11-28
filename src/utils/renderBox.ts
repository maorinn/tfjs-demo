import labels from "./labels_yolov5s.json";

/**
 * Render prediction boxes
 * @param {React.MutableRefObject} canvasRef canvas tag reference
 * @param {number} threshold threshold number
 * @param {Array} boxes_data boxes array
 * @param {Array} scores_data scores array
 * @param {Array} classes_data class array
 */
export const renderBoxes = (
  canvasRef: any,
  threshold: any,
  boxes_data: any,
  scores_data: any,
  classes_data: string[],
  currentHandPoit?: { x: number; y: number }
) => {
  const ctx = canvasRef.current.getContext("2d");
  // ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // clean canvas
  const _labels = labels as any;
  // font configs
  const font = "18px sans-serif";
  ctx.font = font;
  ctx.textBaseline = "top";
  
  for (let i = 0; i < scores_data.length; ++i) {
    if (scores_data[i] > threshold) {
      const klass = _labels[classes_data[i]];
      const score = (scores_data[i] * 100).toFixed(1);

      let [x1, y1, x2, y2] = boxes_data.slice(i * 4, (i + 1) * 4);
 
      x1 *= canvasRef.current.width;
      x2 *= canvasRef.current.width;
      y1 *= canvasRef.current.height;
      y2 *= canvasRef.current.height;
      const width = x2 - x1;
      const height = y2 - y1;
      // 判断大拇指是否在矩形内
      if (
        currentHandPoit &&
        currentHandPoit.x > x1 &&
        currentHandPoit.x < x2 &&
        currentHandPoit.y > y1 &&
        currentHandPoit.y < y2
      ) {
        ctx.fillStyle = "#ff0087";
        ctx.strokeStyle = "#ff0087";
        console.log("移动到了关键区域！！！！！！！！！！！！！！");
        
      } else {
        ctx.strokeStyle = "#00FF00";
        ctx.fillStyle = "#00FF00";
      }
      // Draw the bounding box.

      ctx.lineWidth = 3;
      ctx.strokeRect(x1, y1, width, height);

      // Draw the label background.

      const textWidth = ctx.measureText(klass + " - " + score + "%").width;
      const textHeight = parseInt(font, 10); // base 10
      ctx.fillRect(
        x1 - 1,
        y1 - (textHeight + 2),
        textWidth + 2,
        textHeight + 2
      );

      // Draw labels
      ctx.fillStyle = "#ffffff";
      ctx.fillText(klass + " - " + score + "%", x1 - 1, y1 - (textHeight + 2));
    }
  }
};
