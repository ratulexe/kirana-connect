import Container from "../components/common/Container.jsx";

export default function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line-soft bg-surface">
      <Container className="flex flex-col gap-3 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-card text-ink">Kirana Connect</p>
          <p className="mt-1 max-w-md text-meta text-ink-muted">
            Find what your neighbourhood shops actually have on the shelf, and what they
            charge for it.
          </p>
        </div>
        <p className="text-meta text-ink-muted">
          &copy; {new Date().getFullYear()} Kirana Connect
        </p>
      </Container>
    </footer>
  );
}
