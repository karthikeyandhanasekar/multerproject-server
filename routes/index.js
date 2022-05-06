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

module.exports = router;
