import test from "node:test";
import assert from "node:assert/strict";

import {
  detectBrowser,
  detectClientType,
  describeClient,
} from "@/lib/logger/detectClient";

/* -------------------------------------------------------------------------- */
/*                              detectBrowser                                 */
/* -------------------------------------------------------------------------- */

test("detectBrowser detects Postman", () => {
  assert.equal(
    detectBrowser("PostmanRuntime/7.43.0"),
    "Postman"
  );
});

test("detectBrowser detects Insomnia", () => {
  assert.equal(
    detectBrowser("Insomnia/2025.1"),
    "Insomnia"
  );
});

test("detectBrowser detects Thunder Client", () => {
  assert.equal(
    detectBrowser("Thunder Client"),
    "Thunder Client"
  );

  assert.equal(
    detectBrowser("ThunderClient"),
    "Thunder Client"
  );
});

test("detectBrowser detects curl", () => {
  assert.equal(
    detectBrowser("curl/8.5.0"),
    "curl"
  );
});

test("detectBrowser detects Edge", () => {
  assert.equal(
    detectBrowser(
      "Mozilla/5.0 Edg/138.0.0.0"
    ),
    "Edge"
  );
});

test("detectBrowser detects Opera", () => {
  assert.equal(
    detectBrowser(
      "Mozilla/5.0 OPR/116.0"
    ),
    "Opera"
  );

  assert.equal(
    detectBrowser(
      "Mozilla/5.0 Opera/116.0"
    ),
    "Opera"
  );
});

test("detectBrowser detects Brave", () => {
  assert.equal(
    detectBrowser(
      "Mozilla/5.0 Brave Chrome/139.0.0.0"
    ),
    "Brave"
  );
});

test("detectBrowser detects Firefox", () => {
  assert.equal(
    detectBrowser(
      "Mozilla/5.0 Firefox/140.0"
    ),
    "Firefox"
  );
});

test("detectBrowser detects Safari", () => {
  assert.equal(
    detectBrowser(
      "Mozilla/5.0 Version/17.0 Safari/605.1.15"
    ),
    "Safari"
  );
});

test("detectBrowser detects Chrome", () => {
  assert.equal(
    detectBrowser(
      "Mozilla/5.0 Chrome/139.0.0.0 Safari/537.36"
    ),
    "Chrome"
  );

  assert.equal(
    detectBrowser(
      "Mozilla/5.0 Chromium/139.0.0.0"
    ),
    "Chrome"
  );
});

test("detectBrowser returns Unknown", () => {
  assert.equal(
    detectBrowser("RandomAgent"),
    "Unknown"
  );
});

/* -------------------------------------------------------------------------- */
/*                           detectClientType                                 */
/* -------------------------------------------------------------------------- */

test("detectClientType detects API clients", () => {
  assert.equal(
    detectClientType("PostmanRuntime"),
    "API Client"
  );

  assert.equal(
    detectClientType("Insomnia"),
    "API Client"
  );

  assert.equal(
    detectClientType("Thunder Client"),
    "API Client"
  );

  assert.equal(
    detectClientType("ThunderClient"),
    "API Client"
  );

  assert.equal(
    detectClientType("curl"),
    "API Client"
  );
});

test("detectClientType detects bots", () => {
  assert.equal(
    detectClientType("Googlebot"),
    "Bot"
  );

  assert.equal(
    detectClientType("Crawler"),
    "Bot"
  );

  assert.equal(
    detectClientType("Spider"),
    "Bot"
  );
});

test("detectClientType detects tablets", () => {
  assert.equal(
    detectClientType("iPad"),
    "Tablet"
  );

  assert.equal(
    detectClientType("Tablet"),
    "Tablet"
  );
});

test("detectClientType detects mobile devices", () => {
  assert.equal(
    detectClientType("Android"),
    "Mobile"
  );

  assert.equal(
    detectClientType("iPhone"),
    "Mobile"
  );

  assert.equal(
    detectClientType("Mobile Safari"),
    "Mobile"
  );
});

test("detectClientType detects desktop devices", () => {
  assert.equal(
    detectClientType("Windows NT"),
    "Desktop"
  );

  assert.equal(
    detectClientType("Macintosh"),
    "Desktop"
  );

  assert.equal(
    detectClientType("Linux"),
    "Desktop"
  );
});

test("detectClientType returns Unknown", () => {
  assert.equal(
    detectClientType("TempleOS"),
    "Unknown"
  );
});

/* -------------------------------------------------------------------------- */
/*                            describeClient                                  */
/* -------------------------------------------------------------------------- */

test("describeClient returns browser and device for Chrome", () => {
  assert.deepEqual(
    describeClient(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/139.0.0.0 Safari/537.36"
    ),
    {
      browser: "Chrome",
      device: "Desktop",
    }
  );
});

test("describeClient returns browser and device for Postman", () => {
  assert.deepEqual(
    describeClient(
      "PostmanRuntime/7.43.0"
    ),
    {
      browser: "Postman",
      device: "API Client",
    }
  );
});

test("describeClient returns Unknown values", () => {
  assert.deepEqual(
    describeClient("RandomAgent"),
    {
      browser: "Unknown",
      device: "Unknown",
    }
  );
});
