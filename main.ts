// main.ts
import { runScraper } from "./bmw_scraper.ts";
import { cleanAndDetectDisappearedListings } from "./analyzer.ts";

Deno.cron("BMW Tutti Daily Pipeline", "0 7 * * *", async () => {
  console.log("Starting scheduled scrape...");
  await runScraper();

  console.log("Analyzing diffs and firing alerts...");
  await cleanAndDetectDisappearedListings();
  console.log("Pipeline run complete.");
});

// Responds to Deno Deploy's warm-up/health checks so it doesn't time out
Deno.serve((_req) => {
  return new Response("OK - Pipeline Worker Running", { status: 200 });
});