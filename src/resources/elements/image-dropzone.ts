import { bindable, customElement, autoinject } from "aurelia-framework";
import Dropzone from "dropzone";
import Classifier from "../../services/classifier";
import nProgress from "nprogress";

@autoinject
@customElement("image-dropzone")
export default class ImageDropZone {
  @bindable results: any;

  private dropZone: Dropzone;

  constructor(private readonly classifier: Classifier) {}

  attached(): void {
    Dropzone.autoDiscover = false;

    this.dropZone = new Dropzone("#dropzone", {
      autoProcessQueue: false,
      url: "/",
    });

    this.dropZone.on("addedfiles", async (files) => {
      nProgress.configure({ showSpinner: false }).start();
      await new Promise((resolve, reject) =>
        setTimeout(() => {
          resolve(null);
        }, 1000)
      );

      const results = [];
      for (const file of Array.from(files)) {
        const result = await this.classifier.startClassification((file as any).dataURL);
        results.push(result);
      }
      this.results = results;
      this.dropZone.removeAllFiles();
      nProgress.done();
    });
  }
}
