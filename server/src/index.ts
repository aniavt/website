import { startCli, startHttpServer } from "./composition";


const cli = process.argv.includes("--cli");

if (cli) {
    const interactive = process.argv.includes("--interactive");
    // Remove --cli and --interactive from process.argv
    process.argv = process.argv.filter(arg => arg !== "--cli" && arg !== "--interactive");
    await startCli(interactive);
} else {
    await startHttpServer();
}
