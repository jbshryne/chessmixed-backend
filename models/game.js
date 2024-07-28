const mongoose = require("../db/connection");
const { Schema, model } = mongoose;

const gameSchema = new Schema({
  playerWhite: {
    playerId: String || { ref: "User", type: mongoose.Schema.Types.ObjectId },
    displayName: String,
    username: String,
  },
  playerBlack: {
    playerId: String || { ref: "User", type: mongoose.Schema.Types.ObjectId },
    displayName: String,
    username: String,
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
