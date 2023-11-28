const mongoose = require("../db/connection");
const { Schema, model } = mongoose;

console.log("DATABASE_URL", process.env.DATABASE_URL);

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  displayName: { type: String, required: true },
  games: {
    playerWhite: [{ ref: "Game", type: mongoose.Schema.Types.ObjectId }],
    playerBlack: [{ ref: "Game", type: mongoose.Schema.Types.ObjectId }],
  },
});

const User = new model("User", userSchema);

module.exports = User;
