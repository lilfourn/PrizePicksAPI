const axios = require("axios");
const BASE_URL = process.env.BASE_URL;

// --- List of potential User-Agent strings ---
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 13; SM-G991U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Mobile Safari/537.36'
];

// --- Helper function to get proxy configuration (Enhanced for Rotation) ---
// This is a conceptual example assuming proxies are listed in an env var
// e.g., PROXY_LIST="http://user1:pass1@host1:port1,http://user2:pass2@host2:port2"
// A real implementation might involve a proxy management service API.
let proxyList = [];
let currentProxyIndex = 0;

const loadProxies = () => {
    if (proxyList.length === 0 && process.env.PROXY_LIST) {
        proxyList = process.env.PROXY_LIST.split(',').map(p => p.trim()).filter(p => p);
        console.log(`Loaded ${proxyList.length} proxies.`);
    }
};

loadProxies(); // Load proxies when the module initializes

const getRotatingProxyConfig = () => {
    if (proxyList.length === 0) {
        return null; // No proxies configured or loaded
    }

    const proxyUrlString = proxyList[currentProxyIndex];
    currentProxyIndex = (currentProxyIndex + 1) % proxyList.length; // Rotate index

    try {
        const proxyUrl = new URL(proxyUrlString);
        const config = {
            protocol: proxyUrl.protocol.replace(':', ''), // http or https
            host: proxyUrl.hostname,
            port: parseInt(proxyUrl.port, 10),
        };
        if (proxyUrl.username && proxyUrl.password) {
            config.auth = {
                username: decodeURIComponent(proxyUrl.username),
                password: decodeURIComponent(proxyUrl.password),
            };
        }
        // console.log(`Using proxy: ${config.host}:${config.port}`); // Optional: for debugging
        return config;
    } catch (e) {
        console.error(`Error parsing proxy URL: ${proxyUrlString}`, e);
        return null; // Skip invalid proxy URL
    }
};


// --- Function to create common request options (Updated) ---
const createRequestOptions = () => {
  // Select a random User-Agent
  const randomUserAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  // Get a rotating proxy
  const proxy = getRotatingProxyConfig(); // Use the rotating proxy function

  return {
    headers: {
      // Standard Headers
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'User-Agent': randomUserAgent, // Use the randomly selected User-Agent

      // Common Security/Hint Headers (Optional, might help)
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      // Note: Sec-Ch-Ua headers should ideally match the chosen User-Agent,
      // which adds significant complexity. For simplicity, we might omit them
      // or use a fixed generic set, but this is less convincing.
      // 'Sec-Ch-Ua': '"Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"',
      // 'Sec-Ch-Ua-Mobile': '?0',
      // 'Sec-Ch-Ua-Platform': '"Windows"', // Should match UA
    },
    ...(proxy && { proxy: proxy }), // Conditionally add the rotating proxy
    timeout: 20000 // Increased timeout slightly for potentially slower proxies
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
