import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import { Howl, Howler } from "howler";
import * as knnClassifier from "@tensorflow-models/knn-classifier";
import { initNotifications, notify } from "@mycv/f8-notification";
// import "@tensorflow/tfjs-backend-webgl";
// import "@tensorflow/tfjs-backend-cpu";
import soundURL from "./assest/hey_sondn.mp3";
const mobilenet = require("@tensorflow-models/mobilenet");

// Setup the new Howl.
const sound = new Howl({
  src: [soundURL],
});

// Play the sound.

// // Change global volume.
// Howler.volume(0.5);

const NOT_TOUCH_LABEL = "not_touch";
const TOUCHED_LABEL = "touched";
const TRAINING_TIMES = 50;
const TOUCHED_CONFIDENCE = 0.8; // muc tin tuong(0-1)
function App() {
  const video = useRef();
  const classifier = useRef();
  const mobilenetModule = useRef();
  const [touched, setTouched] = useState(false);
  const init = async () => {
    await setupcamera();

    console.log("setup camera thanh cong");
    classifier.current = knnClassifier.create();
    mobilenetModule.current = await mobilenet.load();
    console.log("khong cham tay len mat va bam train 1");

    initNotifications({ cooldown: 3000 });
  };

  const setupcamera = () => {
    return new Promise((resolve, reject) => {
      navigator.getUserMedia =
        navigator.getUserMedia ||
        navigator.webkitGetUsermedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;
      if (navigator.getUserMedia) {
        navigator.getUserMedia(
          {
            video: true,
          },
          (stream) => {
            video.current.srcObject = stream;
            video.current.addEventListener("loadeddata", resolve);
          },
          (error) => reject(error)
        );
      } else {
        reject();
      }
    });
  };

  const train = async (label) => {
    console.log(`${label} dang train`);
    for (let i = 0; i < TRAINING_TIMES; ++i) {
      console.log(`Progress ${((i + 1) / TRAINING_TIMES) * 100}%`);
      await training(label);
    }
  };

  const training = (label) => {
    return new Promise(async (resolve) => {
      const embedding = mobilenetModule.current.infer(video.current, true);
      classifier.current.addExample(embedding, label);
      await sleep(100);
      resolve();
    });
  };

  const run = async () => {
    const embedding = mobilenetModule.current.infer(video.current, true);
    const result = await classifier.current.predictClass(embedding);
    if (
      result.label === TOUCHED_LABEL &&
      result.confidences[result.label] > TOUCHED_CONFIDENCE
    ) {
      console.log("Touched");
      sound.play();
      notify("Bo tay ra khỏi mặt", { body: "Bạn vừa chạm tay vào mặt" });
      setTouched(true);
    } else {
      console.log("not touched");
      setTouched(false);
    }
    await sleep(200);
    run();
  };

  const sleep = (ms = 0) => {
    // ms :mini giay
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  useEffect(() => {
    init();

    return () => {};
  }, []);
  return (
    <div className={`main ${touched ? "touched" : ""}`}>
      <video ref={video} className="video" autoPlay />
      <div className="control">
        <button className="btn" onClick={() => train(NOT_TOUCH_LABEL)}>
          Train 1
        </button>
        <button className="btn" onClick={() => train(TOUCHED_LABEL)}>
          Train 2
        </button>
        <button className="btn" onClick={() => run()}>
          run
        </button>
      </div>
    </div>
  );
}

export default App;
