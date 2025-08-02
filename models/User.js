const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 50,
  },
  group: {
    type: String,
    required: true,
    enum: ["Red", "Blue", "Black", "Orange"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure unique names
userSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model("User", userSchema);