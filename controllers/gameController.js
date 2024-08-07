const express = require("express");
const router = express.Router();
require("dotenv").config();
const User = require("../models/user");
const Game = require("../models/game");

// index route
router.post("/", async (req, res) => {
  const user = await User.findById(req.body.userId).populate("games");
  res.json(user.games);
});

// connection route
router.get("/hi", async (req, res) => {
  res.json({ userId: req.session.userId });
});

// seed route
router.post("/seed", async (req, res) => {
  const currentUser = req.body.currentUser;

  const seededGames = await Game.create([
    {
      playerWhite: {
        playerId: currentUser._id,
        displayName: currentUser.displayName,
        username: currentUser.username,
      },
      currentTurn: "w",
      fen: "rnbq1b1r/1ppPkppp/7n/8/8/p4N2/PPPBPPPP/RN1QKB1R w KQkq - 0 1",
      capturedWhite: [],
      capturedBlack: [],
    },
    {
      playerBlack: {
        playerId: currentUser._id,
        displayName: currentUser.displayName,
        username: currentUser.username,
      },
      currentTurn: "w",
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      capturedWhite: [],
      capturedBlack: [],
    },
  ]);

  const seededGameIds = [];
  seededGames.forEach((game) => seededGameIds.push(game._id));

  await User.findByIdAndUpdate(
    currentUser._id,
    { $set: { games: seededGameIds } },
    { new: true }
  );
});

// delete route
router.delete("/delete", async (req, res) => {
  const { gameId } = req.body;
  const game = await Game.findById(gameId);

  const result = await Game.findByIdAndDelete(gameId);

  if (result) {
    if (game.playerWhite.playerId !== "cpu") {
      const whitePlayer = await User.findById(game.playerWhite.playerId);
      const whitePlayerGames = await User.findByIdAndUpdate(
        whitePlayer._id,
        { $pull: { games: gameId } },
        { new: true }
      );
    }
    if (game.playerBlack.playerId !== "cpu") {
      const blackPlayer = await User.findById(game.playerBlack.playerId);
      const blackPlayerGames = await User.findByIdAndUpdate(
        blackPlayer._id,
        { $pull: { games: gameId } },
        { new: true }
      );
    }
    res.json({ success: true });
  }
});

// update route (main)
router.put("/:id", async (req, res) => {
  const update = await Game.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true,
  });

  res.json(update);
});

// // update route (move)
let moveUpdateTimeout = null;
router.put("/:id/move", async (req, res) => {
  const { gameId, fen, currentTurn, validMoves, cpuOpponentColor } = req.body;

  console.log("move update route hit");
  console.log("current turn:", currentTurn);
  console.log("fen:", fen);
  // prevent server getting flooded w/ updates
  if (moveUpdateTimeout) {
    clearTimeout(moveUpdateTimeout);
  }

  moveUpdateTimeout = setTimeout(async () => {
    await Game.findOneAndUpdate(
      { _id: gameId },
      { fen: fen, currentTurn },
      {
        new: true,
      }
    );
    // res.json({ success: true });
  }, 1000); // wait until there hasn't been a change in 1 second to call database

  const formattedValidMoves = validMoves.map((move) => {
    return `${move.from} to ${move.to}`;
  });

  if (cpuOpponentColor && currentTurn === cpuOpponentColor) {
    const gptSystemMsg = `You are a chess engine, playing a chess match against the user as ${
      cpuOpponentColor === "b" ? "black" : "white"
    } and trying to win.

    The current FEN notation is:
    ${fen}

    The valid moves are:
    ${formattedValidMoves}

    Pick a move from the list above that maximizes your chance of winning, and return a function in the provided format of starting square and ending square, Even if you think you can't win, still pick a valid move.`;

    // const gptSystemMsg = "You are a helpful assisitant."

    console.log("gptSystemMsg:", gptSystemMsg);
    console.log("formattedValidMoves:", formattedValidMoves);

    const gptMoveSchema = `{
          "name": "makeMove",
          "description": "Analyze current position in chess game and choose the next move.",
          "parameters": {
            "type": "object",
            "properties": {
              "from": {
                "type": "string",
                "description": "Square that the chosen piece is currently on."
              },
              "to": {
                "type": "string",
                "description": "Square onto which the chosen piece will move."
              },
              "newFen": {
                "type": "string",
                "description": "FEN notation of position after piece is moved."
              }
            },
            "required": ["from", "to", "newFen"]
          }
        }`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        // model: "gpt-3.5-turbo",
        messages: [{ role: "system", content: gptSystemMsg }],
        functions: [JSON.parse(gptMoveSchema)],
        function_call: { name: "makeMove" },
      }),
    });

    const resObject = await response.json();

    const responseMsg = resObject.choices[0].message;

    if (responseMsg.function_call) {
      res.json(JSON.parse(responseMsg.function_call.arguments));
    }
  }
});

// create route
router.post("/create", async (req, res) => {
  const { playerWhiteId, playerBlackId, currentTurn, fen } = req.body;

  const playerWhite =
    playerWhiteId === "cpu" ? "cpu" : await User.findById(playerWhiteId);
  const playerBlack =
    playerBlackId === "cpu" ? "cpu" : await User.findById(playerBlackId);

  const position =
    fen === "start"
      ? `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR ${currentTurn} KQkq - 0 1`
      : `${fen} ${currentTurn} KQkq - 0 1`;

  const newGame = await Game.create({
    playerWhite: {
      playerId: playerWhiteId,
      displayName: playerWhite?.displayName || "CPU",
      username: playerWhite?.username || "cpu",
    },
    playerBlack: {
      playerId: playerBlackId,
      displayName: playerBlack?.displayName || "CPU",
      username: playerBlack?.username || "cpu",
    },
    currentTurn,
    fen: position,
    capturedWhite: [],
    capturedBlack: [],
  });

  if (playerWhiteId === playerBlackId) {
    await User.findByIdAndUpdate(
      playerWhiteId,
      { $push: { games: newGame._id } },
      { new: true }
    );
  } else {
    if (playerWhiteId !== "cpu") {
      await User.findByIdAndUpdate(
        playerWhiteId,
        { $push: { games: newGame._id } },
        { new: true }
      );
    }
    if (playerBlackId !== "cpu") {
      await User.findByIdAndUpdate(
        playerBlackId,
        { $push: { games: newGame._id } },
        { new: true }
      );
    }
  }

  res.json({ game: newGame, success: true });
});

// show route
router.get("/:id", async (req, res) => {
  const game = await Game.findById(req.params.id);
  res.json(game);
});

module.exports = router;
