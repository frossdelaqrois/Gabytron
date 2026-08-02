import { spawn, spawnSync } from "node:child_process";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const port = 4174;
const origin = `http://127.0.0.1:${port}`;
const basePath = "/Gabytron";
const outputDirectory = join(process.cwd(), "dist", "pages");
const serviceRoutes = [
  "campaigns",
  "lookbook",
  "corporate",
  "products",
  "portraits",
  "ecommerce",
  "events",
  "restoration",
  "film",
  "drones",
].map((slug) => `/services/${slug}`);
const routes = ["/", ...serviceRoutes];

const vinextCli = join(process.cwd(), "node_modules", "vinext", "dist", "cli.js");
const build = spawnSync(process.execPath, [vinextCli, "build"], {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit",
});
if (build.status !== 0) process.exit(build.status || 1);

await rm(outputDirectory, { recursive: true, force: true });
await cp(join(process.cwd(), "dist", "client"), outputDirectory, { recursive: true });

const server = spawn(process.execPath, [vinextCli, "start", "--hostname", "127.0.0.1", "--port", String(port)], {
  cwd: process.cwd(),
  env: process.env,
  stdio: ["ignore", "pipe", "pipe"],
});

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(origin);
      if (response.ok) return;
    } catch {
      // The production server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Timed out waiting for the production server.");
}

function makeStatic(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<link\b(?=[^>]*\brel=["']modulepreload["'])[^>]*>/gi, "")
    .replace(/\b(href|src|content)=(["'])\/(?!\/)/gi, `$1=$2${basePath}/`)
    .replace(/url\((["']?)\/(?!\/)/gi, `url($1${basePath}/`);
}

try {
  await waitForServer();
  for (const route of routes) {
    const response = await fetch(`${origin}${route}`);
    if (!response.ok) throw new Error(`Could not render ${route}: ${response.status}`);
    const html = makeStatic(await response.text());
    const destination = route === "/" ? join(outputDirectory, "index.html") : join(outputDirectory, route.slice(1), "index.html");
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, html, "utf8");
  }

  const homepage = await readFile(join(outputDirectory, "index.html"), "utf8");
  await writeFile(join(outputDirectory, "404.html"), homepage, "utf8");
  await writeFile(join(outputDirectory, ".nojekyll"), "", "utf8");
} finally {
  server.kill();
}

console.log(`Generated ${routes.length} static GitHub Pages routes in dist/pages.`);
