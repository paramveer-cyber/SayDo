"use client";

import { useState } from "react";
import { paymentApi } from "../lib/api";

type PaymentState =
  | "idle"
  | "creating_order"
  | "verifying"
  | "success"
  | "error";

type PaidRole = "bronze_subscriber" | "silver_subscriber" | "gold_subscriber";

type RazorpayCheckoutButtonProps = {
  amountInPaise: number;
  currency?: string;
  label?: string;
  productName?: string;
  productDescription?: string;
  targetRole: PaidRole;
  onSuccess?: (newRole: string) => void;
  onError?: (errorMessage: string) => void;
  inverted?: boolean;
  accentColor?: string;
};

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-checkout-script")) {
      resolve(true);
      return;
    }
    const scriptTag = document.createElement("script");
    scriptTag.id = "razorpay-checkout-script";
    scriptTag.src = "https://checkout.razorpay.com/v1/checkout.js";
    scriptTag.onload = () => resolve(true);
    scriptTag.onerror = () => resolve(false);
    document.body.appendChild(scriptTag);
  });
}

export default function RazorpayCheckoutButton({
  amountInPaise,
  currency = "INR",
  label = "Pay Now",
  productName = "SayDo",
  productDescription,
  targetRole,
  onSuccess,
  onError,
  inverted = false,
  accentColor = "var(--border-strong)",
}: RazorpayCheckoutButtonProps) {
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const razorpayPublicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

  async function handlePayClick() {
    setErrorMessage(null);
    setPaymentState("creating_order");

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setErrorMessage("Failed to load payment gateway. Try again.");
      setPaymentState("error");
      onError?.("Failed to load Razorpay script");
      return;
    }

    let orderData;
    try {
      orderData = await paymentApi.createOrder(amountInPaise, currency);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create order";
      setErrorMessage(message);
      setPaymentState("error");
      onError?.(message);
      return;
    }

    const razorpayModal = new window.Razorpay({
      key: razorpayPublicKey!,
      amount: orderData.amount as number,
      currency: orderData.currency,
      name: productName,
      description: productDescription,
      order_id: orderData.order_id,
      prefill: {
        name: "",
        email: "",
        contact: "",
      },
      handler: async (paymentResponse) => {
        setPaymentState("verifying");
        try {
          const verifyResult = await paymentApi.verifyPayment({
            razorpay_order_id: paymentResponse.razorpay_order_id,
            razorpay_payment_id: paymentResponse.razorpay_payment_id,
            razorpay_signature: paymentResponse.razorpay_signature,
            target_role: targetRole,
          });
          setPaymentState("success");
          onSuccess?.(verifyResult.new_role);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Payment verification failed";
          setErrorMessage(message);
          setPaymentState("error");
          onError?.(message);
        }
      },
      theme: {
        color: "#00c45a",
      },
      modal: {
        ondismiss: () => {
          if (paymentState !== "success") setPaymentState("idle");
        },
      },
    });

    razorpayModal.on("payment.failed", (failedResponse) => {
      const message = failedResponse.error?.description ?? "Payment failed";
      setErrorMessage(message);
      setPaymentState("error");
      onError?.(message);
    });

    razorpayModal.open();
  }

  const isProcessing =
    paymentState === "creating_order" || paymentState === "verifying";
  const isSuccess = paymentState === "success";

  const borderColor =
    accentColor === "var(--border-strong)"
      ? "var(--border-strong)"
      : accentColor;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <button
        onClick={handlePayClick}
        disabled={isProcessing || isSuccess}
        style={{
          fontSize: "0.65rem",
          fontWeight: 800,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          padding: "0.8rem 1.5rem",
          background: isSuccess
            ? "var(--green-dim)"
            : inverted
              ? "var(--bg)"
              : "transparent",
          color: isSuccess
            ? "var(--green)"
            : inverted
              ? "var(--fg)"
              : inverted
                ? "var(--bg)"
                : "var(--fg)",
          border: inverted
            ? "none"
            : isSuccess
              ? "1px solid var(--green)"
              : `1px solid ${borderColor}`,
          cursor: isProcessing || isSuccess ? "not-allowed" : "pointer",
          fontFamily: "inherit",
          width: "100%",
          opacity: isProcessing ? 0.6 : 1,
          transition: "opacity 0.15s",
          clipPath:
            "polygon(0 0, 100% 0, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
        }}
        onMouseEnter={(e) => {
          if (!isProcessing && !isSuccess)
            e.currentTarget.style.opacity = "0.8";
        }}
        onMouseLeave={(e) => {
          if (!isProcessing && !isSuccess) e.currentTarget.style.opacity = "1";
        }}
      >
        {paymentState === "creating_order" && "Creating order…"}
        {paymentState === "verifying" && "Verifying payment…"}
        {isSuccess && "✓ Active"}
        {(paymentState === "idle" || paymentState === "error") && label}
      </button>

      {errorMessage && (
        <span
          style={{
            color: "var(--red)",
            fontSize: "0.65rem",
            letterSpacing: "0.04em",
          }}
        >
          {errorMessage}
        </span>
      )}
    </div>
  );
}
