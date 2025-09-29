const multer = require('multer')
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const cloudinary = require('./cloudinary')

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'Unify',
    allowed_formats: ['jpg', 'jpeg', 'png']
  }
})

module.exports = multer({ storage: storage })