I need a complete setup for automating TikTok account management using 10 virtual phones on VMOS Cloud, with workflows built in n8n. The goal is to warm up TikTok accounts (scrolling, liking, searching) for 7-14 days, then automate content creation and posting about crypto/mining, including trending topics, video generation, and posting with CTAs ("Visit minehedge.com") and hashtags. I’m using n8n for automation, VMOS Cloud OpenAPI for device control, CoinMarketCap API for crypto trends, OpenAI API for generating video scripts, and OpenAI Sora 2 API for video generation. Please provide the following:

1. **n8n MCP Server Setup**: Generate a Node.js script to set up the n8n MCP server locally, including a `package.json` and instructions to run it. This will allow n8n to integrate with Cursor for workflow generation.

2. **Warm-Up Workflow**: Create an n8n workflow JSON file for warming up 10 TikTok accounts. It should:
   - Trigger daily at random times (use Cron node with random hour).
   - Fetch the list of 10 virtual phone IDs from VMOS Cloud OpenAPI (GET /v1/instances, assume endpoint; use placeholder for API key).
   - Loop over each phone ID.
   - Use VMOS TK automation to perform 10-20 actions per account (e.g., scroll feed, like 5 videos, search "crypto mining") via POST requests to the appropriate endpoint (e.g., /v1/tasks).
   - Add error handling to retry failed actions or send an email alert.
   - Include random delays (5-10s) to mimic human behavior.

3. **Content Creation & Posting Workflow**: Create an n8n workflow JSON file to:
   - Trigger every 12 hours (Cron node).
   - Fetch trending crypto topics from CoinMarketCap API (GET /v1/cryptocurrency/trending/latest?limit=5, placeholder for API key).
   - Use OpenAI API (gpt-4o model) to generate a 30-second TikTok script about the top trend, including a hook, facts, CTA ("Visit minehedge.com for mining tips!"), and 5 hashtags (e.g., #Crypto #Mining #MineHedge).
   - Generate a video using OpenAI Sora 2 API (POST to /video/generations, assume endpoint; placeholder for API key). The video should be 1080p, 30s, with text overlays from the script and crypto-themed visuals (e.g., mining rigs, charts).
   - Upload the video to all 10 VMOS virtual phones via OpenAPI (POST /v1/files/upload).
   - Post the video to TikTok via VMOS TK automation (POST to /v1/tk/post) with the caption and hashtags.
   - Monitor post stats and send success/failure notifications.

4. **Additional Scripts**: Provide any helper scripts (e.g., bash for starting n8n, Docker setup for production) to run the n8n instance and MCP server. Include instructions for setting environment variables for API keys (VMOS, CoinMarketCap, OpenAI).

5. **Notes**:
   - Use placeholder API keys (e.g., `{{VMOS_API_KEY}}`)—I’ll replace them.
   - Assume VMOS endpoints are based on their OpenAPI docs (e.g., https://api.vmoscloud.com/v1).
   - For Sora 2, use the OpenAI API structure (similar to /chat/completions but for /video/generations).
   - Ensure workflows are importable into n8n’s visual editor.
   - Add comments in JSON/code for clarity.
   - If Sora 2 API lacks specific docs, use a generic POST structure and note I can adjust later.

Please output all files (e.g., `mcp-server.js`, `package.json`, `warmup-workflow.json`, `content-workflow.json`, `run-n8n.sh`) with clear instructions on how to use them in a development environment (local machine or VPS with Node.js 18+). Include steps to import workflows into n8n and test them.