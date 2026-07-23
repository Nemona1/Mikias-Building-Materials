// app/page.js - Optimized with performance improvements and public settings API
'use client';

import { useEffect, useState, Suspense, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Building2, Wrench, Droplets, Zap, Shield, Rocket, Users, Star,
  Mail as MailIcon, ChevronRight, TrendingUp, Clock, Phone,
  CheckCircle, ArrowRight, MapPin
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import PublicLayout from '@/components/layout/PublicLayout';

// Memoized stats data
const STATS_DATA = [
  { value: '10+', label: 'Years Experience', icon: TrendingUp },
  { value: '500+', label: 'Happy Customers', icon: Users },
  { value: '1000+', label: 'Products Available', icon: PackageIcon },
  { value: '24/7', label: 'Customer Support', icon: Clock }
];

// Memoized features data
const FEATURES_DATA = [
  {
    icon: Building2,
    title: 'Quality Building Materials',
    description: 'Premium cement, steel, blocks, and construction materials for all your building needs.',
    color: 'from-blue-500 to-cyan-500',
    category: 'Building'
  },
  {
    icon: Wrench,
    title: 'Hardware Solutions',
    description: 'Complete hardware and accessories including tools, fittings, and construction accessories.',
    color: 'from-green-500 to-emerald-500',
    category: 'Hardware'
  },
  {
    icon: Droplets,
    title: 'Sanitary Products',
    description: 'High-quality sanitary and plumbing supplies including pipes, fittings, and fixtures.',
    color: 'from-cyan-500 to-teal-500',
    category: 'Sanitary'
  },
  {
    icon: Zap,
    title: 'Electrical Supplies',
    description: 'Reliable electrical materials including cables, switches, and electrical fittings.',
    color: 'from-yellow-500 to-orange-500',
    category: 'Electrical'
  },
  {
    icon: Shield,
    title: 'Trusted Quality',
    description: 'All products meet industry standards with guaranteed quality and competitive pricing.',
    color: 'from-purple-500 to-pink-500',
    category: 'Quality'
  },
  {
    icon: Users,
    title: 'Customer Focused',
    description: 'Dedicated customer support with fast delivery and excellent service.',
    color: 'from-indigo-500 to-blue-500',
    category: 'Service'
  }
];

// Memoized contact info
const CONTACT_INFO = {
  phone1: '+251 911 912 611',
  phone2: '+251 912 996 222',
  email: 'info@mikiasbuilding.com',
  address: 'Mexico, Sengatera, Addis Ababa, Ethiopia',
  hours: 'Mon - Sat: 8:00 AM - 6:00 PM'
};

// Cache for site settings
let cachedSettings = null;
let settingsCacheTime = 0;
const SETTINGS_CACHE_TTL = 60000; // 1 minute

// Landing Page Content - Optimized with useMemo
function LandingPageContent() {
  const [siteDescription, setSiteDescription] = useState('Quality Building Materials, Hardware, Sanitary & Electrical Supplies');
  const [siteName, setSiteName] = useState('Mikias Ayele Building Materials & Electrical');
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Fetch site settings from public API
  useEffect(() => {
    const fetchSettings = async () => {
      // Use cached value if available and fresh
      if (cachedSettings && Date.now() - settingsCacheTime < SETTINGS_CACHE_TTL) {
        if (cachedSettings.siteName) setSiteName(cachedSettings.siteName);
        if (cachedSettings.siteDescription) setSiteDescription(cachedSettings.siteDescription);
        setSettingsLoaded(true);
        return;
      }

      try {
        // Use PUBLIC settings API - no authentication required
        const res = await fetch('/api/settings?category=general');
        
        if (res.ok) {
          const data = await res.json();
          const settings = data.settings || [];
          
          // Extract settings
          const siteNameSetting = settings.find(s => s.key === 'siteName');
          const siteDescSetting = settings.find(s => s.key === 'siteDescription');
          
          const newSettings = {};
          if (siteNameSetting && siteNameSetting.value) {
            newSettings.siteName = siteNameSetting.value;
            setSiteName(siteNameSetting.value);
          }
          if (siteDescSetting && siteDescSetting.value) {
            newSettings.siteDescription = siteDescSetting.value;
            setSiteDescription(siteDescSetting.value);
          }
          
          // Cache the settings
          cachedSettings = newSettings;
          settingsCacheTime = Date.now();
        }
        
        setSettingsLoaded(true);
        
      } catch (error) {
        console.error('Failed to fetch site settings:', error);
        setSettingsLoaded(true);
      }
    };
    
    fetchSettings();
  }, []);

  // Memoize features with useMemo
  const features = useMemo(() => FEATURES_DATA, []);
  const stats = useMemo(() => STATS_DATA, []);

  const scrollToSection = useCallback((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Memoize feature items to prevent re-renders
  const featureItems = useMemo(() => {
    return features.map((feature, index) => {
      const Icon = feature.icon;
      return (
        <div key={index} className="group p-6 rounded-2xl bg-card shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-border">
          <div className={`h-12 w-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
          <p className="text-muted">{feature.description}</p>
          <Link href={`/products?category=${feature.category}`} prefetch={true} className="inline-flex items-center gap-1 mt-4 text-primary hover:underline text-sm">
            Browse Category <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      );
    });
  }, [features]);

  // Memoize stats items
  const statItems = useMemo(() => {
    return stats.map((stat, index) => {
      const Icon = stat.icon;
      return (
        <div key={index} className="text-center p-6 rounded-2xl bg-card shadow-lg border border-border hover:shadow-xl transition-all hover:-translate-y-1">
          <Icon className="h-8 w-8 text-primary mx-auto mb-3" />
          <div className="text-2xl font-bold text-foreground">{stat.value}</div>
          <div className="text-sm text-muted">{stat.label}</div>
        </div>
      );
    });
  }, [stats]);

  // Show loading state for settings
  if (!settingsLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="spinner mx-auto h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section with Image Rows Above */}
      <section id="home" className="px-4">
        <div className="max-w-7xl mx-auto">
          {/* Feature Row 1 - Image Right, Text Left */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center py-12">
            <div className="order-2 md:order-1">
              <span className="inline-block px-3 py-1 text-sm font-medium text-primary bg-primary/10 rounded-full mb-4">
                Premium Quality
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Quality Building Materials for Every Project
              </h2>
              <p className="text-muted mb-6">
                From foundation to finishing, we provide premium building materials 
                that meet international standards. Our extensive range includes 
                cement, steel, blocks, and all essential construction supplies.
              </p>
              <ul className="space-y-3 mb-6">
                {['Premium quality materials', 'Competitive pricing', 'Reliable supply chain'].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/products" prefetch={true} className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-all group">
                Explore Products <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="order-1 md:order-2">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/one.png"
                  alt="Building Materials"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white">
                    <p className="text-sm font-medium">🏗️ Quality Building Materials</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Row 2 - Image Left, Text Right */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center py-12 border-t border-border">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/two.png"
                alt="Hardware and Electrical Supplies"
                width={600}
                height={400}
                className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white">
                  <p className="text-sm font-medium">🔧 Complete Hardware & Electrical</p>
                </div>
              </div>
            </div>
            <div>
              <span className="inline-block px-3 py-1 text-sm font-medium text-primary bg-primary/10 rounded-full mb-4">
                Complete Solutions
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Complete Hardware & Electrical Solutions
              </h2>
              <p className="text-muted mb-6">
                Find everything you need for your project under one roof. 
                From tools and fittings to electrical cables and switches, 
                we stock quality hardware and electrical supplies.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-card rounded-lg border border-border hover:shadow-md transition-all">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <Wrench className="h-5 w-5 text-primary" />
                  </div>
                  <p className="font-medium text-foreground text-sm">Tools & Hardware</p>
                  <p className="text-xs text-muted">Quality fittings & tools</p>
                </div>
                <div className="p-4 bg-card rounded-lg border border-border hover:shadow-md transition-all">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <p className="font-medium text-foreground text-sm">Electrical</p>
                  <p className="text-xs text-muted">Cables, switches & more</p>
                </div>
              </div>
              <Link href="/products" prefetch={true} className="inline-flex items-center gap-2 px-6 py-3 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-all group">
                View All Products <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Hero Content */}
          <div className="text-center py-16">
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
              <Link href="/register" prefetch={true} className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary to-primary-hover text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105">
                Get Started <Rocket className="h-5 w-5" />
              </Link>
              <Link href="/products" prefetch={true} className="inline-flex items-center gap-2 px-8 py-3 border border-border rounded-xl hover:bg-primary/10 transition">
                Browse Products <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-20">
            {statItems}
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
            {featureItems}
          </div>
        </div>
      </section>

      {/* About Section - Updated with correct address */}
      <section id="about" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">About {siteName}</h2>
          </div>
          <div className="card space-y-6">
            <p className="text-muted">
              {siteName} is a trusted supplier of quality construction materials, hardware, sanitary, 
              and electrical supplies located at <strong>{CONTACT_INFO.address}</strong>. 
              We pride ourselves on providing high-quality products at competitive prices with exceptional 
              customer service.
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
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Visit Our Store</p>
                  <p className="text-muted">{CONTACT_INFO.address}</p>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <a href={`tel:${CONTACT_INFO.phone1.replace(/\s/g, '')}`} className="text-sm text-primary hover:underline flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {CONTACT_INFO.phone1}
                    </a>
                    <a href={`mailto:${CONTACT_INFO.email}`} className="text-sm text-primary hover:underline flex items-center gap-1">
                      <MailIcon className="h-3 w-3" /> {CONTACT_INFO.email}
                    </a>
                  </div>
                </div>
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
              <Link href="/contact" prefetch={true} className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary to-primary-hover text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105">
                Contact Us <Rocket className="h-5 w-5" />
              </Link>
              <a href={`tel:${CONTACT_INFO.phone1.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 px-8 py-3 border border-border rounded-xl hover:bg-primary/10 transition">
                Call Now <Phone className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Updated with correct address */}
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
              <p className="text-sm text-muted">Quality building materials, hardware, sanitary & electrical supplies at {CONTACT_INFO.address}.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted">
                <li><Link href="/products" prefetch={true} className="hover:text-primary transition">Products</Link></li>
                <li><button onClick={() => scrollToSection('about')} className="hover:text-primary transition">About Us</button></li>
                <li><Link href="/contact" prefetch={true} className="hover:text-primary transition">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-muted">
                <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> {CONTACT_INFO.phone1}</li>
                <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> {CONTACT_INFO.phone2}</li>
                <li className="flex items-center gap-2"><MailIcon className="h-4 w-4" /> {CONTACT_INFO.email}</li>
                <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {CONTACT_INFO.address}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Business Hours</h4>
              <ul className="space-y-2 text-sm text-muted">
                <li>{CONTACT_INFO.hours}</li>
                <li>Sunday: Closed</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border text-center text-sm text-muted">
            <p>&copy; {new Date().getFullYear()} {siteName}. All rights reserved.</p>
            <p className="text-xs mt-1">📍 {CONTACT_INFO.address}</p>
          </div>
        </div>
      </footer>
    </>
  );
}

// PackageIcon component for stats
function PackageIcon(props) {
  return <Building2 {...props} />;
}

// Main component with auth check - Optimized
function HomeContent() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, isInitialized } = useAuth();
  const [showLanding, setShowLanding] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    
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
      
      // Use window.location for faster redirect
      window.location.href = redirectUrl;
      return;
    }
    
    if (isInitialized && !isAuthenticated) {
      setShowLanding(true);
    }
    
  }, [user, isLoading, isAuthenticated, isInitialized, router]);

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

  if (!isAuthenticated && showLanding) {
    return (
      <PublicLayout activeSection="home">
        <LandingPageContent />
      </PublicLayout>
    );
  }

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
        <div className="text-center">
          <div className="spinner mx-auto h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}