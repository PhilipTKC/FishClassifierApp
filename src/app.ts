/* eslint-disable class-methods-use-this */
import { autoinject } from "aurelia-framework";
import dom from "./font-awesome/library";
import Classifier from "./services/classifier";

export type PredictionResults = {
  image: string;
  informationUrl: string;
  bestLabel: string;
  bestScore: number;
  allLabelsScores: (string | number)[][];
};

@autoinject
export default class App {
  private isModelLoaded = false;

  private results: PredictionResults[] = [];

  constructor(private readonly classifier: Classifier) {}

  attached(): void {
    dom.watch();
  }
}
