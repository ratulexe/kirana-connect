import { useEffect, useState } from "react";
import { Lightbulb } from "lucide-react";

/**
 * The analysis modules each wait on a real external provider (OpenStreetMap,
 * Supabase aggregation, price rollups), which can genuinely take a few
 * seconds. A row of grey skeleton bars tells the entrepreneur nothing during
 * that wait, so this shows a live progress indicator plus a rotating,
 * verifiable business fact instead.
 *
 * Every fact below is a real, checkable founding/origin fact -- no invented
 * statistics, and deliberately no "X% of businesses fail"-style numbers,
 * which are exactly the kind of unsourced claim the rest of this report is
 * careful never to make.
 */
const BUSINESS_FACTS = [
  "Apple was founded on April Fool's Day, 1 April 1976.",
  "Nokia began in 1865 as a paper mill in south-western Finland.",
  "Amazon started in 1994 selling only books, out of a garage.",
  "Samsung opened in 1938 as a trading company dealing in dried fish, noodles and groceries.",
  "Nintendo was founded in 1889 -- it made handmade playing cards for almost 70 years before video games.",
  "Toyota began as Toyoda Automatic Loom Works, a maker of weaving machines.",
  "Haldiram's started as a single small sweet shop in Bikaner, Rajasthan in 1937.",
  "The Tata Group was founded in 1868 as a trading firm, long before steel or cars.",
  "Amul is a cooperative -- it is owned by the dairy farmers who supply it, not outside shareholders.",
  "Flipkart was started in 2007 by two former Amazon employees, selling books from a Bengaluru apartment.",
  "LEGO's name comes from the Danish 'leg godt', meaning 'play well'.",
  "Shell takes its name from a London shop that genuinely sold decorative seashells.",
  "Wrigley's began by giving chewing gum away free -- as a bonus with tins of baking powder.",
  "Reliance started in 1958 as a small textile trading business.",
  "Zomato began in 2008 as a menu-scanning site for a single office building.",
  "Wipro was incorporated in 1945 as 'Western India Palm Refined Oil Limited', selling vegetable and sunflower oils long before entering IT.",
  "Sony's first product in 1946 was an electric rice cooker that largely failed because it either undercooked or burned the rice.",
  "Infosys was founded in 1981 by seven engineers with an initial capital of just $250, borrowed from Narayana Murthy's wife, Sudha Murty.",
  "IKEA was founded by a 17-year-old in 1943, originally operating as a mail-order business for pens, wallets, and picture frames.",
  "Google's search engine was originally named 'BackRub' because the system checked backlinks to estimate the importance of a site.",
  "Mahindra & Mahindra was founded in 1945 as a steel trading company named 'Mahindra & Mohammed' before changing its name post-partition.",
  "Coca-Cola was invented in 1886 by an Atlanta pharmacist and was originally marketed as a nerve tonic.",
  "Netflix began in 1997 as a DVD-by-mail service, famously inspired after its co-founder was hit with a $40 late fee at Blockbuster.",
  "Peugeot started in 1810 as a steel foundry, making coffee mills, umbrella frames, and bicycles decades before building its first car.",
  "Oyo Rooms was founded by a 19-year-old college dropout, Ritesh Agarwal, starting out as a simple budget hotel aggregator.",
  "BMW originated in 1916 as a manufacturer of aircraft engines, shifting to motorcycles and cars only after World War I treaty restrictions.",
  "YouTube was originally launched in 2005 as a video-based online dating service called 'Tune In Hook Up'.",
  "Twitter's original bird logo was named 'Larry the Bird' as a tribute to the legendary Boston Celtics basketball player Larry Bird.",
  "Ben & Jerry's originally considered starting a bagel business, but pivoted to ice cream because bagel-making equipment was too expensive.",
  "Lamborghini started as a tractor manufacturer. Ferruccio Lamborghini only began making sports cars after being insulted by Enzo Ferrari over a clutch complaint."
];

const ROTATE_MS = 5000;

export default function LoadingInsight({ label = "Loading your local data..." }) {
  // Random starting point so two modules loading side by side don't show the
  // same fact, then rotate while the wait continues.
  const [index, setIndex] = useState(() => Math.floor(Math.random() * BUSINESS_FACTS.length));

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % BUSINESS_FACTS.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="mt-5 flex flex-col items-center justify-center rounded-panel border border-line bg-surface px-5 py-10 text-center"
      role="status"
      aria-live="polite"
    >
      {/* Three staggered dots -- a calmer "still working" signal than a
          spinning ring, and it reads fine at any size. */}
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className="size-2.5 rounded-pill bg-primary loading-dot"
            style={{ animationDelay: `${dot * 160}ms` }}
          />
        ))}
      </div>

      <p className="mt-4 text-meta font-semibold text-ink-soft">{label}</p>

      <div className="mt-5 max-w-md border-t border-line-soft pt-4">
        <p className="flex items-center justify-center gap-1.5 text-meta font-semibold text-primary">
          <Lightbulb className="size-3.5 shrink-0" aria-hidden="true" />
          Did you know?
        </p>
        <p className="mt-1.5 text-body text-balance text-ink-soft">{BUSINESS_FACTS[index]}</p>
      </div>
    </div>
  );
}
