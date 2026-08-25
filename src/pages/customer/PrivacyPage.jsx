import Container from "../../components/common/Container.jsx";

export default function PrivacyPage() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-heading text-ink">Privacy</h1>
        <p className="mt-2 text-body text-ink-muted">
          Kirana Connect is a prototype. This page describes what the app actually does with your
          data today, not a formal legal policy.
        </p>

        <div className="mt-8 space-y-6 text-body text-ink-soft">
          <section>
            <h2 className="text-card text-ink">Location</h2>
            <p className="mt-1.5">
              If you share your location or search near a saved address, it is used only to sort
              stores by distance and is stored in your browser, not on our servers, unless you
              save an address to your account.
            </p>
          </section>

          <section>
            <h2 className="text-card text-ink">Account data</h2>
            <p className="mt-1.5">
              Signing in uses Supabase Auth. We store your email, saved addresses, and any product
              requests you make. We never see or store your password.
            </p>
          </section>

          <section>
            <h2 className="text-card text-ink">What we don&apos;t do</h2>
            <p className="mt-1.5">
              Kirana Connect does not process payments, place orders, or share your data with
              stores beyond aggregated, anonymous demand signals. There is no cart and no
              checkout, so no payment information is ever collected.
            </p>
          </section>
        </div>
      </div>
    </Container>
  );
}
