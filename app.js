import gaze from "gaze-detection";
import { Rive } from "@rive-app/canvas";
import * as HandDetection from "@tensorflow-models/hand-pose-detection";
import LookRiveFile from "data-url:./look.riv";
import HandsRiveFile from "data-url:./hands.riv";

async function main() {
  const videoElement = document.querySelector("video");
  const videoCanvas = document.getElementById("video-canvas");
  const riveCanvas = document.getElementById("rive-canvas");
  const videoCtx = videoCanvas.getContext("2d");

  // const OFFSCREEN_GAZES = ["RIGHT", "LEFT"];

  const riveInstance = new Rive({
    // src: LookRiveFile,
    src: HandsRiveFile,
    autoplay: true,
    canvas: riveCanvas,
    stateMachines: "State Machine 1",
    onLoad: async () => {
      // const isStaringInput =
      //   riveInstance.stateMachineInputs("State Machine 1")[0];
      const inputs = riveInstance.stateMachineInputs("State Machine 1");
      const isLeftInput = inputs.filter((input) => input.name === "isLeft")[0];
      const isRightInput = inputs.filter(
        (input) => input.name === "isRight"
      )[0];

      console.log(isLeftInput, isRightInput);

      const initGaze = async () => {
        // await gaze.loadModel();
        const handsModel = HandDetection.SupportedModels.MediaPipeHands;
        const detectorConfig = {
          runtime: "mediapipe", // or 'tfjs',
          solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/hands",
          modelType: "full",
        };
        const detector = await HandDetection.createDetector(
          handsModel,
          detectorConfig
        );

        await gaze.setUpCamera(videoElement);
        videoCtx.translate(500, 0);
        videoCtx.scale(-1, 1);

        const predict = async () => {
          const handsData = await detector.estimateHands(videoElement, {
            flipHorizontal: true,
          });
          if (handsData.length === 0) {
            isLeftInput.value = false;
            isRightInput.value = false;
          } else if (
            handsData.length === 1 &&
            handsData[0].handedness === "Left" &&
            handsData[0].score >= 0.94
          ) {
            console.log("HIT LEFT", isLeftInput);
            isLeftInput.value = true;
            isRightInput.value = false;
          } else if (
            handsData.length === 1 &&
            handsData[0].handedness === "Right" &&
            handsData[0].score >= 0.94
          ) {
            console.log("HIT RIGHT");
            isLeftInput.value = false;
            isRightInput.value = true;
          } else if (
            handsData.length === 2 &&
            handsData[0].score >= 0.94 &&
            handsData[1].score >= 0.94
          ) {
            isLeftInput.value = true;
            isRightInput.value = true;
          }
          // Returns TOP, CENTER, LEFT, RIGHT
          // const gazePrediction = await gaze.getGazePrediction();
          // if (OFFSCREEN_GAZES.indexOf(gazePrediction) > -1) {
          //   // toggle isStaring to true
          //   isStaringInput.value = true;
          // } else {
          //   isStaringInput.value = false;
          //   // toggle isStaring to false
          // }
          videoCtx.drawImage(
            videoElement,
            0,
            0,
            videoElement.videoWidth,
            videoElement.videoHeight
          );

          requestAnimationFrame(predict);
        };
        await predict();
      };
      await initGaze();
    },
  });
}

main();
