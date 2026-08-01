if (!Bun.env.JWT_SECRET?.trim()) {
  Bun.env.JWT_SECRET = "test-jwt-secret";
}
