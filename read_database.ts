const kv = await Deno.openKv("tutti-market");

// Retrieve every entry under the ["listings"] namespace
const entries = kv.list({ prefix: ["listings"] });

for await (const entry of entries) {
  console.log("Key:", entry.key);
  console.log("Listing:", entry.value);
}

kv.close();