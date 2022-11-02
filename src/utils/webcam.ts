/**
 * Class to handle webcam
 */
export class Webcam {
  /**
   * Open webcam and stream it through video tag.
   * @param {React.MutableRefObject} videoRef video tag reference
   * @param {function} onLoaded callback function to be called when webcam is open
   */
  open = (videoRef:any, onLoaded:any) => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          audio: false,
          video: {
            facingMode: "environment",
          },
        })
        .then((stream) => {
          // @ts-ignore
          window.localStream = stream;
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            onLoaded();
          };
        });
    } else alert("Can't open Webcam!");
  };

  /**
   * Close opened webcam.
   * @param {React.MutableRefObject} videoRef video tag reference
   */
  close = (videoRef:any) => {
    if (videoRef.current.srcObject) {
      videoRef.current.srcObject = null;
      // @ts-ignore
      window.localStream.getTracks().forEach((track) => {
        track.stop();
      });
    } else alert("Please open Webcam first!");
  };
}
