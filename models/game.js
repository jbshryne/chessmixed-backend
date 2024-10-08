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
  pgn: String,
  gameTitle: String,
  povColor: { type: String, required: true, default: "w" },
  currentTurn: { type: String, required: true },
  captured: [
    {
      color: { type: String, required: true },
      type: { type: String, required: true },
    },
  ],
  difficulty: { type: Number, default: NaN },
  // notes: [String],
});

const Game = new model("Game", gameSchema);

module.exports = Game;
