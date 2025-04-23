// Use the port assigned by Heroku, or 8000 for local development
const PORT = process.env.PORT || 8000;
const express = require("express");
require("dotenv").config();
const prizepicksRoute = require("./routes/prizepicks.route")
const app = express();

// middleware to parse JSON bodies
app.use(express.json());

app.get("/", (req, res) => {
  res.json("Welcome to my PrizePicks API");
});

// api route
app.use("/api", prizepicksRoute)



app.listen(PORT, () => {
  // Log the actual port the server is listening on
  console.log(`Server listening on port ${PORT}`);
});
