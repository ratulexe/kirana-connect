import HeroSection from "../../features/home/HeroSection.jsx";
import CategoryStrip from "../../features/home/CategoryStrip.jsx";
import ComparisonPreview from "../../features/home/ComparisonPreview.jsx";
import HowItWorks from "../../features/home/HowItWorks.jsx";

export default function Home() {
  /**
   * Search has no destination yet: the results route arrives with the discovery
   * milestone. Local state only, deliberately not Zustand.
   */
  const handleSearch = (term) => {
    if (!term) return;
    console.info(`[kirana-connect] search submitted: ${term}`);
  };

  return (
    <>
      <HeroSection onSearch={handleSearch} />
      <CategoryStrip />
      <ComparisonPreview />
      <HowItWorks />
    </>
  );
}
