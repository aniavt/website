import type { CliFeature, CliOptions } from "../types";
import { buildUserCommands } from "./user";

const _internal = {
    featureList: [] as CliFeature[],
};

export async function buildCliFeatures(options: CliOptions): Promise<void> {
    _internal.featureList = [
        buildUserCommands(options.userUseCases),
    ];
}

export function getFeature(name: string): CliFeature | undefined {
    return _internal.featureList.find(f => f.name === name);
}

export function getAllFeatures(): CliFeature[] {
    return _internal.featureList;
}
