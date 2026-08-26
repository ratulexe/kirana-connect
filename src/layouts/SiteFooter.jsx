import { ArrowUp, ArrowUpRight, Globe, MessageCircle, Share2, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Container from '../components/common/Container.jsx';

const STORE_PORTAL_URL = import.meta.env.VITE_STORE_PORTAL_URL ?? 'http://localhost:5174';

const FOOTER_LINKS = {
  Discover: [
    { label: 'Home', to: '/' },
    { label: 'Search Products', to: '/search' },
    { label: 'Trending', to: '/trending' },
    { label: 'Flash Deals', to: '/deals' },
    { label: 'Nearby Stores', to: '/stores' },
  ],
  Account: [
    { label: 'Sign In', to: '/login' },
    { label: 'Register', to: '/register' },
    { label: 'My Orders', to: '/orders' },
    { label: 'Wishlist', to: '/wishlist' },
  ],
};

const TwitterIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
    <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
  </svg>
);

const InstagramIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FacebookIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const LinkedinIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const SOCIAL = [
  { icon: TwitterIcon, label: 'Twitter', href: 'https://twitter.com' },
  { icon: InstagramIcon, label: 'Instagram', href: 'https://instagram.com' },
  { icon: FacebookIcon, label: 'Facebook', href: 'https://facebook.com' },
  { icon: LinkedinIcon, label: 'LinkedIn', href: 'https://linkedin.com' },
];

export default function SiteFooter() {
  const [showTop, setShowTop] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const handleScroll = () => setShowTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <footer className="relative mt-20 overflow-hidden bg-white border-t border-line text-ink">
      <div aria-hidden className="absolute -right-16 -top-20 size-72 rounded-full bg-pink-500/5 blur-3xl" />
      <div aria-hidden className="absolute -left-20 bottom-0 size-80 rounded-full bg-primary/5 blur-3xl" />
      <div aria-hidden className="hero-grid absolute inset-0 opacity-[0.03]" />

      <Container className="relative py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand col */}
          <div>
            <p className="text-[1.1rem] font-black tracking-tight text-ink">
              Kirana <span className="gradient-text">Connect</span>
            </p>
            <p className="mt-3 max-w-xs text-sm text-ink-muted leading-relaxed">
              Find what your neighbourhood shops actually have on the shelf, and what they charge for it.
            </p>
            {/* Social */}
            <div className="mt-5 flex gap-3">
              {SOCIAL.map(({ icon: Icon, label, href }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                  className="neon-btn inline-flex size-9 items-center justify-center rounded-full border border-line bg-surface-sunken text-ink-muted transition hover:border-primary/50 hover:bg-primary-soft hover:text-primary">
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
            <p className="mt-5 text-xs text-ink-muted/60">Made for Indian neighbourhoods</p>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-ink">{section}</p>
              <ul className="space-y-2.5">
                {links.map(({ label, to }) => (
                  <li key={to}>
                    <Link to={to} className="group flex items-center gap-1 text-sm text-ink-muted transition hover:text-primary">
                      <span className="transition-transform group-hover:translate-x-0.5">{label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Sellers col */}
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-ink">For Businesses</p>
            <ul className="space-y-2.5">
              <li>
                <a href={STORE_PORTAL_URL} className="group flex items-center gap-1.5 text-sm text-ink-muted transition hover:text-primary">
                  Register your store <ArrowUpRight className="size-3.5" />
                </a>
              </li>
              <li><span className="text-sm text-ink-muted/60">How it works for sellers</span></li>
            </ul>

            {/* Newsletter */}
            <div className="mt-8">
              <p className="text-xs font-bold text-ink mb-2 uppercase tracking-widest">Stay updated</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 min-w-0 rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink placeholder-ink-muted/50 focus:border-primary focus:bg-white focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => { if (email) setEmail(''); }}
                  className="neon-btn rounded-control bg-primary px-3 py-2 text-xs font-bold text-white"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>
      </Container>

      <Container className="relative border-t border-line py-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-muted">&copy; {new Date().getFullYear()} Kirana Connect</p>
          <p className="text-xs text-ink-muted">
            Product photos from{' '}
            <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink transition">Open Food Facts</a>
            , CC BY-SA
          </p>
          <div className="flex gap-4">
            <Link to="/privacy" className="text-xs text-ink-muted hover:text-ink transition">Privacy</Link>
            <Link to="/terms" className="text-xs text-ink-muted hover:text-ink transition">Terms</Link>
          </div>
        </div>
      </Container>

      {/* Back to top */}
      {showTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-24 right-4 z-30 inline-flex size-10 items-center justify-center rounded-full bg-primary text-white shadow-lg neon-btn md:bottom-24"
          aria-label="Back to top"
        >
          <ArrowUp className="size-5" />
        </button>
      )}
    </footer>
  );
}
