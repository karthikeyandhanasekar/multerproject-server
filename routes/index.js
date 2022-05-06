var express = require('express');
var router = express.Router();
require("dotenv").config()

const { GridFsStorage } = require('multer-gridfs-storage');
const { mongo, connection, } = require('mongoose');
const multer = require('multer');

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

    return new Promise((resolve, reject) => {
      const fileInfo = {
        filename: file.originalname,
        bucketName: 'GFSbucket' // a collection name
      };
      resolve(fileInfo);
    });
  }
});

const upload = multer({ storage: storage })

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});


router.post("/upload", upload.single('file'), async (req, res, next) => {

  // console.log(req.file);
})

router.get("/download/:filename", async (req, res, next) => {


  try {
    const files = [...await gfs.find({ filename: req.params.filename }).toArray()]
    console.log(files);


    res.set({
      "Accept-Ranges": "bytes",
      "Content-Disposition": `attachment; filename=${files[0].filename}`,
      "Content-Type": `${files[0].contentType}`
    });

    const readstream = gfs.openDownloadStreamByName(files[0].filename);
    readstream.pipe(res);
    // files?.map(file => {
    //   var readstream = gfs.openDownloadStream(file._id)
    //   res.set('Content-Type', file.mimetype);
    //   return readstream.pipe(res);
    // })
  } catch (error) {
    console.error(error.message);
  }

})

module.exports = router;
