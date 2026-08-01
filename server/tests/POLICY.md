# Test policy (ania server)

1. Reproduce the failing case against the use-case or domain unit.
2. If production violates a domain or security rule → **fix production**.
3. If the test assumed the wrong correct contract → **fix the test**.
4. Never change production only to silence a test (hooks, flags, weaker asserts).
5. Doubles and test helpers live only under `server/tests/`. Do not add test doubles to `src/`.
