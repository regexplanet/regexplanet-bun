import type { Server } from "bun";
import type { TestInput } from "@regexplanet/common";
import { runTest } from "@regexplanet/common";

Bun.serve({
  development: process.env.NODE_ENV !== "production",
  error(err) {
    return new Response(`<pre>${err}\n${err.stack}</pre>`, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  },
  hostname: process.env.HOSTNAME || "0.0.0.0",
  idleTimeout: 15,
  port: process.env.PORT || 5000,
  static: {
    "/": new Response(`Running Bun v${Bun.version}`),

    "/favicon.ico": new Response(await Bun.file("static/favicon.ico").bytes(), {
      headers: {
        "Content-Type": "image/x-icon",
      },
    }),
    "/favicon.svg": new Response(await Bun.file("static/favicon.svg").bytes(), {
      headers: {
        "Content-Type": "image/svg+xml",
      },
    }),
    "/robots.txt": new Response(await Bun.file("static/robots.txt").bytes(), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    }),
  },

  fetch(req, server) {
    const { pathname } = new URL(req.url);
    if (pathname === "/status.json") {
      return statusJson(req, server);
    } else if (pathname === "/test.json") {
      return testJson(req, server);
    }

    return handleJsonp(req, {
      success: false,
      code: "ENOTFOUND",
      statusCode: 404,
      message: `Not Found: ${pathname}`,
    });
  },
});

function handleJsonp(req: Request, data: Object): Response {
  const url = new URL(req.url);
  const callback = url.searchParams.get("callback");
  if (callback && /^[$A-Za-z_][0-9A-Za-z_$]*$/.test(callback)) {
    return new Response(`${callback}(${JSON.stringify(data)})`, {
      headers: {
        "Content-Type": "application/javascript",
      },
    });
  }
  return Response.json(data, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET",
      "Access-Control-Max-Age": "604800",
    },
  });
}

async function testJson(req: Request, server: Server): Promise<Response> {
  let testInput: TestInput;

  if (req.method === "POST") {
    if (req.headers.get("content-type") === "application/json") {
      testInput = await req.json();
    } else {
      const data = await req.formData();
      console.log("formData", data);

      testInput = {
        engine: "bun",
        regex: data.get("regex") as string,
        replacement: data.get("replacement") as string,
        options: data.getAll("option") as string[],
        inputs: data.getAll("input") as string[],
      };
    }
  } else {
    const searchParams = new URL(req.url).searchParams;
    testInput = {
      engine: searchParams.get("engine") || "bun",
      regex: searchParams.get("regex") || "",
      replacement: searchParams.get("replacement") || "",
      options: searchParams.getAll("option") as string[],
      inputs: searchParams.getAll("input") as string[],
    };
    console.log("searchParams", searchParams);
  }

  console.log("testInput", testInput);

  const retVal = runTest(testInput);

  console.log("testOutput", retVal);

  return handleJsonp(req, retVal);
}

function statusJson(req: Request, server: Server): Response {
  const retVal = {
    success: true,
    tech: `Bun v${Bun.version}`,
    lastmod: process.env.LASTMOD || "(not set)",
    commit: process.env.COMMIT || "(not set)",
    timestamp: new Date().toISOString(),
    version: `${Bun.version}`,
    revision: `${Bun.revision}`,
    "process.arch": process.arch,
    "process.platform": process.platform,
  };

  return handleJsonp(req, retVal);
}
