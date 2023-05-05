import { customElement, autoinject, bindable } from "aurelia-framework";
import Classifier from "../../services/classifier";

@autoinject
@customElement("hero")
export default class Hero {
  @bindable private isModelLoaded: boolean;

  private isModelLoading = false;

  constructor(private readonly classifier: Classifier) {}

  async loadModel(): Promise<void> {
    if (!this.isModelLoaded) {
      this.isModelLoading = true;
      await this.classifier.loadModel();
      this.isModelLoading = false;
      this.isModelLoaded = true;
    }
  }
}
