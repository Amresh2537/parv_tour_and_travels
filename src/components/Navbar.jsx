'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarPlus, Settings2, ChartNoAxesCombined } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const items = [['/', 'Bookings', LayoutDashboard], ['/booking/entry', 'New Booking', CalendarPlus], ['/reports', 'Reports', ChartNoAxesCombined], ['/admin', 'Admin Panel', Settings2]];
  return <header className="app-header"><nav className="app-nav" aria-label="Main navigation">
    <Link href="/" className="brand"><Image src="/images/backgrounds/car-tour-and-travel-service.jpg" alt="" width={44} height={44} /><span>PARV Tour & Travels<small>BOOKING & FLEET MANAGEMENT</small></span></Link>
    <div className="nav-links">{items.map(([href, label, Icon]) => <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined}><Icon size={16} />{label}</Link>)}</div>
  </nav></header>;
}
