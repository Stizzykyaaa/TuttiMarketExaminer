// test_discord.ts
const ARCHIVE_URL = "https://discord.com/api/webhooks/1553775195750277283/Qk5liIZUYAN2YFJm-2f-0VM0RQDFt31KcDLA4XcIAzquHtEJKz116NTdow7i2eaoD3I4";
const ALERTS_URL = "https://discord.com/api/webhooks/1553773809083883657/QH5YGFdnN3G6bo_MSdpY7QxEV8EjP_C16WT0D1kw1MWomXVqMV_FxWM8gYNdQ8HuGFAy";

async function ping(url: string, name: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: `✅ Test ping for ${name} successful!` }),
  });
  console.log(`${name}: HTTP ${res.status} ${res.statusText}`);
}

await ping(ARCHIVE_URL, "Archive Channel");
await ping(ALERTS_URL, "Alerts Channel");