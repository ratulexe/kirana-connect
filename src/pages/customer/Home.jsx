import HeroSection from "../../features/home/HeroSection.jsx";
import CategoryStrip from "../../features/home/CategoryStrip.jsx";
import LiveProductShelf from "../../features/home/LiveProductShelf.jsx";
import HowItWorks from "../../features/home/HowItWorks.jsx";

export default function Home() {
  return (
    <>
      <HeroSection />
      <CategoryStrip />
      <LiveProductShelf />
      <HowItWorks />
    </>
  );
}
