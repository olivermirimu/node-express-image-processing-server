/* eslint-disable quotes */
/* eslint-disable object-curly-spacing */
/* eslint-disable indent */

const path = require("path");
const { Worker, isMainThread } = require("worker_threads");
const pathToResizeWorker = path.resolve(__dirname, "resizeWorker.js");
const pathToMonochromeWorker = path.resolve(__dirname, "monochromeWorker.js");

const imageProcessor = (filename) => {
  const sourcePath = uploadPathResolver(filename);
  const resizedDestination = uploadPathResolver("resized-" + filename);
  const monochromeDestination = uploadPathResolver("monochrome-" + filename);

  let resizeWorkerFinished = false;
  let monochromeWorkerFinished = false;

  return new Promise((resolve, reject) => {
    if (isMainThread) {
      try {
        const resizeWorker = new Worker(pathToResizeWorker, {
          workerData: { source: sourcePath, destination: resizedDestination },
        });
        const monochromeWorker = new Worker(pathToMonochromeWorker, {
          workerData: {
            source: sourcePath,
            destination: monochromeDestination,
          },
        });

        resizeWorker
          .on("message", (message) => {
            resizeWorkerFinished = true;

            if (monochromeWorkerFinished) {
              resolve("resizeWorker finished processing");
            }
          })
          .on("error", (error) => reject(new Error(error.message)))
          .on("exit", (_code) => {
            if (_code != 0) {
              reject(new Error("Exited with status code " + _code));
            }
          });

        monochromeWorker
          .on("message", (message) => {
            monochromeWorkerFinished = true;
            if (resizeWorkerFinished) {
              resolve("monochromeWorker finished processing");
            }
          })
          .on("error", (error) => reject(new Error(error.message)))
          .on("exit", (_code) => {
            if (_code != 0) {
              reject(new Error("Exited with status code " + _code));
            }
          });
      } catch (_error) {
        reject(_error);
      }
    } else {
      reject(new Error("not on main thread"));
    }
  });
};

const uploadPathResolver = (filename) => {
  return path.resolve(__dirname, "../uploads", filename);
};

module.exports = imageProcessor;
