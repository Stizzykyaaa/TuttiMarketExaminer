// test_patch.ts
import { TuttiClient } from "tutti-api";

// --- THE MONKEY PATCH ---
const dummyQuery = new TuttiClient().search("");
const SearchQueryProto = Object.getPrototypeOf(dummyQuery);

SearchQueryProto.select = function (name: string, value: string) {
  this._strings.push({ key: name, value: value });
  return this;
};

SearchQueryProto.multiSelect = function (name: string, values: string[]) {
  this._strings.push({ key: name, value: values });
  return this;
};
// ------------------------

console.log("Testing patched Tutti query...");

const client = new TuttiClient();
const query = client
  .search("BMW")
  .category("cars")
  .select("carsAutoScoutBrand", "bmw")
  .multiSelect("carsAutoScoutType", ["coupe", "saloon"]);

// Inspect internal state to confirm the patched structure is present
const internalStrings = (query as any)._strings;
console.log("Internal _strings array:", internalStrings);

// Verify actual network execution
try {
  const result = await query.fetch();
  console.log("Result object keys:", Object.keys(result));
  
  // Test iterating the results just like your real scraper does:
  let count = 0;
  for await (const listing of result.paginate()) {
    console.log(`✅ Success! Found listing: ${listing.title} (${listing.listingID})`);
    count++;
    if (count >= 3) break; // Just test the first 3
  }
} catch (err) {
  console.error("❌ Fetch failed:", err);
}