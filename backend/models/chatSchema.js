const mongoose = require("mongoose");


const deleteMessageFromMeSchema = new mongoose.Schema({
    id: { type: mongoose.Schema.Types.ObjectId, ref: "Message" }
}, { _id: false }); // _id: false because it's just a subdocument, no need for its own _id

// Main Message schema
const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    message: { type: String },
    status: { type: String, enum: ["delivered", "read"], default: "delivered" },
    deletedBy: [deleteMessageFromMeSchema],
    replyId: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },

}, { timestamps: true });

// Create the Message model
const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
