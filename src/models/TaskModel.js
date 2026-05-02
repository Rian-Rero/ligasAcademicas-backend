import mongoose from 'mongoose';

import { COLLECTION_NAMES } from '../utils/general/constants.js';

const { ObjectId } = mongoose.Schema.Types;

const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxLength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
      required: true,
    },
    assignedTo: {
      type: ObjectId,
      ref: COLLECTION_NAMES.USER,
      required: true,
    },
    assignedBy: {
      type: ObjectId,
      ref: COLLECTION_NAMES.USER,
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
      required: true,
    },
    completedAt: {
      type: Date,
      required: false,
      default: null,
    },
    googleCalendarEventId: {
      type: String,
      required: false,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const TaskModel = mongoose.model(COLLECTION_NAMES.TASK, TaskSchema);
export default TaskModel;
