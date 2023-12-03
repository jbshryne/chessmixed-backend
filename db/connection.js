const mongoose = require("mongoose");
require("dotenv").config();

console.log("DATABASE_URL", process.env.DATABASE_URL);

mongoose.connect(process.env.DATABASE_URL);

mongoose.connection.on("connected", () => {
  console.log("connected to mongoose!");
});
mongoose.connection.on("error", () => {
  console.log("error when connecting to mongoose");
});

module.exports = mongoose;
