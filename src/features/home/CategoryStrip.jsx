import { Link } from "react-router-dom";
import { PackageSearch, ChevronRight, Coffee, CookingPot, Droplets, Sandwich, Sparkles, Apple } from "lucide-react";
import Container from "../../components/common/Container.jsx";
import SectionHeader from "../../components/common/SectionHeader.jsx";
import Skeleton from "../../components/common/Skeleton.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import { useCategories } from "../../hooks/useCategories.js";
import { useRevealOnScroll } from "../../animations/useRevealOnScroll.js";
import Tilt3DCard from "../../components/common/Tilt3DCard.jsx";

const ICON_GRADIENTS = [
  'from-pink-400 to-rose-500',
  'from-violet-400 to-purple-500',
  'from-blue-400 to-cyan-500',
  'from-orange-400 to-amber-500',
  'from-emerald-400 to-teal-500',
  'from-red-400 to-orange-500'
];

function CategoryCard({ category, index }) {
  const icons = [Coffee, CookingPot, Droplets, Sandwich, Apple, Sparkles];
  const Icon = icons[category.name.length % icons.length];
  const gradient = ICON_GRADIENTS[index % ICON_GRADIENTS.length];
  return (
    <Link
      to={`/search?category=${category.slug}`}
      className="glass-card hologram card-lift group flex h-full min-w-[10.5rem] flex-col justify-between gap-6 rounded-card p-4 transition-[border-color,box-shadow,transform] duration-200 ease-brand hover:-translate-y-1 hover:border-primary/35 hover:shadow-float sm:min-w-0"
    >
      <Tilt3DCard className="flex h-full flex-col justify-between gap-6">
        <div>
          <span className={`mb-4 inline-flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white transition duration-200 group-hover:rotate-6`}><Icon className="size-5" /></span>
          <h3 className="text-card text-ink">{category.name}</h3>
          {category.description ? (
            <p className="mt-1 line-clamp-2 text-meta text-ink-muted">{category.description}</p>
          ) : null}
        </div>
        <span className="inline-flex items-center gap-1 text-meta font-semibold text-primary">
          Browse
          <ChevronRight
            className="size-3.5 transition-transform duration-200 ease-brand group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      </Tilt3DCard>
    </Link>
  );
}

function CategorySkeletons() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-32 rounded-card" />
      ))}
    </div>
  );
}

export default function CategoryStrip() {
  const sectionRef = useRevealOnScroll();
  const { data: categories, isPending, isError } = useCategories();

  return (
    <section ref={sectionRef} aria-labelledby="categories-heading">
      <Container className="pt-14 sm:pt-20">
        <SectionHeader
          id="categories-heading"
          title="Shop by category"
          description="Everyday essentials, arranged for a little more discovery."
        />

        <div className="mt-6" aria-busy={isPending}>
          {isPending ? <CategorySkeletons /> : null}

          {isError ? (
            <EmptyState
              tone="error"
              icon={PackageSearch}
              title="Categories could not be loaded"
              description="The discovery API did not respond. Start the backend with npm run dev --prefix server and refresh."
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
            <ul className="scrollbar-neon -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-6">
              {categories.map((category, index) => (
                <li key={category.id} className="snap-start sm:snap-align-none">
                  <CategoryCard category={category} index={index} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
