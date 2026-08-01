// Bun: bson/mongodb call v8.startupSnapshot.isBuildingSnapshot (not implemented).
const getBuiltinModule = process.getBuiltinModule?.bind(process);
if (getBuiltinModule) {
  process.getBuiltinModule = ((id: string) => {
    const mod = getBuiltinModule(id);
    if (id !== "v8" || !mod) return mod;
    return {
      ...mod,
      startupSnapshot: {
        isBuildingSnapshot: () => false,
      },
    };
  }) as typeof process.getBuiltinModule;
}
