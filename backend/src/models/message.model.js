import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: String, required: true },
    receiverId: { type: String, required: true },
    type: { type: String, enum: ["text", "song"], default: "text" },
    content: {
      type: String,
      default: "",
      required: function () {
        return this.type === "text";
      },
    },
    song: { type: mongoose.Schema.Types.ObjectId, ref: "Song", default: null },
  },
  { timestamps: true },
);

messageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });

export const Message = mongoose.model("Message", messageSchema);
