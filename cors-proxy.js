/**
 * Pure Node.js CORS Proxy Server - Cloud Production Ready (Zero Dependencies)
 */
const http = require("http");
const https = require("https");
const { URL } = require("url");

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  // 1. STRENGTHEN CORS HEADERS FOR CLOUD ENVIRONMENT
  // Explicitly allow your GitHub Pages origin or use wildcard '*'
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, DELETE",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, api_key, X-Requested-With",
  );
  res.setHeader(
    "Access-Control-Expose-Headers",
    "Content-Length, Content-Type",
  );

  // 2. INTERCEPT PREFLIGHT OPTIONS REQUESTS IMMEDIATELY
  if (req.method === "OPTIONS") {
    res.writeHead(204); // No Content
    res.end();
    return;
  }

  // 3. EXTRACT AND VALIDATE TARGET URL
  // Strips the leading slash to capture the full target URL string
  const targetUrlString = req.url.slice(1);

  if (!targetUrlString || !targetUrlString.startsWith("http")) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "Missing or invalid proxy target URL parameter.",
      }),
    );
    return;
  }

  try {
    const targetUrl = new URL(targetUrlString);

    // Remove headers that cause authentication conflicts with remote systems
    const cleanHeaders = { ...req.headers };
    delete cleanHeaders["host"];
    delete cleanHeaders["origin"];
    delete cleanHeaders["referer"];

    // 4. CONFIGURE PROXY PARAMETERS
    const proxyOptions = {
      hostname: targetUrl.hostname,
      port: targetUrl.port || (targetUrl.protocol === "https:" ? 443 : 80),
      path: targetUrl.pathname + targetUrl.search,
      method: req.method,
      headers: {
        ...cleanHeaders,
        host: targetUrl.hostname, // Force remote domain matching
        connection: "keep-alive",
      },
    };

    const clientModule = targetUrl.protocol === "https:" ? https : http;

    // 5. INITIATE OUTGOING STREAM TO PUBMED
    const proxyRequest = clientModule.request(proxyOptions, (proxyResponse) => {
      // Forward headers except for conflicting origin rules
      Object.keys(proxyResponse.headers).forEach((key) => {
        if (!key.toLowerCase().startsWith("access-control-")) {
          res.setHeader(key, proxyResponse.headers[key]);
        }
      });

      // Re-apply the vital CORS permission safety valves right before writing status codes
      res.setHeader("Access-Control-Allow-Origin", "*");

      res.writeHead(proxyResponse.statusCode);

      // Stream the chunks cleanly back to the browser tab
      proxyResponse.pipe(res);
    });

    proxyRequest.on("error", (err) => {
      console.error("Remote Server Gateway Connection Failure:", err.message);
      res.writeHead(502, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(
        JSON.stringify({
          error: "Proxy failed connecting to remote database endpoint.",
        }),
      );
    });

    // Pipe any request payload bodies forward (critical for data operations)
    req.pipe(proxyRequest);
  } catch (error) {
    console.error("URL Parsing Layout Error:", error.message);
    res.writeHead(400, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(
      JSON.stringify({ error: "Failed to format target URL parameters." }),
    );
  }
});

server.listen(PORT, () => {
  console.log(`🚀 CORS Bypass Cloud Engine Active on Port ${PORT}`);
});
