import mongoose from 'mongoose';

import isDevEnvironment from '../../../general/isDevEnvironment.js';
import cloudinary from '../../cloudinary/index.js';

const FileSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    sparse: true, // https://stackoverflow.com/questions/24524639/saving-mongoose-documents-with-empty-sub-documents-collections-results-in-duplic
  },
  url: {
    type: String,
    required: true,
  },
});

FileSchema.pre('save', function (next) {
  if (isDevEnvironment) {
    this.url = `/temp/uploads/${encodeURIComponent(this.key)}`;
  }
  next();
});

// Delete files in Cloudinary / dev uploads
FileSchema.pre('remove', function () {
  return cloudinary.deleteFile(this.key);
});
FileSchema.pre(
  'deleteOne',
  { document: true, query: false }, // More details on https://mongoosejs.com/docs/api/schema.html#schema_Schema-pre
  function () {
    return cloudinary.deleteFile(this.key);
  },
);
FileSchema.pre('deleteMany', async function () {
  const deletedFiles = await this.model.find(this.getFilter()).exec(); // More details on https://github.com/Automattic/mongoose/issues/9152#issuecomment-714522364

  return Promise.all(
    deletedFiles.map((file) => cloudinary.deleteFile(file.key)),
  );
});

export default FileSchema;
