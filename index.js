const PORT = 8000;
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
  console.log(`Connected to PORT: ${PORT}`);
});
