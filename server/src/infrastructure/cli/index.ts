import type { IUserUseCases } from "@application/users/IUserUseCases";

import * as readline from "readline";
import { getAllFeatures, getFeature, buildCliFeatures } from "./commands";


function printUsage() {
    console.log("Usage: cli <feature> <command> [args...]");
    console.log("       cli interactive   - interactive mode");
    console.log("       cli exit          - exit the cli");
    console.log("       cli quit          - quit the cli");
    console.log("       cli help          - show this help");
    console.log("");
    console.log("Features and commands:");
    for (const f of getAllFeatures()) {
        console.log(`  ${f.name}: ${f.description ?? ""}`);
        for (const c of f.commands) {
            console.log(`    ${c.name} - ${c.description ?? ""}`);
        }
    }
    console.log("");
    console.log("Example: cli user activate <user-id>");
}

async function runCommand(parts: string[]): Promise<void> {
    const [fName, cName, ...cArgs] = parts;
    if (!fName || !cName) {
        console.error(`Feature or command not found`);
        return;
    }

    const feature = getFeature(fName);
    if (!feature) {
        console.error(`Feature ${fName} not found`);
        return;
    }

    const command = feature.commands.find(c => c.name === cName);
    if (!command) {
        console.error(`Command ${cName} not found in feature ${fName}`);
        return;
    }
    await command.run(cArgs);
}

function cliCompleter(line: string): [string[], string] {
    const features = getAllFeatures();
    const featureNames = [...features.map(f => f.name), "exit", "quit", "help"];

    const isAtWordBoundary = line.endsWith(" ") || line.length === 0;
    const words = line.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) {
        return [featureNames, line];
    }

    const [first, second] = words as [string, string | undefined];

    if (words.length === 1) {
        if (!isAtWordBoundary) {
            const hits = featureNames.filter(name => name.startsWith(first));
            return [hits.length ? hits : featureNames, line];
        }

        const feature = features.find(f => f.name === first);
        if (feature) {
            const commandNames = feature.commands.map(c => c.name);
            return [commandNames, line];
        }

        const hits = featureNames.filter((name: string) => name.startsWith(first));
        return [hits.length ? hits : featureNames, line];
    }

    const feature = features.find(f => f.name === first);
    if (!feature) {
        const hits = featureNames.filter((name: string) => name.startsWith(first));
        return [hits.length ? hits : featureNames, line];
    }

    const commandNames = feature.commands.map(c => c.name);
    const base = `${first} `;

    // Autocompletar el nombre del comando conservando la feature
    if (words.length === 2 && !isAtWordBoundary) {
        const hits = commandNames
            .filter((name: string) => (second ? name.startsWith(second) : true))
            .map(name => `${base}${name}`);
        return [hits.length ? hits : commandNames.map(name => `${base}${name}`), line];
    }

    // Si ya hay args, podemos seguir sugiriendo "feature comando"
    const fullCommands = commandNames.map(name => `${base}${name}`);
    return [fullCommands, line];
}

function runInteractiveMode() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        completer: cliCompleter,
    });
    rl.setPrompt("cli> ");

    const onLine = async (line: string) => {
        const trimmed = line.trim();
        if (!trimmed) {
            rl.prompt();
            return;
        }
        const lower = trimmed.toLowerCase();
        if (lower === "exit" || lower === "quit") {
            rl.close();
            process.exit(0);
            return;
        }


        if (lower === "help") {
            printUsage();
            rl.prompt();
            return;
        }

        const parts = trimmed.split(/\s+/).filter(Boolean);
        try {
            await runCommand(parts);
        } catch (err) {
            console.error(err);
        }
        rl.prompt();
    };

    rl.on("line", line => {
        onLine(line).catch(err => {
            console.error(err);
            rl.prompt();
        });
    });
    rl.prompt();
}

export async function createCli(
    interactive: boolean,
    userUseCases: IUserUseCases,
): Promise<void> {
    await buildCliFeatures({
        userUseCases,
    });

    if (interactive) {
        runInteractiveMode();
        return;
    }


    const args = process.argv.slice(2);
    const featureName = args[0];
    const commandName = args[1];
    const commandArgs = args.slice(2);


    if (!featureName || !commandName) {
        console.error("Usage: cli <feature> <command> [args...]");
        return;
    }


    if (featureName === "help" || featureName === "--help" || featureName === "-h") {
        printUsage();
        return;
    }

    const feature = getFeature(featureName);
    if (!feature) {
        console.error(`Feature ${featureName} not found`);
        console.log(
            `Available features:`,
            getAllFeatures().map(f => f.name).join(", "),
        );
        return;
    }

    const command = feature.commands.find(c => c.name === commandName);
    if (!command) {
        console.error(`Command ${commandName} not found in feature ${featureName}`);
        return;
    }
    await command.run(commandArgs);
}