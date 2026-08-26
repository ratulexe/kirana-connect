import { Sparkles } from "lucide-react";
import Container from "../../components/common/Container.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import ProductCard from "../../components/products/ProductCard.jsx";
import Skeleton from "../../components/common/Skeleton.jsx";
import { useProductSearch } from "../../hooks/useDiscovery.js";

/** Keeps the legacy /deals entry point useful without inventing discounts. */
export default function DealsPage() {
  const { data, isPending, isError, error } = useProductSearch({ limit: 12, offset: 0 });
  const products = data?.products ?? [];

  return (
    <Container className="py-10 sm:py-14">
      <section className="relative overflow-hidden rounded-panel bg-gradient-to-br from-[#e93483] via-[#7c3aed] to-[#4f36d9] p-7 text-white shadow-lg sm:p-10">
        <div aria-hidden="true" className="absolute -left-12 top-1/2 size-72 -translate-y-1/2 rounded-full bg-white/20 blur-3xl" />
        <div className="relative"><p className="inline-flex items-center gap-2 text-meta font-bold tracking-[.13em] text-[#ffec9d] uppercase"><Sparkles className="size-3.5" /> Live catalogue</p><h1 className="mt-3 text-heading text-white">Today&apos;s local finds</h1><p className="mt-2 max-w-xl text-body text-white/75">Explore real catalogue items, then open one to compare the prices listed by nearby shops.</p></div>
      </section>
      <section className="mt-8" aria-live="polite" aria-busy={isPending}>
        {isPending ? <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <li key={index}><Skeleton className="h-64 rounded-card" /></li>)}</ul> : null}
        {isError ? <EmptyState tone="error" icon={Sparkles} title="Could not load catalogue items" description={error?.message ?? "Please try again shortly."} /> : null}
        {!isPending && !isError && products.length === 0 ? <EmptyState icon={Sparkles} title="No catalogue items yet" description="Check back once nearby stores add products." /> : null}
        {products.length > 0 ? <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} />)}</ul> : null}
      </section>
    </Container>
  );
}
