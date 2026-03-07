export const environment = Bun.env.NODE_ENV || "development";

const expiresInRaw = parseInt(Bun.env.JWT_EXPIRES_IN || "3600");
const expiresIn = isNaN(expiresInRaw) ? 3600 : expiresInRaw;

export const jwt = {
    // Environment variable or generate 32 random characters
    secret: Bun.env.JWT_SECRET || crypto.getRandomValues(new Uint8Array(32)).toString(),
    expiresIn,
}