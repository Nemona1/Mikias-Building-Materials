// app/page.js - Complete Landing Page with Hero Section
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
      if (cachedSettings && Date.now() - settingsCacheTime < SETTINGS_CACHE_TTL) {
        if (cachedSettings.siteName) setSiteName(cachedSettings.siteName);
        if (cachedSettings.siteDescription) setSiteDescription(cachedSettings.siteDescription);
        setSettingsLoaded(true);
        return;
      }

      try {
        const res = await fetch('/api/settings?category=general');
        
        if (res.ok) {
          const data = await res.json();
          const settings = data.settings || [];
          
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

  const features = useMemo(() => FEATURES_DATA, []);
  const stats = useMemo(() => STATS_DATA, []);

  const scrollToSection = useCallback((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

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
      {/* ============================================
          HERO SECTION - Text Left, Image Right
          ============================================ */}
      <section className="relative w-full min-h-[70vh] sm:min-h-[65vh] lg:min-h-[75vh] flex items-center overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 xl:gap-14 items-center py-6 sm:py-8 lg:py-0">
            
            {/* Left Column - Text Content */}
            <div className="order-2 lg:order-1 flex flex-col items-start text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-3 sm:mb-4">
                <Star className="h-3 w-3 text-primary fill-primary/20" />
                <span className="text-[10px] sm:text-xs font-medium text-primary">
                  Trusted Supplier Since 2016
                </span>
              </div>

              {/* Main Heading */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-3 sm:mb-4">
                <span className="text-foreground">Building Your Dreams</span>
                <br />
                <span className="bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
                  with Quality Materials
                </span>
              </h1>

              {/* Description */}
              <p className="text-sm sm:text-base md:text-lg text-muted max-w-2xl mx-auto lg:mx-0 mb-4 sm:mb-6">
                Quality Building Materials, Hardware, Sanitary & Electrical Supplies — Your one-stop destination in Addis Ababa.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Link
                  href="/register"
                  prefetch={true}
                  className="inline-flex items-center justify-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 bg-primary text-white rounded-lg hover:bg-primary-hover hover:shadow-lg hover:scale-105 transition-all duration-300 font-medium text-sm"
                >
                  Get Started <Rocket className="h-4 w-4" />
                </Link>
                <Link
                  href="/products"
                  prefetch={true}
                  className="inline-flex items-center justify-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 border-2 border-border hover:border-primary text-foreground hover:bg-primary/5 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300 font-medium text-sm"
                >
                  Browse Products <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-5 mt-5 sm:mt-6">
                <div className="flex items-center gap-1.5 text-muted">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-[11px] sm:text-xs">500+ Happy Customers</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[11px] sm:text-xs">Quality Guaranteed</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[11px] sm:text-xs">8AM - 6PM</span>
                </div>
              </div>
            </div>

            {/* Right Column - Image */}
            <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-full">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <div className="aspect-[4/3] sm:aspect-[3/2] lg:aspect-[4/3] xl:aspect-[16/11]">
                    <Image
                      src="/zero.png"
                      alt="Mikias Building Materials - Quality Construction Supplies"
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-700"
                      priority
                    />
                  </div>
                  {/* Image Overlay Badge */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="bg-black/60 backdrop-blur-sm rounded-lg p-2 inline-block">
                      <p className="text-white text-[10px] sm:text-xs font-medium flex items-center gap-1.5">
                        <Building2 className="h-3 w-3" />
                        Quality Building Materials
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Floating Stats Card */}
                <div className="absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-4 bg-card rounded-xl shadow-2xl p-2.5 sm:p-3 border border-border hidden sm:block">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-foreground">1000+</p>
                      <p className="text-[10px] text-muted">Products Available</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-48 h-48 bg-primary/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-20 left-20 w-36 h-36 bg-primary/5 rounded-full blur-3xl -z-10"></div>
      </section>

      {/* ============================================
          FEATURE ROW 1 - Image Right, Text Left
          ============================================ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-center py-8 sm:py-12 lg:py-16">
          {/* Text Section */}
          <div className="order-2 md:order-1 md:pl-4 lg:pl-8 xl:pl-12">
            <span className="inline-block px-3 py-1 text-sm font-medium text-primary bg-primary/10 rounded-full mb-4">
              Premium Quality
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              Quality Building Materials for Every Project
            </h2>
            <p className="text-sm sm:text-base text-muted mb-4 sm:mb-6">
              From foundation to finishing, we provide premium building materials 
              that meet international standards. Our extensive range includes 
              cement, steel, blocks, and all essential construction supplies.
            </p>
            <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
              {['Premium quality materials', 'Competitive pricing', 'Reliable supply chain'].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                  </div>
                  <span className="text-sm sm:text-base text-muted">{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/products" prefetch={true} className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-all group text-sm sm:text-base">
              Explore Products <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          {/* Image Section */}
          <div className="order-1 md:order-2 md:pr-4 lg:pr-8 xl:pr-12">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <div className="aspect-[16/10] sm:aspect-[16/9] max-h-[280px] sm:max-h-[320px] lg:max-h-[340px]">
                <Image
                  src="/1.png"
                  alt="Building Materials"
                  width={600}
                  height={340}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  priority
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
              <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
                <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2 sm:p-3 text-white">
                  <p className="text-xs sm:text-sm font-medium">🏗️ Quality Building Materials</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================
            FEATURE ROW 2 - Image Left, Text Right
            ============================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-center py-8 sm:py-12 lg:py-16 border-t border-border">
          {/* Image Section */}
          <div className="order-1 md:order-1 md:pl-4 lg:pl-8 xl:pl-12">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <div className="aspect-[16/10] sm:aspect-[16/9] max-h-[280px] sm:max-h-[320px] lg:max-h-[340px]">
                <Image
                  src="/two.png"
                  alt="Hardware and Electrical Supplies"
                  width={600}
                  height={340}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
              <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
                <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2 sm:p-3 text-white">
                  <p className="text-xs sm:text-sm font-medium">🔧 Complete Hardware & Electrical</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Text Section */}
          <div className="order-2 md:order-2 md:pr-4 lg:pr-8 xl:pr-12">
            <span className="inline-block px-3 py-1 text-sm font-medium text-primary bg-primary/10 rounded-full mb-4">
              Complete Solutions
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              Complete Hardware & Electrical Solutions
            </h2>
            <p className="text-sm sm:text-base text-muted mb-4 sm:mb-6">
              Find everything you need for your project under one roof. 
              From tools and fittings to electrical cables and switches, 
              we stock quality hardware and electrical supplies.
            </p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="p-3 sm:p-4 bg-card rounded-lg border border-border hover:shadow-md transition-all">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <p className="font-medium text-foreground text-xs sm:text-sm">Tools & Hardware</p>
                <p className="text-[10px] sm:text-xs text-muted">Quality fittings & tools</p>
              </div>
              <div className="p-3 sm:p-4 bg-card rounded-lg border border-border hover:shadow-md transition-all">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <p className="font-medium text-foreground text-xs sm:text-sm">Electrical</p>
                <p className="text-[10px] sm:text-xs text-muted">Cables, switches & more</p>
              </div>
            </div>
            <Link href="/products" prefetch={true} className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-all group text-sm sm:text-base">
              View All Products <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* ============================================
          STATS SECTION
          ============================================ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pb-12 sm:pb-16 lg:pb-20">
          {statItems}
        </div>
      </div>

      {/* ============================================
          FEATURES SECTION - Product Categories
          ============================================ */}
      <section id="features" className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-muted/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">Our Product Categories</h2>
            <p className="text-base sm:text-lg text-muted max-w-2xl mx-auto px-4">
              Quality products for all your construction needs
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {featureItems}
          </div>
        </div>
      </section>

      {/* ============================================
          ABOUT SECTION
          ============================================ */}
      <section id="about" className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">About {siteName}</h2>
          </div>
          <div className="card space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
            <p className="text-sm sm:text-base text-muted">
              {siteName} is a trusted supplier of quality construction materials, hardware, sanitary, 
              and electrical supplies located at <strong>{CONTACT_INFO.address}</strong>. 
              We pride ourselves on providing high-quality products at competitive prices with exceptional 
              customer service.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                <h3 className="font-semibold text-foreground text-sm sm:text-base">Our Mission</h3>
                <p className="text-xs sm:text-sm text-muted">To provide quality building materials and exceptional service to help build better homes and businesses.</p>
              </div>
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                <h3 className="font-semibold text-foreground text-sm sm:text-base">Our Values</h3>
                <p className="text-xs sm:text-sm text-muted">Quality products, competitive pricing, reliable service, and integrity in all our dealings.</p>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground text-sm sm:text-base">Visit Our Store</p>
                  <p className="text-xs sm:text-sm text-muted">{CONTACT_INFO.address}</p>
                  <div className="flex flex-wrap gap-3 sm:gap-4 mt-2">
                    <a href={`tel:${CONTACT_INFO.phone1.replace(/\s/g, '')}`} className="text-xs sm:text-sm text-primary hover:underline flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {CONTACT_INFO.phone1}
                    </a>
                    <a href={`mailto:${CONTACT_INFO.email}`} className="text-xs sm:text-sm text-primary hover:underline flex items-center gap-1">
                      <MailIcon className="h-3 w-3" /> {CONTACT_INFO.email}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          CTA SECTION
          ============================================ */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-6 sm:p-8 lg:p-12 rounded-3xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">Ready to Build?</h2>
            <p className="text-base sm:text-lg text-muted mb-6 sm:mb-8">
              Contact us today for all your building material needs
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Link href="/contact" prefetch={true} className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-primary to-primary-hover text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 text-sm sm:text-base">
                Contact Us <Rocket className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
              <a href={`tel:${CONTACT_INFO.phone1.replace(/\s/g, '')}`} className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 border border-border rounded-xl hover:bg-primary/10 transition text-sm sm:text-base">
                Call Now <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          FOOTER
          ============================================ */}
      <footer className="border-t border-border py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="h-8 w-8 bg-gradient-to-br from-primary to-primary-hover rounded-lg flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-foreground text-sm sm:text-base">{siteName}</span>
              </div>
              <p className="text-xs sm:text-sm text-muted">Quality building materials, hardware, sanitary & electrical supplies at {CONTACT_INFO.address}.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm sm:text-base mb-3 sm:mb-4">Quick Links</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-muted">
                <li><Link href="/products" prefetch={true} className="hover:text-primary transition">Products</Link></li>
                <li><button onClick={() => scrollToSection('about')} className="hover:text-primary transition">About Us</button></li>
                <li><Link href="/contact" prefetch={true} className="hover:text-primary transition">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm sm:text-base mb-3 sm:mb-4">Contact</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-muted">
                <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> {CONTACT_INFO.phone1}</li>
                <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> {CONTACT_INFO.phone2}</li>
                <li className="flex items-center gap-2"><MailIcon className="h-4 w-4" /> {CONTACT_INFO.email}</li>
                <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {CONTACT_INFO.address}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm sm:text-base mb-3 sm:mb-4">Business Hours</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-muted">
                <li>{CONTACT_INFO.hours}</li>
                <li>Sunday: Closed</li>
              </ul>
            </div>
          </div>
          <div className="pt-6 sm:pt-8 border-t border-border text-center text-xs sm:text-sm text-muted">
            <p>&copy; {new Date().getFullYear()} {siteName}. All rights reserved.</p>
            <p className="text-[10px] sm:text-xs mt-1">📍 {CONTACT_INFO.address}</p>
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