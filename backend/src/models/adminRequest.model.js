import mongoose from 'mongoose';

const adminRequestSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true
  },

  reason: {
    type: String,
    trim: true,
    maxlength: 300,
    default: ""
  },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },

  reviewAt: {
    type: Date
  }
}, { timestamps: true });

adminRequestSchema.index(
  { clerkId: 1 },
  { unique: true, partialFilterExpression: { statsu: "pending" }}
);

export const AdminRequest = mongoose.model("AdminRequest", adminRequestSchema);