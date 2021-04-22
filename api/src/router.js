/* eslint-disable quotes */
/* eslint-disable object-curly-spacing */
const express = require("express");
const multer = require("multer");
const path = require("path");
const imageProcessor = require("./imageProcessor");
// eslint-disable-next-line new-cap
const router = express.Router();
const photoPath = path.resolve(__dirname, "../../client/photo-viewer.html");
const filename = (request, file, callback) => {
  callback(null, file.originalname);
};

const storage = multer.diskStorage({
  destination: "api/uploads/",
  filename: filename,
});

const fileFilter = (request, file, callback) => {
  if (file.mimetype !== "image/png") {
    request.fileValidationError = "Wrong file type";
    callback(null, false, new Error("Wrong file type"));
  } else {
    callback(null, true);
  }
};

const upload = multer({ fileFilter, storage });

router.post("/upload", upload.single("photo"), async (req, res) => {
  try {
    await imageProcessor(req.file.filename);
    if (req.fileValidationError) {
      return res.status(400).json({ error: req.fileValidationError });
    }
    return res.status(201).json({ success: true });
  } catch (error) {}
});

router.get("/photo-viewer", (req, res) => {
  return res.sendFile(photoPath);
});

module.exports = router;
