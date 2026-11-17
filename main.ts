// fun.board entrypoint.
//
// The make.fun runner reads this file to learn which runtime the app
// wants. We ask for Node 22 and then hand control to the static server
// in serve.ts, which is plain TypeScript-flavoured JavaScript that the
// Node type-stripping loader can execute directly.

export const runtime = "node22";

const major = Number(process.versions.node.split(".")[0]);
if (major < 22) {
  console.error(`fun.board needs Node 22 or newer, found ${process.versions.node}`);
  process.exit(1);
}

const { startServer } = await import("./serve.ts");

const port = Number(process.env.PORT ?? 4173);
const server = startServer(port);
console.log(`fun.board listening on http://localhost:${server.port}`);

process.on("SIGINT", () => {
  server.close();
  process.exit(0);
});
