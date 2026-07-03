import test from "node:test";
import assert from "node:assert/strict";

import {
  detectClientType,
  describeClient,
} from "@/lib/logger/detectClient";

/* -------------------------------------------------------------------------- */
/*                           detectClientType                                 */
/* -------------------------------------------------------------------------- */

test(
  "detectClientType detects API clients",
  () => {
    assert.equal(
      detectClientType(
        "PostmanRuntime/7.43.0"
      ),
      "API Client"
    );

    assert.equal(
      detectClientType(
        "Insomnia/2025.1"
      ),
      "API Client"
    );

    assert.equal(
      detectClientType(
        "Thunder Client"
      ),
      "API Client"
    );

    assert.equal(
      detectClientType(
        "curl/8.5.0"
      ),
      "API Client"
    );
  }
);

test(
  "detectClientType detects bots",
  () => {
    assert.equal(
      detectClientType(
        "Googlebot/2.1"
      ),
      "Bot"
    );

    assert.equal(
      detectClientType(
        "Crawler"
      ),
      "Bot"
    );

    assert.equal(
      detectClientType(
        "Spider"
      ),
      "Bot"
    );
  }
);

test(
  "detectClientType detects tablets",
  () => {
    assert.equal(
      detectClientType(
        "Mozilla/5.0 (iPad)"
      ),
      "Tablet"
    );

    assert.equal(
      detectClientType(
        "Tablet"
      ),
      "Tablet"
    );
  }
);

test(
  "detectClientType detects mobile devices",
  () => {
    assert.equal(
      detectClientType(
        "Mozilla/5.0 (Android)"
      ),
      "Mobile"
    );

    assert.equal(
      detectClientType(
        "Mozilla/5.0 (iPhone)"
      ),
      "Mobile"
    );

    assert.equal(
      detectClientType(
        "Mobile Safari"
      ),
      "Mobile"
    );
  }
);

test(
  "detectClientType detects desktop devices",
  () => {
    assert.equal(
      detectClientType(
        "Mozilla/5.0 (Windows NT 10.0)"
      ),
      "Desktop"
    );

    assert.equal(
      detectClientType(
        "Mozilla/5.0 (Macintosh)"
      ),
      "Desktop"
    );

    assert.equal(
      detectClientType(
        "Mozilla/5.0 (X11; Linux x86_64)"
      ),
      "Desktop"
    );
  }
);

test(
  "detectClientType returns Unknown when device cannot be determined",
  () => {
    assert.equal(
      detectClientType("Some Random UA"),
      "Unknown"
    );
  }
);

/* -------------------------------------------------------------------------- */
/*                             describeClient                                 */
/* -------------------------------------------------------------------------- */

test(
  "describeClient detects Chrome desktop",
  () => {
    const client =
      describeClient(
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/139.0.0.0 Safari/537.36"
      );

    assert.deepEqual(client, {
      browser: "Chrome",
      device: "Desktop",
    });
  }
);

test(
  "describeClient detects Firefox",
  () => {
    const client =
      describeClient(
        "Mozilla/5.0 Firefox/140.0"
      );

    assert.deepEqual(client, {
      browser: "Firefox",
      device: "Unknown",
    });
  }
);

test(
  "describeClient detects Safari",
  () => {
    const client =
      describeClient(
        "Mozilla/5.0 Version/17.0 Safari/605.1.15"
      );

    assert.deepEqual(client, {
      browser: "Safari",
      device: "Unknown",
    });
  }
);

test(
  "describeClient detects Edge",
  () => {
    const client =
      describeClient(
        "Mozilla/5.0 Edg/138.0.0.0 Windows"
      );

    assert.deepEqual(client, {
      browser: "Edge",
      device: "Desktop",
    });
  }
);

test(
  "describeClient detects Opera",
  () => {
    const client =
      describeClient(
        "Mozilla/5.0 OPR/116.0 Windows"
      );

    assert.deepEqual(client, {
      browser: "Opera",
      device: "Desktop",
    });
  }
);

test(
  "describeClient detects Brave as Chrome-compatible",
  () => {
    const client =
      describeClient(
        "Mozilla/5.0 Brave Chrome/139.0.0.0 Linux"
      );

    assert.deepEqual(client, {
      browser: "Brave",
      device: "Desktop",
    });
  }
);

test(
  "describeClient detects Postman",
  () => {
    const client =
      describeClient(
        "PostmanRuntime/7.43.0"
      );

    assert.deepEqual(client, {
      browser: "Postman",
      device: "API Client",
    });
  }
);

test(
  "describeClient detects Insomnia",
  () => {
    const client =
      describeClient(
        "Insomnia/2025.1"
      );

    assert.deepEqual(client, {
      browser: "Insomnia",
      device: "API Client",
    });
  }
);

test(
  "describeClient detects Thunder Client",
  () => {
    const client =
      describeClient(
        "Thunder Client"
      );

    assert.deepEqual(client, {
      browser: "Thunder Client",
      device: "API Client",
    });
  }
);

test(
  "describeClient detects curl",
  () => {
    const client =
      describeClient(
        "curl/8.5.0"
      );

    assert.deepEqual(client, {
      browser: "curl",
      device: "API Client",
    });
  }
);

test(
  "describeClient returns Unknown for unknown clients",
  () => {
    const client =
      describeClient(
        "CompletelyUnknownAgent"
      );

    assert.deepEqual(client, {
      browser: "Unknown",
      device: "Unknown",
    });
  }
);
