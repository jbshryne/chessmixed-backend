const express = require("express");
const router = express.Router();
require("dotenv").config();
const User = require("../models/user");
const Game = require("../models/game");

// index route
router.post("/", async (req, res) => {
  const user = await User.findById(req.body.userId).populate("games");
  // console.log("user:", user);
  res.json(user.games);
});

// connection route
router.get("/hi", async (req, res) => {
  res.json({ userId: req.session.userId });
});

// seed route
router.post("/seed", async (req, res) => {
  const currentUser = req.body.currentUser;

  console.log("currentUser:", currentUser);
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

// new route
// router.get("/new", async (req, res) => {
//   const user = await User.findById(req.session.userId);
//   res.render("game/new", { user });
// });

// delete route;
router.delete("/delete", async (req, res) => {
  console.log("delete route hit!");
  console.log("req.body:", req.body);
  const { gameId } = req.body;
  await Game.findByIdAndDelete(gameId);
  // res.redirect("/games");
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
  console.log("move route hit!");
  // console.log("req.body:", req.body);

  const {
    gameId,
    fen,
    currentTurn,
    // opponent,
    //  pgn,
    //  validMoves
  } = req.body;

  // console.log("currentTurn:", currentTurn);

  // prevent server getting flooded w/ updates
  if (moveUpdateTimeout) {
    clearTimeout(moveUpdateTimeout);
  }

  moveUpdateTimeout = setTimeout(async () => {
    const response = await Game.findOneAndUpdate(
      { _id: gameId },
      { fen: fen, currentTurn },
      {
        new: true,
      }
    );
    // console.log("response:", response);
    // res.json({ success: true });
    // console.log(update);
  }, 1000); // wait until there hasn't been a change in 1 second to call database

  //   if (opponent === "cpu" && currentTurn === "b") {
  //     const gptSystemMsg = `You are a chess engine, playing a chess match against the user as black and trying to win.  The current PGN is: ${pgn}

  //   The current FEN notation is:
  //   ${fen}

  //   The valid moves are:
  //   ${validMoves}

  //   Pick a move from the list above that maximizes your chance of winning, and return a function in the provided format of starting square and ending square, Even if you think you can't win, still pick a valid move.`;

  //     // console.log(gptSystemMsg);

  //     // const gptSystemMsg = "You are a helpful assisitant."

  //     const gptMoveSchema = `{
  //         "name": "makeMove",
  //         "description": "Analyze current position in chess game and choose the next move.",
  //         "parameters": {
  //           "type": "object",
  //           "properties": {
  //             "from": {
  //               "type": "string",
  //               "description": "Square that the chosen piece is currently on."
  //             },
  //             "to": {
  //               "type": "string",
  //               "description": "Square onto which the chosen piece will move."
  //             },
  //             "newFen": {
  //               "type": "string",
  //               "description": "FEN notation of position after piece is moved."
  //             }
  //           },
  //           "required": ["from", "to", "newFen"]
  //         }
  //       }`;

  //     const response = await fetch("https://api.openai.com/v1/chat/completions", {
  //       method: "POST",
  //       headers: {
  //         Authorization: `Bearer ${process.env.OPENAI_KEY}`,
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         model: "gpt-4",
  //         // model: "gpt-3.5-turbo",
  //         messages: [{ role: "system", content: gptSystemMsg }],
  //         functions: [JSON.parse(gptMoveSchema)],
  //         function_call: { name: "makeMove" },
  //       }),
  //     });

  //     const resObject = await response.json();

  //     const responseMsg = resObject.choices[0].message;
  //     console.log("response:", resObject);
  //     // console.log("message:", responseMsg);

  //     if (responseMsg.function_call) {
  //       res.json(JSON.parse(responseMsg.function_call.arguments));
  //     }

  //     // console.log("API key:", process.env.OPENAI_KEY);
  //     // console.log("response from GPT:", resObject);
  //   }
});

// create route
router.post("/create", async (req, res) => {
  console.log("req.body.currentUser:", req.body.currentUser);

  const currentUser = req.body.currentUser;

  const newGame = await Game.create({
    playerWhite: {
      playerId: currentUser._id,
      displayName: currentUser.displayName,
      username: currentUser.username,
    },
    playerBlack: {
      playerId: currentUser._id,
      displayName: currentUser.displayName,
      username: currentUser.username,
    },
    currentTurn: "w",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    capturedWhite: [],
    capturedBlack: [],
  });

  await User.findByIdAndUpdate(
    currentUser._id,
    { $push: { games: newGame._id } },
    { new: true }
  );

  res.json(newGame);

  // req.body.userId = req.session.userId;
  // const game = await Game.create(req.body);

  // await User.findByIdAndUpdate(req.session.userId, {
  //   $push: { games: game._id },
  // });

  // res.json(game);
});

// edit route
// router.get("/:id/edit", async (req, res) => {
//   const game = await Game.findById(req.params.id);
//   res.render("game/edit", { game });
// });

// show route
router.get("/:id", async (req, res) => {
  const game = await Game.findById(req.params.id);
  res.json(game);
});

module.exports = router;
