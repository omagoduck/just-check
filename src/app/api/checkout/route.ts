import { NextRequest, NextResponse } from "next/server";

const DODO_API_KEY = process.env.DODO_PAYMENTS_API_KEY;
const DODO_ENVIRONMENT = process.env.DODO_PAYMENTS_ENVIRONMENT || "test_mode";
const RETURN_URL = process.env.DODO_PAYMENTS_RETURN_URL || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/checkout/success`;

// TODO: P5. Check if we can use native library for DODO payments instead of making API calls manually.
// DODO API base URL
const DODO_API_URL =
  DODO_ENVIRONMENT === "live_mode"
    ? "https://live.dodopayments.com"
    : "https://test.dodopayments.com";

/**
 * Creates a DODO checkout session with customer association
 * 
 * Query Parameters:
 * - productId: DODO product ID to purchase
 * - customerId: DODO customer ID (optional, but recommended for subscription tracking)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const customerId = searchParams.get("customerId");

    if (!productId) {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 }
      );
    }

    // Build checkout payload
    const payload: any = {
      product_cart: [{ product_id: productId, quantity: 1 }],
      return_url: RETURN_URL,
    };

    // Add customer ID if provided (links subscription to customer)
    // Note: customer_id must be nested inside customer object
    if (customerId) {
      payload.customer = { customer_id: customerId };
    }

    // Call DODO API to create checkout session
    const response = await fetch(`${DODO_API_URL}/checkouts`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DODO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DODO checkout error:", errorText);
      return NextResponse.json(
        { error: "Failed to create checkout session", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      checkout_url: data.checkout_url,
      checkout_id: data.checkout_id,
      customer_id: customerId, // Return for reference
    });

  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Dynamic checkout with full payload control
 * Use this for more complex checkout scenarios
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, customerId, ...otherOptions } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 }
      );
    }

    const payload = {
      product_cart: [{ product_id: productId, quantity: 1 }],
      return_url: RETURN_URL,
      customer: customerId ? { customer_id: customerId } : undefined,
      ...otherOptions,
    };

    const response = await fetch(`${DODO_API_URL}/checkouts`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DODO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DODO checkout error:", errorText);
      return NextResponse.json(
        { error: "Failed to create checkout session", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      checkout_url: data.checkout_url,
      checkout_id: data.checkout_id,
    });

  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
