/**
 * Pure Node.js CORS Proxy Server (Zero Dependencies)
 */
const http = require('http');
const https = require('https');
const { URL } = require('url');


// Define the port for the proxy server to listen on (default to 8080 if not set in environment variables)
const PORT = process.env.PORT || 8080;

// This is a simple CORS proxy server implemented in pure Node.js without any external dependencies.
server.listen(PORT, () => {
  console.log(`🚀 Pure Node.js CORS Proxy running on port ${PORT}`);
});



// Core request handler function for incoming proxy requests
const server = http.createServer((req, res) => {
    // 1. Handle CORS Preflight OPTIONS Requests
    // The browser automatically sends an OPTIONS request before certain cross-origin operations
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, api_key');

    if (req.method === 'OPTIONS') {
        res.writeHead(204); // 204 No Content
        res.end();
        return;
    }

    // 2. Extract and Validate Target URL
    // Expected format: http://localhost:8080/https://eutils.ncbi.nlm.nih.gov/etc...
    const targetUrlString = req.url.slice(1); // Strips the leading slash '/'
    
    if (!targetUrlString || !targetUrlString.startsWith('http')) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing or invalid proxy target URL parameter.' }));
        return;
    }

    try {
        const targetUrl = new URL(targetUrlString);
        
        // 3. Configure Proxy Request Metadata Options
        const proxyOptions = {
            hostname: targetUrl.hostname,
            port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
            path: targetUrl.pathname + targetUrl.search,
            method: req.method,
            headers: {
                ...req.headers,
                host: targetUrl.hostname // OVERRIDE the host header to match target endpoint requirements
            }
        };

        // Select client driver package module depending on target protocol
        const clientModule = targetUrl.protocol === 'https:' ? https : http;

        // 4. Initiate Request to Remote API Server
        const proxyRequest = clientModule.request(proxyOptions, (proxyResponse) => {
            // Forward response headers while explicitly maintaining visual CORS bypass variables
            Object.keys(proxyResponse.headers).forEach(key => {
                if (!key.toLowerCase().startsWith('access-control-')) {
                    res.setHeader(key, proxyResponse.headers[key]);
                }
            });
            
            res.writeHead(proxyResponse.statusCode);
            
            // Stream response data fragments back to client browser tab context lazily
            proxyResponse.pipe(res);
        });

        // Handle remote server network link exceptions or connection failures
        proxyRequest.on('error', (err) => {
            console.error('Remote Target Gateway Connection Error:', err.message);
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Proxy failed connecting to remote database endpoint layers.' }));
        });

        // 5. Stream Incoming Payload Request Body Buffers (For POST/PUT data streams)
        req.pipe(proxyRequest);

    } catch (error) {
        console.error('URL Parsing Exception Layout Error:', error.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to format the given target API route URL.' }));
    }
});

// Run microservice execution context loop
server.listen(PORT, () => {
    console.log(`🚀 Pure Node.js CORS Proxy running successfully at http://localhost:${PORT}/`);
    console.log(`🔗 Example Usage: http://localhost:${PORT}/https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=cancer&retmode=json`);
});