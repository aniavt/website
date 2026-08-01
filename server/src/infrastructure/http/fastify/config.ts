export const environment = Bun.env.NODE_ENV || "development";

const expiresInRaw = parseInt(Bun.env.JWT_EXPIRES_IN || "3600");
const expiresIn = isNaN(expiresInRaw) ? 3600 : expiresInRaw;

const jwtSecret = Bun.env.JWT_SECRET?.trim();
if (!jwtSecret) {
    throw new Error("JWT_SECRET environment variable is required");
}

export const jwt = {
    secret: jwtSecret,
    expiresIn,
}
