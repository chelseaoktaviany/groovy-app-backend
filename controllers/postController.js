const multer = require('multer');
const sharp = require('sharp');

const path = require('path');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const factory = require('./handleFactory');

const Post = require('../models/postModel');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/posts/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `post-${Date.now()}${ext}`);
  },
});

// multer filter
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(new AppError('Mohon upload gambar post', 400), false);
  }
};

// using multer middleware multi-part form data (upload pics)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 2 },
});

// upload user photo
exports.uploadPostImage = upload.single('postImage');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllPosts = factory.getAll(
  Post,
  'Berhasil memperoleh semua data post'
);

exports.getPost = factory.getOne(
  Post,
  { path: '_id' },
  'Berhasil memperoleh sebuah data post'
);

exports.createPost = catchAsync(async (req, res, next) => {
  const filteredBody = filterObj(req.body, 'postTitle', 'postDescription');

  const postImage = req.file.path.replace(/\\/g, '/');

  const outputPath = path
    .join('uploads', 'posts', `resized-${req.file.filename}`)
    .replace(/\\/g, '/');

  sharp(postImage).resize({ width: 500, height: 500 }).toFile(outputPath);

  const newPost = await Post.create({
    postTitle: filteredBody.postTitle,
    postDescription: filteredBody.postDescription,
    postImage: outputPath,
  });

  res.status(201).json({
    status: 0,
    msg: 'Berhasil menambahkan data post',
    data: newPost,
  });
});

exports.updatePost = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const filteredBody = filterObj(req.body, 'postTitle', 'postDescription');

  const postImage = req.file.path.replace(/\\/g, '/');
  const outputPath = path
    .join('uploads', 'posts', `resized-${req.file.filename}`)
    .replace(/\\/g, '/');

  sharp(postImage).resize({ width: 500, height: 500 }).toFile(outputPath);

  const post = await Post.findByIdAndUpdate(
    id,
    {
      postTitle: filteredBody.postTitle,
      postDescription: filteredBody.postDescription,
      postImage: outputPath,
    },
    { new: true, runValidators: true }
  );

  await post.save({ validateBeforeSave: false });

  res.status(201).json({
    status: 0,
    msg: 'Berhasil mengubah data post',
    data: post,
  });
});

exports.deletePost = factory.deleteOne(
  Post,
  'Berhasil menghapus sebuah data post'
);
