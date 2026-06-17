import Razorpay from "razorpay";
import crypto from "crypto";
import { ApiError } from "../../common/utils/api-error.js";
import { ok } from "../../common/utils/response.js";
import { setUserRole } from "../auth/auth.queries.js";
const validPaidRoles = ["bronze_subscriber", "silver_subscriber", "gold_subscriber"];
const razorpayClient = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});
export async function createOrder(req, res, next) {
    try {
        const { amountInPaise, currency = "INR", receipt } = req.body;
        if (!amountInPaise || typeof amountInPaise !== "number") {
            throw ApiError.badRequest("amountInPaise required and must be a number");
        }
        if (amountInPaise < 100) {
            throw ApiError.badRequest("amountInPaise must be at least 100");
        }
        const razorpayOrder = await razorpayClient.orders.create({
            amount: amountInPaise,
            currency,
            receipt: receipt ?? `receipt_${Date.now()}`,
        });
        ok(res, "Order created", {
            order_id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
        });
    }
    catch (err) {
        next(err);
    }
}
export async function verifyPayment(req, res, next) {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, target_role } = req.body;
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            throw ApiError.badRequest("razorpay_order_id, razorpay_payment_id, razorpay_signature all required");
        }
        if (!target_role || !validPaidRoles.includes(target_role)) {
            throw ApiError.badRequest("target_role must be one of: bronze_subscriber, silver_subscriber, gold_subscriber");
        }
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");
        if (expectedSignature !== razorpay_signature) {
            throw ApiError.badRequest("Payment signature mismatch");
        }
        const userId = req.user;
        const updatedUser = await setUserRole(userId, target_role);
        if (!updatedUser) {
            throw ApiError.internal("Failed to update user role");
        }
        ok(res, "Payment verified and role updated", {
            razorpay_order_id,
            razorpay_payment_id,
            new_role: updatedUser.role,
        });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=razorpay.controller.js.map