var express = require('express');
var router = express.Router();
require("dotenv").config()

const { GridFsStorage } = require('multer-gridfs-storage');
const { mongo, connection, } = require('mongoose');
const multer = require('multer');
const e = require('express');

let gfs

//GFSBUCKET
connection.once("open", () => {
  gfs = new mongo.GridFSBucket(connection.db, {
    bucketName: 'GFSbucket' // a bucket collection name
  });
})
const storage = new GridFsStorage({
  url: process.env.MONGODB_URL,
  file: (req, file) => {
    console.log(file);
    return new Promise((resolve, reject) => {
      const fileInfo = {
        filename: file.originalname.replaceAll(" ", "-"),
        bucketName: 'GFSbucket' // a collection name
      };
      resolve(fileInfo);
    });
  }
});

const upload = multer({ storage: storage })

/* GET home page. */
router.get("/", async (req, res, next) => {
  try {
    const files = await gfs.find().toArray()
    res.send([...new Set(files.map(ele => ele.filename))])

  } catch (error) {
    console.error(error.message);
  }
})
router.get('/:filename', async (req, res, next) => {
  try {
    const files = await gfs.find({ filename: req.params.filename }).toArray()
    console.log(files[0]);
    res.set({
      "Accept-Ranges": "bytes",
      "Content-Disposition": `attachment; filename=${files[0].filename}`,
      "Content-Type": `${files[0].contentType}`
    });

    const readstream = gfs.openDownloadStreamByName(files[0].filename);
    readstream.pipe(res)
  }
  catch (error) {
    console.log(error.message);
  }
});


router.post("/upload", upload.single('file'), async (req, res, next) => {


  // console.log(req.file);
})


router.post("/multipleupload", upload.array("file", 10), async (req, res, next) => {


  // console.log(req.file);
})


router.get("/download/:filename", async (req, res, next) => {


  try {
    const files = [...await gfs.find({ filename: req.params.filename.replaceAll(" ", "-") }).toArray()]
    res.set({
      "Accept-Ranges": "bytes",
      "Content-Disposition": `attachment; filename=${files[0].filename}`,
      "Content-Type": `${files[0].contentType}`
    });

    const readstream = gfs.openDownloadStreamByName(files[0].filename);
    readstream.pipe(res);
    res.json({
      filename: files[0].filename
    })
  } catch (error) {
    console.error(error.message);
  }

})

module.exports = router;
