import { test, assert, assertStatus, json, jsonHeaders, authHeader, summary, BASE_URL, } from "./runner.js";
import crypto from "crypto";
const PAYMENTS = `${BASE_URL}/api/payments`;
const TOKEN = process.env.TEST_TOKEN;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
if (!TOKEN) {
    console.error("Set TEST_TOKEN env var to a valid access token.");
    process.exit(1);
}
console.log("\n── Razorpay ──");
let createdOrderId = "";
await test("POST /api/payments/create-order — creates an order for a valid amount", async () => {
    if (!RAZORPAY_KEY_SECRET) {
        console.log("    (skipped — RAZORPAY_KEY_SECRET not configured)");
        return;
    }
    const response = await fetch(`${PAYMENTS}/create-order`, {
        method: "POST",
        headers: jsonHeaders(TOKEN),
        body: JSON.stringify({
            amountInPaise: 50000,
            receipt: `test_receipt_${Date.now()}`,
        }),
    });
    await assertStatus(response, 200);
    const body = await json(response);
    assert(typeof body.data.order_id === "string", "order_id must be a string");
    assert(body.data.currency === "INR", "currency must default to INR");
    createdOrderId = body.data.order_id;
});
await test("POST /api/payments/create-order — rejects missing amountInPaise", async () => {
    const response = await fetch(`${PAYMENTS}/create-order`, {
        method: "POST",
        headers: jsonHeaders(TOKEN),
        body: JSON.stringify({ receipt: "test_receipt" }),
    });
    await assertStatus(response, 400);
});
await test("POST /api/payments/create-order — rejects amountInPaise below 100", async () => {
    const response = await fetch(`${PAYMENTS}/create-order`, {
        method: "POST",
        headers: jsonHeaders(TOKEN),
        body: JSON.stringify({ amountInPaise: 50 }),
    });
    await assertStatus(response, 400);
});
await test("POST /api/payments/create-order — rejects non-numeric amountInPaise", async () => {
    const response = await fetch(`${PAYMENTS}/create-order`, {
        method: "POST",
        headers: jsonHeaders(TOKEN),
        body: JSON.stringify({ amountInPaise: "5000" }),
    });
    await assertStatus(response, 400);
});
await test("POST /api/payments/create-order — rejects unauthenticated request", async () => {
    const response = await fetch(`${PAYMENTS}/create-order`, {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({ amountInPaise: 50000 }),
    });
    await assertStatus(response, 401);
});
await test("POST /api/payments/verify-payment — rejects missing razorpay fields", async () => {
    const response = await fetch(`${PAYMENTS}/verify-payment`, {
        method: "POST",
        headers: jsonHeaders(TOKEN),
        body: JSON.stringify({ target_role: "bronze_subscriber" }),
    });
    await assertStatus(response, 400);
});
await test("POST /api/payments/verify-payment — rejects invalid target_role", async () => {
    const response = await fetch(`${PAYMENTS}/verify-payment`, {
        method: "POST",
        headers: jsonHeaders(TOKEN),
        body: JSON.stringify({
            razorpay_order_id: createdOrderId || "order_fake123",
            razorpay_payment_id: "pay_fake123",
            razorpay_signature: "deadbeef",
            target_role: "platinum_subscriber",
        }),
    });
    await assertStatus(response, 400);
});
await test("POST /api/payments/verify-payment — rejects mismatched signature", async () => {
    const response = await fetch(`${PAYMENTS}/verify-payment`, {
        method: "POST",
        headers: jsonHeaders(TOKEN),
        body: JSON.stringify({
            razorpay_order_id: createdOrderId || "order_fake123",
            razorpay_payment_id: "pay_fake123",
            razorpay_signature: "deadbeef",
            target_role: "bronze_subscriber",
        }),
    });
    await assertStatus(response, 400);
});
await test("POST /api/payments/verify-payment — accepts valid signature and updates role", async () => {
    if (!RAZORPAY_KEY_SECRET) {
        console.log("    (skipped — RAZORPAY_KEY_SECRET not configured)");
        return;
    }
    const orderId = createdOrderId || `order_fake_${Date.now()}`;
    const paymentId = `pay_fake_${Date.now()}`;
    const validSignature = crypto
        .createHmac("sha256", RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");
    const response = await fetch(`${PAYMENTS}/verify-payment`, {
        method: "POST",
        headers: jsonHeaders(TOKEN),
        body: JSON.stringify({
            razorpay_order_id: orderId,
            razorpay_payment_id: paymentId,
            razorpay_signature: validSignature,
            target_role: "bronze_subscriber",
        }),
    });
    await assertStatus(response, 200);
    const body = await json(response);
    assert(body.data.new_role === "bronze_subscriber", "new_role must be bronze_subscriber");
});
await test("POST /api/payments/verify-payment — rejects unauthenticated request", async () => {
    const response = await fetch(`${PAYMENTS}/verify-payment`, {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({
            razorpay_order_id: "order_fake123",
            razorpay_payment_id: "pay_fake123",
            razorpay_signature: "deadbeef",
            target_role: "bronze_subscriber",
        }),
    });
    await assertStatus(response, 401);
});
summary("Razorpay");
//# sourceMappingURL=razorpay.test.js.map