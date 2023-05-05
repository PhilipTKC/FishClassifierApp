/* eslint-disable class-methods-use-this */
import { Tensor, InferenceSession } from "onnxjs";
import ndarray from "ndarray";
import * as ops from "ndarray-ops";
import { argMax } from "../utils/utility";
import fishTypes from "../common/fishTypes";

export type PredictionResponse = {
  allLabelsScores?: (string | number)[][];
  bestLabel?: string;
  bestScore?: number;
  classLabels: string[];
  dataURL: string;
  highestProbabilityIndex: number;
  informationUrl?: string;
  predictions: number[];
};

const imageHeight = 224;
const imageWidth = 224;

export default class Classifier {
  private canvas = document.createElement("canvas");

  private classLabels =
    "albacore australian_herring australian_salmon big_eye_tuna bream flathead flounder gurnard snapper yellowtail_kingfish";

  private ctx = this.canvas.getContext("2d");

  private onnxSession: InferenceSession = new InferenceSession({});

  private sessionIniailized = false;

  getImageData(
    imageStr: string
  ): Promise<{ imageData: ImageData; dataURL: string }> {
    this.canvas.width = imageWidth;
    this.canvas.height = imageHeight;

    return new Promise(async (resolve, reject) => {
      const image = new Image();

      image.onerror = (err) => {
        reject(err);
      };

      image.onload = () => {
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const imageAspectRatio = image.width / image.height;
        const canvasAspectRatio = this.canvas.width / this.canvas.height;
        let renderableHeight: number;
        let renderableWidth: number;
        let xStart: number;
        let yStart: number;

        if (imageAspectRatio < canvasAspectRatio) {
          renderableHeight = this.canvas.height;
          renderableWidth = image.width * (renderableHeight / image.height);
          xStart = (this.canvas.width - renderableWidth) / 2;
          yStart = 0;
        } else if (imageAspectRatio > canvasAspectRatio) {
          renderableWidth = this.canvas.width;
          renderableHeight = image.height * (renderableWidth / image.width);
          xStart = 0;
          yStart = (this.canvas.height - renderableHeight) / 2;
        } else {
          renderableHeight = this.canvas.height;
          renderableWidth = this.canvas.width;
          xStart = 0;
          yStart = 0;
        }

        this.ctx.drawImage(
          image,
          xStart,
          yStart,
          renderableWidth,
          renderableHeight
        );

        const imageData = this.ctx.getImageData(0, 0, imageWidth, imageHeight);

        const dataURL = this.canvas.toDataURL();

        resolve({ imageData, dataURL });
      };

      image.src = imageStr;
    });
  }

  realignImageDataForInference(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ): ndarray.Data<number> {
    // Preprocess raw image data to match SageMaker's image classifier expected shape
    // re-aligning the imageData from [224*224*4] to the correct dimension [1*3*224*224]
    const dataFromImage = ndarray(new Float32Array(data), [width, height, 4]);
    const dataProcessed = ndarray(new Float32Array(width * height * 3), [
      1,
      3,
      height,
      width,
    ]);
    ops.assign(
      dataProcessed.pick(0, 0, null, null),
      dataFromImage.pick(null, null, 0)
    );
    ops.assign(
      dataProcessed.pick(0, 1, null, null),
      dataFromImage.pick(null, null, 1)
    );
    ops.assign(
      dataProcessed.pick(0, 2, null, null),
      dataFromImage.pick(null, null, 2)
    );

    return dataProcessed.data;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  makeResponse(predictions, dataURL: string): PredictionResponse {
    const highestProbabilityIndex: number = argMax(predictions);
    let labels: string[] = this.classLabels.split(" ");
    labels.sort();

    return {
      bestLabel: labels[highestProbabilityIndex],
      bestScore: Number(predictions[highestProbabilityIndex]) * 100,
      classLabels: labels,
      dataURL,
      highestProbabilityIndex,
      informationUrl: fishTypes[labels[highestProbabilityIndex]],
      predictions,
    };
  }

  async loadModel(): Promise<void> {
    if (!this.sessionIniailized) {
      await this.onnxSession.loadModel(
        "https://dl.dropboxusercontent.com/s/xtebcyu1y5l2sj6/fish_model.onnx"
      );
      this.sessionIniailized = true;
    }
  }

  async startClassification(image: any): Promise<PredictionResponse> {
    const { imageData, dataURL } = await this.getImageData(image);
    const preprocessedData: ndarray.Data<number> = this.realignImageDataForInference(
      imageData.data,
      imageWidth,
      imageHeight
    );

    const inputTensor = new Tensor(
      preprocessedData as Float32Array,
      "float32",
      [1, 3, imageWidth, imageHeight]
    );

    const outputMap = await this.onnxSession.run([inputTensor]);
    const outputTensor = outputMap.values().next().value.data;
    return this.makeResponse(Array.from(outputTensor), dataURL);
  }
}
