import { useState } from "react";
import { Link } from "react-router-dom";
import { LocateFixed, MapPin, Navigation, Search, Store } from "lucide-react";
import Container from "../../components/common/Container.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import Skeleton from "../../components/common/Skeleton.jsx";
import { useNearbyStores } from "../../hooks/useDiscovery.js";
import { useLocationStore } from "../../store/locationStore.js";
import { formatDistance } from "../../utils/format.js";

export default function StoresPage() {
  const [search, setSearch] = useState("");
  const { location, radiusKm, status, detect } = useLocationStore();
  const storesQuery = useNearbyStores({ location, radiusKm, limit: 20 });
  const stores = storesQuery.data?.stores ?? [];
  const searchTerm = search.trim().toLowerCase();
  const filtered = searchTerm
    ? stores.filter((store) => [store.name, store.locality, store.city].filter(Boolean).join(" ").toLowerCase().includes(searchTerm))
    : stores;

  return (
    <Container className="py-8 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="flex items-center gap-3 text-heading text-ink"><Store className="size-7 text-primary" />Nearby stores</h1><p className="mt-1 text-body text-ink-muted">Real verified stores within your selected area.</p></div>{!location ? <button type="button" onClick={detect} disabled={status === "locating"} className="inline-flex h-10 items-center gap-2 rounded-control bg-primary px-4 text-meta font-semibold text-white disabled:opacity-60"><LocateFixed className="size-4" />{status === "locating" ? "Finding you…" : "Use my location"}</button> : null}</div>
      {location ? <div className="relative mt-7"><Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search nearby stores" className="w-full rounded-control border border-line bg-surface py-2.5 pr-4 pl-10 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" /></div> : null}
      <section className="mt-6" aria-live="polite" aria-busy={storesQuery.isPending}>
        {!location ? <EmptyState icon={MapPin} title="Choose a location to find stores" description="Allow location access to see the verified shops closest to you." /> : null}
        {location && storesQuery.isPending ? <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <li key={index}><Skeleton className="h-44 rounded-card" /></li>)}</ul> : null}
        {location && storesQuery.isError ? <EmptyState tone="error" icon={Store} title="Could not load nearby stores" description={storesQuery.error?.message ?? "Please try again shortly."} /> : null}
        {location && !storesQuery.isPending && !storesQuery.isError && filtered.length === 0 ? <EmptyState icon={Search} title="No stores found" description={searchTerm ? "Try a different store name or locality." : "No verified stores are listed in this area yet."} /> : null}
        {filtered.length > 0 ? <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((store) => { const place = [store.locality, store.city, store.state].filter(Boolean).join(", "); const mapsQuery = encodeURIComponent([store.name, place].filter(Boolean).join(" ")); return <li key={store.id} className="glass-card card-lift flex min-h-44 flex-col justify-between rounded-card p-5"><div><span className="inline-flex size-11 items-center justify-center rounded-2xl bg-primary-soft text-primary"><Store className="size-5" /></span><h2 className="mt-4 truncate text-card text-ink">{store.name}</h2>{place ? <p className="mt-1 flex items-center gap-1 text-meta text-ink-muted"><MapPin className="size-3.5 shrink-0" />{place}</p> : null}{store.distance_km !== null && store.distance_km !== undefined ? <p className="mt-1 text-meta font-semibold text-primary">{formatDistance(store.distance_km)} away</p> : null}</div><div className="mt-5 flex gap-2"><a href={`https://maps.google.com/?q=${mapsQuery}`} target="_blank" rel="noopener noreferrer" className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-pill border border-primary/30 py-2 text-xs font-bold text-primary hover:bg-primary-soft"><Navigation className="size-3.5" />Directions</a><Link to={`/search?store_id=${store.id}`} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-pill bg-primary py-2 text-xs font-bold text-white hover:bg-primary-hover"><Search className="size-3.5" />Products</Link></div></li>; })}</ul> : null}
      </section>
    </Container>
  );
}
