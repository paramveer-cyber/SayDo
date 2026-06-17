import { test, assert, assertStatus, json, jsonHeaders, authHeader, summary, BASE_URL } from "./runner.js";
const AUTH = `${BASE_URL}/auth`;
const uniqueEmail = () => `testuser_${Date.now()}@example.com`;
let accessToken = "";
let refreshCookie = "";
const testEmail = uniqueEmail();
const testPassword = "securePassword123";
const testName = "Test User";
console.log("\n── Auth ──");
await test("POST /auth/register — creates account and returns token", async () => {
    const response = await fetch(`${AUTH}/register`, {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({ name: testName, email: testEmail, password: testPassword }),
    });
    await assertStatus(response, 201);
    const body = await json(response);
    assert(typeof body.data.token === "string", "token must be a string");
    accessToken = body.data.token;
    refreshCookie = response.headers.get("set-cookie") ?? "";
});
await test("POST /auth/register — rejects duplicate email", async () => {
    const response = await fetch(`${AUTH}/register`, {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({ name: testName, email: testEmail, password: testPassword }),
    });
    await assertStatus(response, 409);
});
await test("POST /auth/register — rejects invalid body (short password)", async () => {
    const response = await fetch(`${AUTH}/register`, {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({ name: "X", email: "bad@example.com", password: "short" }),
    });
    await assertStatus(response, 400);
});
await test("POST /auth/login — returns token for valid credentials", async () => {
    const response = await fetch(`${AUTH}/login`, {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    await assertStatus(response, 200);
    const body = await json(response);
    assert(typeof body.data.token === "string", "token must be a string");
    accessToken = body.data.token;
    refreshCookie = response.headers.get("set-cookie") ?? "";
});
await test("POST /auth/login — rejects wrong password", async () => {
    const response = await fetch(`${AUTH}/login`, {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({ email: testEmail, password: "wrongpassword" }),
    });
    await assertStatus(response, 401);
});
await test("POST /auth/login — rejects missing fields", async () => {
    const response = await fetch(`${AUTH}/login`, {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({ email: testEmail }),
    });
    await assertStatus(response, 400);
});
await test("GET /auth/me — returns current user with valid token", async () => {
    const response = await fetch(`${AUTH}/me`, {
        headers: authHeader(accessToken),
    });
    await assertStatus(response, 200);
    const body = await json(response);
    assert(body.data.user.email === testEmail, "email should match");
});
await test("GET /auth/me — rejects missing token", async () => {
    const response = await fetch(`${AUTH}/me`);
    await assertStatus(response, 401);
});
await test("GET /auth/me — rejects invalid token", async () => {
    const response = await fetch(`${AUTH}/me`, {
        headers: authHeader("invalid.token.here"),
    });
    await assertStatus(response, 401);
});
await test("POST /auth/refresh — refreshes token using cookie", async () => {
    const response = await fetch(`${AUTH}/refresh`, {
        method: "POST",
        headers: { Cookie: refreshCookie },
    });
    await assertStatus(response, 200);
    const body = await json(response);
    assert(typeof body.data.token === "string", "new token must be a string");
    accessToken = body.data.token;
    refreshCookie = response.headers.get("set-cookie") ?? refreshCookie;
});
await test("POST /auth/refresh — rejects missing cookie", async () => {
    const response = await fetch(`${AUTH}/refresh`, { method: "POST" });
    await assertStatus(response, 401);
});
await test("GET /auth/connect-link — returns OAuth URL for valid pluginId", async () => {
    const response = await fetch(`${AUTH}/connect-link?pluginId=gmail`, {
        headers: authHeader(accessToken),
    });
    await assertStatus(response, 200);
    const body = await json(response);
    assert(typeof body.data.url === "string", "url must be a string");
    assert(body.data.url.startsWith("https://"), "url must be https");
});
await test("GET /auth/connect-link — rejects missing pluginId", async () => {
    const response = await fetch(`${AUTH}/connect-link`, {
        headers: authHeader(accessToken),
    });
    await assertStatus(response, 400);
});
await test("POST /auth/logout — clears session", async () => {
    const response = await fetch(`${AUTH}/logout`, {
        method: "POST",
        headers: { Cookie: refreshCookie },
    });
    await assertStatus(response, 200);
});
await test("DELETE /auth/account — deletes the account", async () => {
    const registerResponse = await fetch(`${AUTH}/register`, {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({
            name: "To Delete",
            email: uniqueEmail(),
            password: "deleteMe123",
        }),
    });
    const { data } = await json(registerResponse);
    const response = await fetch(`${AUTH}/account`, {
        method: "DELETE",
        headers: authHeader(data.token),
    });
    await assertStatus(response, 200);
});
summary("Auth");
//# sourceMappingURL=auth.test.js.map