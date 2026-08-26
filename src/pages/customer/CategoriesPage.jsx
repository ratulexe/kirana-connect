import { Link } from "react-router-dom";
import { LayoutGrid, PackageSearch } from "lucide-react";
import Container from "../../components/common/Container.jsx";
import Skeleton from "../../components/common/Skeleton.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import CategoryTile from "../../components/common/CategoryTile.jsx";
import { useCategories } from "../../hooks/useCategories.js";

function CategorySkeletons() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }, (_, index) => (
        <Skeleton key={index} className="h-40 rounded-card" />
      ))}
    </div>
  );
}

/**
 * A dedicated full-grid browse of every category, reached from the mobile
 * bottom nav (replacing what used to be a redundant second "Search" tab --
 * the header's own search icon already covers that). Tapping a category
 * hands off to the same /search?category= filter the rest of the app uses,
 * so there is no separate browsing logic to keep in sync.
 */
export default function CategoriesPage() {
  const { data: categories, isPending, isError } = useCategories();

  return (
    <Container className="py-8 sm:py-12">
      <h1 className="flex items-center gap-2.5 text-heading text-ink">
        <LayoutGrid className="size-6 text-primary" aria-hidden="true" />
        Browse categories
      </h1>
      <p className="mt-1 text-meta text-ink-muted">Every department in the catalogue, in one place.</p>

      <div className="mt-6" aria-busy={isPending}>
        {isPending ? <CategorySkeletons /> : null}

        {isError ? (
          <EmptyState
            tone="error"
            icon={PackageSearch}
            title="Categories could not be loaded"
            description="The discovery API did not respond. Please try again in a moment."
          />
        ) : null}

        {!isPending && !isError && categories?.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title="No categories yet"
            description="Once the catalogue is seeded, categories appear here."
          />
        ) : null}

        {!isPending && !isError && categories?.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category, index) => (
              <li key={category.id}>
                <Link
                  to={`/search?category=${category.slug}`}
                  className="glass-card hologram card-lift group flex h-full flex-col rounded-card p-4 transition-[border-color,box-shadow,transform] duration-200 ease-brand hover:-translate-y-1 hover:border-primary/35 hover:shadow-float"
                >
                  <CategoryTile category={category} index={index} />
                  <h3 className="text-card text-ink">{category.name}</h3>
                  {category.description ? (
                    <p className="mt-1 line-clamp-2 text-meta text-ink-muted">{category.description}</p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Container>
  );
}
