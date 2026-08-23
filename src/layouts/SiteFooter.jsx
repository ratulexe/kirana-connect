import { ArrowUpRight } from "lucide-react";
import Container from "../components/common/Container.jsx";

/**
 * The Store Portal is a separately deployed application, so its address is
 * configuration rather than a hardcoded domain buried in markup.
 */
const STORE_PORTAL_URL =
  import.meta.env.VITE_STORE_PORTAL_URL ?? "http://localhost:5174";

export default function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line-soft bg-surface">
      <Container className="flex flex-col gap-8 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-card text-ink">Kirana Connect</p>
          <p className="mt-1 max-w-md text-meta text-ink-muted">
            Find what your neighbourhood shops actually have on the shelf, and what they
            charge for it.
          </p>
        </div>

        {/* The only business-facing entry point on the consumer site. There is
            deliberately no admin link anywhere in the public app. */}
        <div className="sm:text-right">
          <p className="text-meta font-semibold text-ink-soft">For businesses</p>
          <a
            href={STORE_PORTAL_URL}
            className="mt-1.5 inline-flex items-center gap-1 rounded-control text-meta font-semibold text-primary underline-offset-4 transition-colors duration-150 ease-brand hover:underline"
          >
            Register your store
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </a>
        </div>
      </Container>

      <Container className="border-t border-line-soft py-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-meta text-ink-muted">
            &copy; {new Date().getFullYear()} Kirana Connect
          </p>
          {/* The photos are contributed to the Open Food Facts family under
              CC BY-SA, which requires visible credit. */}
          <p className="text-meta text-ink-muted">
            Product photos from{" "}
            <a
              href="https://world.openfoodfacts.org"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-ink-soft"
            >
              Open Food Facts
            </a>
            , CC BY-SA
          </p>
        </div>
      </Container>
    </footer>
  );
}
