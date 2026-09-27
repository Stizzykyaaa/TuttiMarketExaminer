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