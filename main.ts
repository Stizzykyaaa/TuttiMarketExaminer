import { runScraper } from "./bmw_scraper.ts";
import { cleanAndDetectDisappearedListings } from "./analyzer.ts";

Deno.cron("BMW Tutti Scraper", "0 9 * * *", async () => {
  console.log("Running scheduled BMW scrape...");
  await runScraper();

  console.log("Running GC and analyzing listings...");
  const droppedListings = await cleanAndDetectDisappearedListings();

  // Save to JSON for HTML rendering or processing:
  if (droppedListings.length > 0) {
    await Deno.writeTextFile(
      `./disappeared_${new Date().toISOString().split("T")[0]}.json`,
      JSON.stringify(droppedListings, null, 2)
    );
  }
});