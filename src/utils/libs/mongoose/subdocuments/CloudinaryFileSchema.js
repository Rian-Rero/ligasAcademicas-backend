import mongoose from 'mongoose';

const CloudinaryFileSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, versionKey: false },
);

export default CloudinaryFileSchema;
