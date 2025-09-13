import express from "express";

const app = express();
const PORT = process.env.PORT || 5555;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Base servers
const server_base = [
  { type: "bing", url: "https://serpfree.onrender.com" },
  { type: "bing", url: "https://serpfree-2.onrender.com" },
  { type: "bing", url: "https://serpfree-3.onrender.com" },
  { type: "bing", url: "https://serpfree-4.onrender.com" },
  { type: "bing", url: "https://serpfree-5.onrender.com" },
  { type: "bing", url: "https://serpfree-6.onrender.com" },
];

// Google servers
const server_google = [
  { type: "google", url: "https://serpfree-google.onrender.com" },
  { type: "google", url: "https://serpfree-google-2.onrender.com" },
  { type: "google", url: "https://serpfree-google-3.onrender.com" },
  { type: "google", url: "https://serpfree-google-4.onrender.com" },
  { type: "google", url: "https://serpfree-google-5.onrender.com" },
  { type: "google", url: "https://serpfree-google-6.onrender.com" },
];

// Helper function to add a timeout to a fetch request
const fetchWithTimeout = (url, options, timeout = 30000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), timeout),
    ),
  ]);
};

app.get("/", async (req, res) => {
  const query = "minecraft"; // Example query

  // Fetch promises for base servers
  const baseFetchPromises = server_base.map((server) =>
    fetchWithTimeout(`${server.url}/api/serp/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: server.type, query }),
    })
      .then(async (response) => {
        if (response.ok) {
          const data = await response.json();
          return { server: server.url, status: "success", data };
        } else {
          return {
            server: server.url,
            status: "error",
            error: `HTTP ${response.status}`,
          };
        }
      })
      .catch((error) => ({
        server: server.url,
        status: "error",
        error: error.message,
      })),
  );

  // Fetch promises for google servers
  const googleFetchPromises = server_google.map((server) =>
    fetchWithTimeout(`${server.url}/api/serp/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: server.type, query }),
    })
      .then(async (response) => {
        if (response.ok) {
          const data = await response.json();
          return { server: server.url, status: "success", data };
        } else {
          return {
            server: server.url,
            status: "error",
            error: `HTTP ${response.status}`,
          };
        }
      })
      .catch((error) => ({
        server: server.url,
        status: "error",
        error: error.message,
      })),
  );

  // Wait for all promises to settle
  const baseResults = await Promise.allSettled(baseFetchPromises);
  const googleResults = await Promise.allSettled(googleFetchPromises);

  // Initialize counters
  let baseSuccessCount = 0;
  let googleSuccessCount = 0;

  // Format the results for base servers
  const formattedBaseResults = baseResults.map((result, index) => {
    if (result.status === "fulfilled" && result.value.status === "success") {
      baseSuccessCount++;
      return result.value;
    } else {
      return {
        server: server_base[index].url,
        status: "error",
        error: result.reason ? result.reason.message : result.value.error,
      };
    }
  });

  // Format the results for google servers
  const formattedGoogleResults = googleResults.map((result, index) => {
    if (result.status === "fulfilled" && result.value.status === "success") {
      googleSuccessCount++;
      return result.value;
    } else {
      return {
        server: server_google[index].url,
        status: "error",
        error: result.reason ? result.reason.message : result.value.error,
      };
    }
  });

  res.json({
    message: "Server statuses",
    base: {
      successCount: baseSuccessCount,
      results: formattedBaseResults,
    },
    google: {
      successCount: googleSuccessCount,
      results: formattedGoogleResults,
    },
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
