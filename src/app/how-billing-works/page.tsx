import type { Metadata } from "next";
import Link from "next/link";
import {
  APP_BRAND_NAME,
  APP_BRAND_SHORT_NAME,
  PARENT_COMPANY_BRAND_NAME,
} from "@/lib/branding-constants";

const SUPPORT_EMAIL = "snack-outline-slam@duck.com";

export const metadata: Metadata = {
  title: `How Billing Works | ${APP_BRAND_NAME}`,
  description: `How billing works for ${APP_BRAND_NAME}, including checkout charges, renewals, plan changes, cancellation, wallet credits, refunds, and Dodo Payments.`,
};

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="space-y-4 scroll-mt-20">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
      <div className="space-y-4 text-sm leading-7 text-muted-foreground sm:text-base">
        {children}
      </div>
    </section>
  );
}

export default function HowBillingWorksPage() {
  return (
    <main className="min-h-screen bg-background">
      <article className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
        <header className="space-y-5 border-b pb-8">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Billing Information
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              How Billing Works
            </h1>
          </div>

          <div className="space-y-4 text-sm leading-7 text-muted-foreground sm:text-base">
            <p>
              {APP_BRAND_SHORT_NAME} is an AI software product developed and operated by{" "}
              {PARENT_COMPANY_BRAND_NAME}. This page explains how billing works, clearly and
              without unnecessary complexity. Please read it before subscribing.
            </p>
            <p>
              This page applies only to billing for {APP_BRAND_SHORT_NAME}. It does not explain
              billing for every {PARENT_COMPANY_BRAND_NAME} product, service, experiment, or
              platform.
            </p>
            <p>Last updated: 19th April 2026</p>
          </div>
        </header>

        <nav aria-label="How billing works sections" className="space-y-3 border-b pb-8 text-sm">
          <p className="font-medium text-foreground">On this page</p>
          <div className="grid gap-2 text-muted-foreground sm:grid-cols-2">
            <Link href="#payment-processor" className="hover:text-foreground">
              1. Payment Processor
            </Link>
            <Link href="#checkout" className="hover:text-foreground">
              2. What You Are Charged at Checkout
            </Link>
            <Link href="#currency" className="hover:text-foreground">
              3. Currency and Local Pricing
            </Link>
            <Link href="#renewals" className="hover:text-foreground">
              4. Subscription Renewals
            </Link>
            <Link href="#plan-changes" className="hover:text-foreground">
              5. Plan Changes
            </Link>
            <Link href="#cancellation" className="hover:text-foreground">
              6. Cancellation
            </Link>
            <Link href="#wallet" className="hover:text-foreground">
              7. Wallet and Credit Balance
            </Link>
            <Link href="#refunds" className="hover:text-foreground">
              8. How Refund Work
            </Link>
            <Link href="#queries" className="hover:text-foreground">
              9. General and Billing Queries
            </Link>
            <Link href="#changes" className="hover:text-foreground">
              10. Changes to How Billing Works
            </Link>
          </div>
        </nav>

        <Section id="payment-processor" title="1. Payment Processor">
          <p>
            All payments for {APP_BRAND_SHORT_NAME} are processed by Dodo Payments, a global
            Merchant of Record platform.
          </p>
          <p>What this means for you:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              The charge on your bank or card statement may appear under Dodo Payments, not{" "}
              {PARENT_COMPANY_BRAND_NAME} or {APP_BRAND_SHORT_NAME}. This is expected for purchases
              processed through Dodo Payments.
            </li>
            <li>
              Dodo Payments is the seller of record for the payment transaction. They handle
              checkout, payment processing, tax calculation and collection, invoicing, and related
              compliance responsibilities for supported regions.
            </li>
            <li>
              Because Dodo Payments acts as the Merchant of Record, applicable taxes such as VAT,
              GST, sales tax, or similar charges are calculated and collected through Dodo Payments
              based on the transaction and billing context.
            </li>
            <li>
              If you see a charge from Dodo Payments and believe it may be related to{" "}
              {APP_BRAND_SHORT_NAME}, contact us at the support email listed at the bottom of this
              page so we can help identify it.
            </li>
          </ul>
        </Section>

        <Section id="checkout" title="2. What You Are Charged at Checkout">
          <p>When you complete a new subscription checkout, the total amount charged is:</p>
          <div className="rounded-md border bg-muted/30 p-4 font-mono text-sm text-foreground">
            Subscription price as shown
            <br />
            + payment provider processing fee
            <br />
            + applicable tax or VAT based on your location
            <br />= total charged
          </div>
          <p>
            The breakdown should be shown before you confirm your payment. The final total displayed
            in the Dodo Payments checkout flow is the amount you should expect to be charged for
            that checkout.
          </p>
          <p>
            {PARENT_COMPANY_BRAND_NAME} does not add a separate hidden charge beyond the amount
            displayed at checkout. However, Dodo Payments may include provider fees, tax, VAT,
            currency conversion, or other checkout-calculated amounts in the final total shown
            before payment.
          </p>
          <p>
            Wallet or credit balance, if any, currently cannot be applied to new checkout sessions.
            Wallet credit applies to recurring subscription renewals only. See Section 7 for more
            details. This behavior is controlled by Dodo Payments and may change in the future.
          </p>
        </Section>

        <Section id="currency" title="3. Currency and Local Pricing">
          <p>
            Dodo Payments supports many currencies globally. At checkout, Dodo Payments may detect
            your location and show a supported local currency where available.
          </p>
          <p>
            Not all currencies are available. Currency support is determined by Dodo Payments based
            on its platform capabilities, regional coverage, payment methods, and checkout rules.
            It is not something {PARENT_COMPANY_BRAND_NAME} can manually enable for an individual
            user.
          </p>
          <p>
            If your local currency is not available at checkout, it likely means that currency is
            not supported for that checkout flow. In that case, you may need to complete the
            purchase in another available currency, usually USD.
          </p>
          <p>
            If you pay in a currency other than USD, or if your payment requires currency
            conversion, an additional currency conversion fee may apply. Any such fee is determined
            through Dodo Payments or the relevant payment/banking flow and should be reflected in
            the final total shown before you confirm payment.
          </p>
        </Section>

        <Section id="renewals" title="4. Subscription Renewals">
          <p>
            Subscriptions renew automatically at the end of each billing cycle, unless the
            subscription is cancelled before renewal. The billing cycle may be monthly or another
            period depending on the plan available at the time of purchase.
          </p>
          <p>
            Renewal charges follow the same general structure as checkout charges: subscription
            price, plus applicable provider fees, taxes, VAT, or similar billing amounts where
            applicable.
          </p>
          <p>
            Dodo Payments may send billing emails, invoices, receipts, or other renewal-related
            notices depending on the billing flow. We may also provide account or app-level
            indicators where available. You should still manage your subscription actively and not
            rely only on receiving a reminder.
          </p>
          <p>
            If a renewal payment fails, Dodo Payments may attempt to retry the charge. Access may be
            suspended, placed on hold, downgraded, or cancelled if the payment cannot be recovered
            after retries or provider handling.
          </p>
        </Section>

        <Section id="plan-changes" title="5. Plan Changes - Upgrades and Downgrades">
          <h3 className="text-lg font-semibold text-foreground">Upgrading</h3>
          <p>
            If you upgrade to a higher plan, the upgrade is intended to take effect immediately
            after successful payment.
          </p>
          <p>
            You are charged a prorated amount for the remainder of your current billing cycle. This
            means you only pay the adjusted difference for the time left in the active cycle, not
            necessarily the full new plan price for a fresh full cycle.
          </p>
          <p>
            If the required payment does not succeed, the upgrade may not be applied.
          </p>

          <h3 className="pt-4 text-lg font-semibold text-foreground">Downgrading</h3>
          <p>
            If you downgrade to a lower plan, the downgrade is intended to take effect immediately
            after the plan change succeeds.
          </p>
          <p>
            Downgrades are also prorated. Because the new plan costs less than the previous plan,
            the unused value from the higher plan may be calculated as a credit rather than charged
            as an additional payment.
          </p>
          <p>
            Any prorated money or credit resulting from a downgrade may be funded to your Dodo
            Payments wallet balance for use on future recurring subscription renewals. For more
            information, see Section 7, Wallet and Credit Balance.
          </p>
        </Section>

        <Section id="cancellation" title="6. Cancellation">
          <p>You may cancel your subscription at any time.</p>
          <p>Upon cancellation:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              Your subscription is not normally terminated immediately. You retain access to{" "}
              {APP_BRAND_SHORT_NAME} for the remainder of your active billing period.
            </li>
            <li>
              At the end of that billing period, your subscription expires and should not renew
              automatically.
            </li>
            <li>
              No partial refund is issued automatically for unused days upon cancellation. If you
              believe you qualify for a refund, see Section 8.
            </li>
          </ul>
        </Section>

        <Section id="wallet" title="7. Wallet and Credit Balance">
          <p>
            Dodo Payments provides a wallet system where credit can be stored. For this billing
            flow, wallet credit should be understood as a Dodo Payments billing balance, commonly
            denominated in USD.
          </p>
          <p>Your wallet may receive credit in cases such as:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              prorated amounts credited from a plan change, such as unused subscription value being
              credited rather than refunded,
            </li>
            <li>other credit applied to your account by {PARENT_COMPANY_BRAND_NAME}, if any.</li>
          </ul>
          <p>Important limitations to understand:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              Wallet credit is not withdrawable as cash. It is stored value within the Dodo
              Payments billing system.
            </li>
            <li>
              Wallet credit is applied to recurring subscription renewals where Dodo Payments
              supports and applies it. It may reduce what you are charged at renewal time.
            </li>
            <li>
              Wallet credit cannot currently be applied to new checkout sessions for fresh
              subscriptions. Dodo Payments has indicated this checkout support is not available yet.
              If Dodo Payments enables it later, the live checkout behavior may change before this
              page is updated.
            </li>
            <li>
              Credits are generally denominated in USD for this flow, regardless of your local
              currency or the currency you used to pay.
            </li>
          </ul>
          <p>
            Wallet behavior is controlled by Dodo Payments. We will try to keep this page current,
            but there may be a delay between a Dodo Payments platform change and an update to this
            page.
          </p>
        </Section>

        <Section id="refunds" title="8. How Refund Work">
          <p>We want billing to be fair. This is how refund work.</p>

          <h3 className="text-lg font-semibold text-foreground">Eligibility Window</h3>
          <p>
            You may submit a refund request within 14 calendar days of your subscription charge.
            Requests submitted after this window will not be considered.
          </p>

          <h3 className="pt-4 text-lg font-semibold text-foreground">Partial Refunds</h3>
          <p>
            Refunds are not automatic. If a refund is approved, it may be full or partial depending
            on the billing facts, time passed, and usage review.
          </p>
          <p>
            Partial refunds may be prorated based on how many days have passed since the charge.
            The more time that has elapsed, the smaller the refundable amount may be. This
            consideration is similar in concept to proration on plan changes, but it does not
            guarantee that a refund will be approved.
          </p>

          <h3 className="pt-4 text-lg font-semibold text-foreground">Usage Review</h3>
          <p>
            Every refund request is reviewed by our team. We assess whether the subscription usage
            during that period appears intentional, accidental, mistaken, or otherwise reasonably
            refundable.
          </p>
          <p>
            If the account shows clear, deliberate usage of {APP_BRAND_SHORT_NAME} during the
            billing period, the refund may be denied partially or entirely. This protects against
            misuse of the refund process.
          </p>

          <h3 className="pt-4 text-lg font-semibold text-foreground">
            What You Must Include in Your Request
          </h3>
          <p>
            A refund request must include all of the following. Incomplete requests may be ignored
            and may not receive a response:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b text-foreground">
                  <th className="py-2 pr-4 font-semibold">Required information</th>
                  <th className="py-2 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="py-3 pr-4 text-foreground">Payment email</td>
                  <td className="py-3">The email address used at checkout or linked to the payment.</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-foreground">Oearol account email</td>
                  <td className="py-3">
                    The email linked to your {APP_BRAND_SHORT_NAME} or{" "}
                    {PARENT_COMPANY_BRAND_NAME} account on the platform.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-foreground">Clear description</td>
                  <td className="py-3">What happened, explained clearly.</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-foreground">Reason for request</td>
                  <td className="py-3">Why you believe a refund is warranted.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>If any of the above is missing, your request may not be processed.</p>

          <h3 className="pt-4 text-lg font-semibold text-foreground">Processing Timeline</h3>
          <p>Once you submit a complete refund request:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              Review phase: our team will review your request. This normally takes up to 14
              business days from receipt.
            </li>
            <li>
              If approved, payout phase: after approval, it may take an additional 7 business days
              for the funds to return through the original payment flow via Dodo Payments.
            </li>
          </ul>
          <p>
            These timelines reflect normal conditions. Payment provider load, banking schedules,
            weekends, public holidays, compliance review, or other operational issues may extend
            the process. These delays may be outside our direct control.
          </p>

          <h3 className="pt-4 text-lg font-semibold text-foreground">Refunds Are Not Applicable To</h3>
          <ul className="list-disc space-y-2 pl-6">
            <li>requests submitted after the 14-day window,</li>
            <li>accounts with clear intentional usage during the billing period,</li>
            <li>incomplete requests missing required information,</li>
            <li>requests that cannot be verified against the relevant billing record.</li>
          </ul>

          <h3 className="pt-4 text-lg font-semibold text-foreground">How to Submit a Refund Request</h3>
          <p>
            Send your request to{" "}
            <a className="font-medium text-foreground underline underline-offset-4" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
          <p>
            Use the subject line:{" "}
            <span className="font-medium text-foreground">
              Refund Request - [reason in one short line]
            </span>
          </p>
        </Section>

        <Section id="queries" title="9. General and Billing Queries">
          <p>
            For any billing questions not covered above, including issues with charges, invoices,
            payment failures, or account access, reach out to us at{" "}
            <a className="font-medium text-foreground underline underline-offset-4" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
          <p>
            Please include your account email and a clear description of your issue in the message.
          </p>
        </Section>

        <Section id="changes" title="10. Changes to How Billing Works">
          <p>
            {PARENT_COMPANY_BRAND_NAME} reserves the right to modify how billing works for{" "}
            {APP_BRAND_SHORT_NAME} at any
            time, including changes to how subscriptions are structured, how billing is calculated,
            how plan changes are handled, how wallet or credit behavior is described, and how the
            overall payment system operates.
          </p>
          <p>
            If we make material changes, we will take reasonable steps to notify affected users,
            such as by email to your registered {PARENT_COMPANY_BRAND_NAME} account address,
            in-app notification, notice on the relevant billing page, or another appropriate method.
          </p>
          <p>
            Continued use of {APP_BRAND_SHORT_NAME} after the effective date of any updated billing
            explanation, billing page, or flow may mean the updated billing process applies going forward,
            subject to applicable law and any notice requirements.
          </p>
          <p>
            Some aspects of billing, such as currency availability, wallet behavior, checkout
            features, payment methods, processing fees, and tax handling, are governed by Dodo
            Payments rather than {PARENT_COMPANY_BRAND_NAME}. When Dodo Payments changes its
            platform, those changes may affect your live billing experience before this page is
            updated.
          </p>
          <p>
            We do our best to keep this page current, but there may be a period where live provider
            behavior differs from what is written here. This page is specific to{" "}
            {APP_BRAND_SHORT_NAME}; other {PARENT_COMPANY_BRAND_NAME} products may have different
            billing flows or terms. When in doubt, contact us at{" "}
            <a className="font-medium text-foreground underline underline-offset-4" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </Section>

        <footer className="border-t pt-8 text-sm leading-7 text-muted-foreground">
          <p>
            {APP_BRAND_SHORT_NAME} is a product of {PARENT_COMPANY_BRAND_NAME}. Billing is
            processed by Dodo Payments for transactions involving {APP_BRAND_SHORT_NAME}.
          </p>
          <p className="mt-4">
            <Link href="/upgrade" className="font-medium text-foreground underline underline-offset-4">
              Back to pricing
            </Link>
          </p>
        </footer>
      </article>
    </main>
  );
}
