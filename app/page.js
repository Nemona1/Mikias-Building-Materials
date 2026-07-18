// app/page.js - Complete working version
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Building2, Wrench, Droplets, Zap, Shield, Rocket, Users, Star,
  Mail as MailIcon, ChevronRight, Menu, X, TrendingUp, Clock, Phone 
} from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';

// Landing Page Component
function LandingPageContent() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [siteName, setSiteName] = useState('Mikias Building Materials');
  const [siteDescription, setSiteDescription] = useState('Quality Building Materials, Hardware, Sanitary & Electrical Supplies');

  const features = [
    {
      icon: Building2,
      title: 'Quality Building Materials',
      description: 'Premium cement, steel, blocks, and construction materials for all your building needs.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Wrench,
      title: 'Hardware Solutions',
      description: 'Complete hardware and accessories including tools, fittings, and construction accessories.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Droplets,
      title: 'Sanitary Products',
      description: 'High-quality sanitary and plumbing supplies including pipes, fittings, and fixtures.',
      color: 'from-cyan-500 to-teal-500'
    },
    {
      icon: Zap,
      title: 'Electrical Supplies',
      description: 'Reliable electrical materials including cables, switches, and electrical fittings.',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Shield,
      title: 'Trusted Quality',
      description: 'All products meet industry standards with guaranteed quality and competitive pricing.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Users,
      title: 'Customer Focused',
      description: 'Dedicated customer support with fast delivery and excellent service.',
      color: 'from-indigo-500 to-blue-500'
    }
  ];

  const stats = [
    { value: '10+', label: 'Years Experience', icon: TrendingUp },
    { value: '500+', label: 'Happy Customers', icon: Users },
    { value: '1000+', label: 'Products Available', icon: PackageIcon },
    { value: '24/7', label: 'Customer Support', icon: Clock }
  ];

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-card/80 backdrop-blur-md z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollToSection('home')}>
              <div className="h-9 w-9 bg-gradient-to-br from-primary to-primary-hover rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">
                {siteName}
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('features')} className="text-muted hover:text-primary transition">Products</button>
              <button onClick={() => scrollToSection('about')} className="text-muted hover:text-primary transition">About</button>
              <Link href="/products" className="text-muted hover:text-primary transition">Catalog</Link>
              <ThemeToggle />
              <Link href="/login" className="px-4 py-2 text-primary border border-primary rounded-lg hover:bg-primary/10 transition">Sign In</Link>
              <Link href="/register" className="px-4 py-2 bg-gradient-to-r from-primary to-primary-hover text-white rounded-lg hover:shadow-lg transition">Get Started</Link>
            </div>

            <div className="flex items-center gap-4 md:hidden">
              <ThemeToggle />
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-muted">
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-card border-b border-border">
            <div className="px-4 py-4 space-y-3">
              <button onClick={() => scrollToSection('features')} className="block w-full text-left py-2 text-muted hover:text-primary transition">Products</button>
              <button onClick={() => scrollToSection('about')} className="block w-full text-left py-2 text-muted hover:text-primary transition">About</button>
              <Link href="/products" className="block w-full text-left py-2 text-muted hover:text-primary transition">Catalog</Link>
              <div className="pt-2 space-y-2">
                <Link href="/login" className="block w-full text-center px-4 py-2 text-primary border border-primary rounded-lg">Sign In</Link>
                <Link href="/register" className="block w-full text-center px-4 py-2 bg-gradient-to-r from-primary to-primary-hover text-white rounded-lg">Get Started</Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-6">
              <Star className="h-4 w-4" />
              <span>Your Trusted Building Materials Supplier</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-gradient">
              Building Your Dreams with Quality Materials
            </h1>
            <p className="text-xl text-muted max-w-3xl mx-auto mb-10">
              {siteDescription} — Your one-stop destination for all building, hardware, sanitary, and electrical supplies in Addis Ababa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary to-primary-hover text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105">
                Get Started <Rocket className="h-5 w-5" />
              </Link>
              <Link href="/products" className="inline-flex items-center gap-2 px-8 py-3 border border-border rounded-xl hover:bg-primary/10 transition">
                Browse Products <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center p-6 rounded-2xl bg-card shadow-lg border border-border">
                  <Icon className="h-8 w-8 text-primary mx-auto mb-3" />
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section - Products */}
      <section id="features" className="py-20 px-4 bg-muted/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Our Product Categories</h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              Quality products for all your construction needs
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="group p-6 rounded-2xl bg-card shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-border">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">About Mikias Building Materials</h2>
          </div>
          <div className="card space-y-6">
            <p className="text-muted">
              Mikias Building Materials, Hardware, Sanitary & Electrical Supplies is a trusted supplier 
              of quality construction materials in Addis Ababa, Ethiopia. We pride ourselves on providing 
              high-quality products at competitive prices with exceptional customer service.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                <h3 className="font-semibold text-foreground">Our Mission</h3>
                <p className="text-sm text-muted">To provide quality building materials and exceptional service to help build better homes and businesses.</p>
              </div>
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                <h3 className="font-semibold text-foreground">Our Values</h3>
                <p className="text-sm text-muted">Quality products, competitive pricing, reliable service, and integrity in all our dealings.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Ready to Build?</h2>
            <p className="text-lg text-muted mb-8">
              Contact us today for all your building material needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary to-primary-hover text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105">
                Contact Us <Rocket className="h-5 w-5" />
              </Link>
              <a href="tel:+251948418527" className="inline-flex items-center gap-2 px-8 py-3 border border-border rounded-xl hover:bg-primary/10 transition">
                Call Now <Phone className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 bg-gradient-to-br from-primary to-primary-hover rounded-lg flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-foreground">{siteName}</span>
              </div>
              <p className="text-sm text-muted">Quality building materials, hardware, sanitary & electrical supplies in Addis Ababa.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted">
                <li><Link href="/products" className="hover:text-primary transition">Products</Link></li>
                <li><Link href="/about" className="hover:text-primary transition">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-muted">
                <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> +251 948 418 527</li>
                <li className="flex items-center gap-2"><MailIcon className="h-4 w-4" /> info@mikiasbuilding.com</li>
                <li className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Addis Ababa, Ethiopia</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Business Hours</h4>
              <ul className="space-y-2 text-sm text-muted">
                <li>Mon - Fri: 8:00 AM - 6:00 PM</li>
                <li>Saturday: 9:00 AM - 2:00 PM</li>
                <li>Sunday: Closed</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border text-center text-sm text-muted">
            <p>&copy; {new Date().getFullYear()} {siteName}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// PackageIcon component for stats
function PackageIcon(props) {
  return <Building2 {...props} />;
}

// Main component with auth check
function HomeContent() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, isInitialized } = useAuth();
  const [showLanding, setShowLanding] = useState(false);

  useEffect(() => {
    // If auth is still loading, wait
    if (isLoading) return;
    
    // If initialized and authenticated, redirect to dashboard
    if (isInitialized && isAuthenticated && user) {
      const roleName = user.role?.name || 'customer';
      
      const dashboardMap = {
        'super_admin': '/dashboard/super-admin',
        'admin': '/dashboard/admin',
        'manager': '/dashboard/manager',
        'staff': '/dashboard/staff',
        'customer': '/dashboard/customer'
      };
      
      const redirectUrl = dashboardMap[roleName] || '/dashboard/customer';
      console.log('[Home] User authenticated, redirecting to:', redirectUrl);
      router.replace(redirectUrl);
      return;
    }
    
    // Not authenticated, show landing page
    if (isInitialized && !isAuthenticated) {
      setShowLanding(true);
    }
    
  }, [user, isLoading, isAuthenticated, isInitialized, router]);

  // Show loading state while checking auth
  if (isLoading || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="spinner mx-auto h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page if not authenticated
  if (!isAuthenticated && showLanding) {
    return <LandingPageContent />;
  }

  // Fallback loading
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <div className="spinner mx-auto h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-muted">Loading...</p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="spinner mx-auto h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-muted">Loading...</p>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}