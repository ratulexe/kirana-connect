import HeroSection from '../../features/home/HeroSection.jsx';
import FlashSaleStrip from '../../features/home/FlashSaleStrip.jsx';
import CategoryStrip from '../../features/home/CategoryStrip.jsx';
import DiscoveryMoments from '../../features/home/DiscoveryMoments.jsx';
import LiveProductShelf from '../../features/home/LiveProductShelf.jsx';
import WhyKirana from '../../features/home/WhyKirana.jsx';
import HowItWorks from '../../features/home/HowItWorks.jsx';

export default function Home() {
  return (
    <>
      <HeroSection />
      <FlashSaleStrip />
      <CategoryStrip />
      <DiscoveryMoments />
      <LiveProductShelf />
      <WhyKirana />
      <HowItWorks />
    </>
  );
}
