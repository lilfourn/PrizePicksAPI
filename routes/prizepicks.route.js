const express = require("express");
const router = express.Router()
const { getLeagues, getProjections, getLeagueProjections } = require("../controllers/prizepicks.controller") // Import getLeagueProjections

router.get("/leagues", getLeagues)

router.get("/projections", getProjections)

// Add a route for specific league projections using a route parameter :leagueId
router.get("/projections/:leagueId", getLeagueProjections)

module.exports = router;