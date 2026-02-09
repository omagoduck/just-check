import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-client";
import { createClerkClient } from "@clerk/nextjs/server";

const DODO_API_KEY = process.env.DODO_PAYMENTS_API_KEY;
const DODO_ENVIRONMENT = process.env.DODO_PAYMENTS_ENVIRONMENT || "test_mode";
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

// DODO API base URL
const DODO_API_URL =
  DODO_ENVIRONMENT === "live_mode"
    ? "https://live.dodopayments.com"
    : "https://test.dodopayments.com";

interface CreateOrGetCustomerRequest {
  clerkUserId: string;
}

interface DODOCustomer {
  customer_id: string;
  email: string;
  name: string;
  metadata?: Record<string, any>;
}

/**
 * Creates or retrieves a DODO customer for a given Clerk user
 * 
 * Flow:
 * 1. Check if mapping exists in database
 * 2. If exists, return existing dodo_customer_id
 * 3. If not, create new DODO customer and store mapping
 */
export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdminClient();

  try {
    // Step 1: Parse request body
    const body: CreateOrGetCustomerRequest = await request.json();
    const { clerkUserId } = body;

    if (!clerkUserId) {
      return NextResponse.json(
        { error: "clerkUserId is required" },
        { status: 400 }
      );
    }

    // Step 2: Check if mapping already exists
    const { data: existingMapping, error: mappingError } = await supabase
      .from("dodo_customer_mapping")
      .select("dodo_customer_id")
      .eq("clerk_user_id", clerkUserId)
      .maybeSingle();

    if (mappingError) {
      console.error("Error checking customer mapping:", mappingError);
      return NextResponse.json(
        { error: "Database error checking mapping" },
        { status: 500 }
      );
    }

    // Step 3: If mapping exists, return existing customer ID
    if (existingMapping) {
      return NextResponse.json({
        dodoCustomerId: existingMapping.dodo_customer_id,
        isNew: false,
      });
    }

    // Step 4: Get user details from Clerk
    let clerkUser;
    try {
      const clerkClient = createClerkClient({ secretKey: CLERK_SECRET_KEY });
      clerkUser = await clerkClient.users.getUser(clerkUserId);
    } catch (clerkError) {
      console.error("Error fetching user from Clerk:", clerkError);
      return NextResponse.json(
        { error: "User not found in Clerk" },
        { status: 404 }
      );
    }

    // Extract email and name from Clerk user
    const email = clerkUser.emailAddresses[0]?.emailAddress;
    const name = clerkUser.fullName || clerkUser.firstName || clerkUser.username || "User";

    if (!email) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    // Step 5: Create new DODO customer
    let dodoCustomer: DODOCustomer;
    try {
      const response = await fetch(`${DODO_API_URL}/customers`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${DODO_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          name,
          metadata: {
            clerk_user_id: clerkUserId,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("DODO API error:", errorText);
        return NextResponse.json(
          { error: "Failed to create DODO customer", details: errorText },
          { status: response.status }
        );
      }

      dodoCustomer = await response.json();
    } catch (dodoError) {
      console.error("Error calling DODO API:", dodoError);
      return NextResponse.json(
        { error: "Failed to connect to DODO API" },
        { status: 500 }
      );
    }

    // Step 6: Store mapping in database
    const { error: insertError } = await supabase
      .from("dodo_customer_mapping")
      .insert({
        clerk_user_id: clerkUserId,
        dodo_customer_id: dodoCustomer.customer_id,
      });

    if (insertError) {
      console.error("Error storing customer mapping:", insertError);
      // Note: Customer was created in DODO but mapping failed
      // This is a data inconsistency that should be monitored
      return NextResponse.json(
        { error: "Failed to store customer mapping", dodoCustomerId: dodoCustomer.customer_id },
        { status: 500 }
      );
    }

    // Step 7: Return new customer ID
    return NextResponse.json({
      dodoCustomerId: dodoCustomer.customer_id,
      isNew: true,
    });

  } catch (error) {
    console.error("Unexpected error in create-or-get-customer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
