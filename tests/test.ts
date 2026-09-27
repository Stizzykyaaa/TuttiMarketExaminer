import { App, staticFiles } from "fresh";
import { define, type State } from "../utils.ts";
import { TuttiClient } from "tutti-api";

export const app = new App<State>();

app.use(staticFiles());
const client = new TuttiClient();

// Fluent search with filters

const filters = await client.search().category("cars").fetch();

const result = await client
  .search("BMW")
  .category("cars")
  .select("carsAutoScoutBrand", "bmw") // select for strings
  .multiSelect("carsAutoScoutType", ["coupe", "saloon", "estate"])
  .interval("carsAutoScoutRegYear", { min: 1990, max: 2013 }) // interval for number ranges
  .interval("carsAutoScoutMileage", { max: 200000})
  .interval("carsAutoScoutHorsepower", {min: 150})
  .multiSelect("carsAutoScoutTransmissionType", ["manual"])
  .price({max: 5000 }) // or .freeOnly()
  // .location(locality) // from client.localities.search()
  .sort("timestamp", "desc")
  .fetch();


const thumbnailUrls = result.listings
  .map((item) => item.thumbnail?.rendition?.src)
  .filter((url): url is string => Boolean(url));

console.log(result.totalCount);
/* result.totalCount; // number
result.listings; // Listing[] (this page)
result.availableFilters; // filter names/options for this category */

// await result.next(); // next page (or null)
// console.log(result.listings)

/* for await (const l of result.paginate()) {
  // every listing across page
} */


// Include file-system based routes here
app.fsRoutes();