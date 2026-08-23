import { useNavigate } from "react-router-dom";
import HeroSection from "../../features/home/HeroSection.jsx";
import CategoryStrip from "../../features/home/CategoryStrip.jsx";
import ComparisonPreview from "../../features/home/ComparisonPreview.jsx";
import HowItWorks from "../../features/home/HowItWorks.jsx";

export default function Home() {
  const navigate = useNavigate();

  const handleSearch = (term) => {
    navigate(term ? `/search?q=${encodeURIComponent(term)}` : "/search");
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
