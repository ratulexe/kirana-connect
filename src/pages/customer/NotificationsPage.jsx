import { useState } from 'react';
import { Bell, CheckCheck, Flame, Package, Star, Tag, X } from 'lucide-react';
import Container from '../../components/common/Container.jsx';

const TABS = ['All', 'Deals', 'Updates', 'Alerts'];

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [notifications, setNotifications] = useState([]); // Real DB integration coming soon
  const dismiss = (id) => setNotifications(prev => prev.filter(n => n.id !== id));
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  
  const filtered = activeTab === 0 ? notifications : notifications.filter(n => n.type === TABS[activeTab].toLowerCase());
  const unreadCount = notifications.filter(n => n.unread).length;
  
  return (
    <div className="min-h-screen py-8">
      <Container>
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-heading text-ink flex items-center gap-3">
            <Bell className="size-7 text-primary" />
            Notifications
            {unreadCount > 0 && <span className="rounded-pill bg-red-500 px-2.5 py-0.5 text-xs font-bold text-white">{unreadCount}</span>}
          </h1>
          {unreadCount > 0 && <button onClick={markAllRead} className="flex items-center gap-1.5 text-sm font-semibold text-primary"><CheckCheck className="size-4" />Mark all read</button>}
        </div>
        <div className="mb-6 flex gap-2">
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)} className={`neon-btn rounded-pill px-4 py-2 text-sm font-bold ${i === activeTab ? 'bg-primary text-white' : 'border border-line text-ink-muted hover:border-primary hover:text-primary'}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-24 text-center">
              <Bell className="size-16 text-ink-muted opacity-50" />
              <p className="text-ink-muted">You have no new notifications.</p>
            </div>
          ) : filtered.map(n => (
            <div key={n.id} className={`glass-card flex items-start gap-4 rounded-card p-4 ${n.unread ? 'border-primary/20' : ''}`}>
              <div className={`shrink-0 inline-flex size-10 items-center justify-center rounded-xl ${n.color}`}><n.icon className="size-5" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2"><p className={`text-sm font-bold ${n.unread ? 'text-ink' : 'text-ink-muted'}`}>{n.title}</p>{n.unread && <span className="size-2 shrink-0 rounded-full bg-primary" />}</div>
                <p className="mt-0.5 text-sm text-ink-muted">{n.body}</p><p className="mt-1.5 text-[11px] text-ink-muted/70">{n.time}</p>
              </div>
              <button onClick={() => dismiss(n.id)} className="shrink-0 rounded-full p-1 text-ink-muted hover:bg-surface-sunken"><X className="size-4" /></button>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
