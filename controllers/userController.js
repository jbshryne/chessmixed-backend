const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");
const session = require("express-session");

router.get("/hi", (req, res) => {
  console.log("hi");
  res.json({ success: true });
});

router.get("/login", (req, res) => {
  console.log("login page");
  res.json({ message: "login page" });
});

router.post("/login", async (req, res) => {
  let userToLogin = await User.findOne({ username: req.body.username });

  if (userToLogin) {
    console.log("User logging in:", userToLogin);
    bcrypt.compare(req.body.password, userToLogin.password, (err, result) => {
      if (result) {
        req.session.userId = userToLogin._id;
        req.session.username = userToLogin.username;

        console.log(req.session);
        res.json({ user: userToLogin, message: "sucesss" });
      } else {
        res.status(401).json({ message: "Incorrect Password" });
        // res.json({ message: "Incorrect Password" });
      }
    });
  } else {
    res.status(401).json({ message: "User not found" });
    // res.json({ message: "User not found" });
  }
});

router.get("/signup", (req, res) => {
  res.json({ message: "signup" });
});

router.post("/signup", async (req, res) => {
  console.log(req.body);
  const userObject = req.body;

  // seed all current users into new user's friends list
  const allUsers = await User.find();
  const allUsersIds = allUsers.map((user) => user._id);
  userObject.friends = allUsersIds;

  if (userObject.username && userObject.password) {
    let plainTextPassword = userObject.password;
    bcrypt.hash(plainTextPassword, 10, async (err, hashedPassword) => {
      userObject.password = hashedPassword;
      const response = await User.create(userObject);

      // push new user into all current users' friends list
      allUsers.forEach((user) => {
        user.friends.push(response._id);
        user.save();
      });

      console.log(response);

      if (!response) {
        res.status(401).json({ message: "User not created" });
        // res.json({ message: "User not created" });
      }

      res.json({ message: "User created successfully" });
    });
  } else {
    res.status(401).json({ message: "Username and password required" });
    // res.json({ message: "Username and password required" });
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy();
  res.json({ message: "Logout successful" });
});

router.get("/friends/:id", async (req, res) => {
  console.log("req.body:", req.params.id);
  const user = await User.findById(req.params.id).populate("friends");
  console.log("user.friends:", user.friends);
  const friendsList = user.friends.map((friend) => {
    return {
      _id: friend._id,
      username: friend.username,
      displayName: friend.displayName,
    };
  });
  res.json(friendsList);
});

module.exports = router;
