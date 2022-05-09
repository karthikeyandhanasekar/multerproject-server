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

//implement gfs bucket storage in multer system
const upload = multer({ storage: storage })

router.get("/", async (req, res, next) => {
  try {


    const files = await gfs.find().toArray()
    // send filenames to client
    res.send([...new Set(files.map(ele => ele.filename))])

  } catch (error) {
    console.error(error.message);
  }
})

// route to upload single files
router.post("/upload", upload.single('file'), async (req, res, next) => {

  console.log(req.file);

  //send status if process is success
  req.file && res.json({
    status: true
  })

})


//route for multiple file upload
router.post("/multipleupload", upload.array("file", 10), async (req, res, next) => {


  console.log(req.files);

  //send status if process is success
  req.files && res.json({
    status: true
  })

})


// route to get specific file content
router.get("/download/:filename", async (req, res, next) => {


  try {
    const files = [...await gfs.find({ filename: req.params.filename.replaceAll(" ", "-") }).toArray()]
    res.set({
      "Accept-Ranges": "bytes",
      "Content-Disposition": `attachment; filename=${files[0].filename}`,
      "Content-Type": `${files[0].contentType}`
    });

    const readstream = gfs.openDownloadStreamByName(files[0].filename);

    readstream.on('data', (chunk) => {
      res.write(chunk);

    });

    readstream.on('error', () => {
      res.sendStatus(404);
    });

    readstream.on('end', () => {
      res.end();

    });
  } catch (error) {
    console.error(error.message);
  }

})

module.exports = router;
