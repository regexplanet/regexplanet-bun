import type { Server } from "bun";

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
  port: process.env.PORT || 4000,
  static: {
    //LATER: "/": Response.redirect("https://www.regexplanet.com/advanced/bun/index.html", 302),
    "/": new Response("running!"),

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
      code: 'ENOTFOUND',
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

function testJson(req: Request, server: Server): Response {
  const body = req.body;

  return handleJsonp(req, {
    sucess: false,
    html: `<div class="alert alert-danger" role="alert">Bun support is not finished yet</div>`,
  });
}

function statusJson(req: Request, server: Server): Response {
  const retVal = {
    success: true,
    tech: `Bun v${Bun.version}`,
    lastmod: process.env.LASTMOD || '(not set)',
    commit: process.env.COMMIT || '(not set)',
    timestamp: new Date().toISOString(),
    version: `${Bun.version}`,
    revision: `${Bun.revision}`,
    'process.arch': process.arch,
    'process.platform': process.platform,
  };

  return handleJsonp(req, retVal);
}
