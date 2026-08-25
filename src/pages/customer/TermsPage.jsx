import Container from "../../components/common/Container.jsx";

export default function TermsPage() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-heading text-ink">Terms</h1>
        <p className="mt-2 text-body text-ink-muted">
          Kirana Connect is a prototype for discovering what nearby kirana stores stock and what
          they charge. Keep these in mind while using it.
        </p>

        <div className="mt-8 space-y-6 text-body text-ink-soft">
          <section>
            <h2 className="text-card text-ink">Prices and stock are store-provided</h2>
            <p className="mt-1.5">
              Store owners enter their own prices, stock status and expiry dates. Kirana Connect
              does not verify them in real time &mdash; call ahead if you want to be certain
              before visiting.
            </p>
          </section>

          <section>
            <h2 className="text-card text-ink">No orders, no payments</h2>
            <p className="mt-1.5">
              Nothing on Kirana Connect is a reservation, order, or purchase. You compare prices
              here, then buy at the store counter in person.
            </p>
          </section>

          <section>
            <h2 className="text-card text-ink">Product requests</h2>
            <p className="mt-1.5">
              Requesting a product that no nearby store stocks shares aggregated, anonymous
              demand with stores in your area. It is not a guarantee any store will start
              stocking it.
            </p>
          </section>
        </div>
      </div>
    </Container>
  );
}
