const mongoose = require("../db/connection");
const { Schema, model } = mongoose;

const gameSchema = new Schema({
  playerWhite: {
    ref: "User",
    type: mongoose.Schema.Types.ObjectId,
  },
  playerBlack: {
    ref: "User",
    type: mongoose.Schema.Types.ObjectId,
  },
  fen: { type: String, required: true },
  gameTitle: String,
  currentTurn: { type: String, required: true },
  capturedWhite: [String],
  capturedBlack: [String],
  // moveHistory: [String],
  // notes: [String],
  // difficultyLevel: String,
});

const Game = new model("Game", gameSchema);

module.exports = Game;
