const axios = require("axios");
const BASE_URL = process.env.BASE_URL;

// --- Helper function to get proxy configuration (Example) ---
const getProxyConfig = () => {
  const proxyHost = process.env.PROXY_HOST;
  const proxyPort = process.env.PROXY_PORT;
  const proxyUsername = process.env.PROXY_USERNAME;
  const proxyPassword = process.env.PROXY_PASSWORD;

  if (!proxyHost || !proxyPort) {
    return null;
  }
  const config = {
    host: proxyHost,
    port: parseInt(proxyPort, 10),
  };
  if (proxyUsername && proxyPassword) {
    config.auth = { username: proxyUsername, password: proxyPassword };
  }
  return config;
};

// --- Function to create common request options ---
const createRequestOptions = () => {
  const proxy = getProxyConfig();
  return {
    headers: {
      // Standard Headers
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br', // Added encoding
      'Connection': 'keep-alive', // Added connection type
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36', // Updated UA slightly

      // Common Security/Hint Headers (Optional, might help)
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin', // Adjust if fetching cross-origin
      'Sec-Ch-Ua': '"Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"macOS"', // Or "Windows" etc.
    },
    ...(proxy && { proxy: proxy }), // Conditionally add proxy
    timeout: 15000 // Add a timeout (e.g., 15 seconds)
  };
};


const getLeagues = async (req, res) => {
  const options = createRequestOptions();
  try {
    const response = await axios.get(`${BASE_URL}/leagues`, options);
    const leagueData = response.data;
    console.log(leagueData);
    res.json(leagueData);
  } catch (error) {
    console.error("Error fetching leagues:", error.message);
    // Provide more specific status code if available from error
    const statusCode = error.response?.status || 500;
    res.status(statusCode).json({ message: "Error fetching leagues from external API" });
  }
};

const getProjections = async (req, res) => {
  const options = createRequestOptions(); // Use the helper function
  try {
    // Append the new query parameter
    const response = await axios.get(
      `${BASE_URL}/projections?per_page=100&include_new_player_attributes=True`,
      options
    );
    const projectionData = response.data;
    res.json(projectionData);
  } catch (error) {
    console.error("Error fetching projections:", error.message);
    // Provide more specific status code if available from error
    const statusCode = error.response?.status || 500;
    // Specifically log the 429 error if it occurs
    if (statusCode === 429) {
        console.warn("Rate limit (429) encountered when fetching projections.");
    }
    res.status(statusCode).json({ message: "Error fetching projections from external API" });
  }
};

const getLeagueProjections = async (req, res) => {
  // Extract leagueId from the request parameters
  const leagueId = req.params.leagueId;

  // Optional: Validate if leagueId is provided and maybe if it's a number
  if (!leagueId) {
    return res.status(400).json({ message: "League ID parameter is required." });
  }
  // Optional: Check if it's a valid number format if needed
  // if (isNaN(parseInt(leagueId))) {
  //   return res.status(400).json({ message: "League ID must be a number." });
  // }


  const options = createRequestOptions(); // Use the helper function
  try {
    // Append the new query parameter
    const response = await axios.get(
      `${BASE_URL}/projections?league_id=${leagueId}&include_new_player_attributes=True`, // Use leagueId and add new param
      options
    );
    const projectionData = response.data;
    res.json(projectionData);
  } catch (error) {
    console.error(`Error fetching projections for league ${leagueId}:`, error.message);
    const statusCode = error.response?.status || 500;
    if (statusCode === 429) {
      console.warn(`Rate limit (429) encountered when fetching projections for league ${leagueId}.`);
    }
    // Consider adding a check for 404 Not Found if the league ID might be invalid
    if (statusCode === 404) {
        return res.status(404).json({ message: `Projections not found for league ID: ${leagueId}` });
    }
    res
      .status(statusCode)
      .json({ message: `Error fetching projections for league ${leagueId} from external API` });
  }
};

module.exports = {
  getLeagues,
  getProjections,
  getLeagueProjections 
};
