// app/about/page.jsx - Updated with correct coordinates
'use client';

import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { 
  Building2, Wrench, Droplets, Zap, Shield, 
  Users, Star, Award, Target, TrendingUp, 
  Clock, Phone, Mail as MailIcon, MapPin,
  CheckCircle, ArrowRight, Truck, Package,
  Clipboard, MessageCircle, Heart, Globe,
  Map, Navigation, Store, PhoneCall
} from 'lucide-react';
import PublicLayout from '@/components/layout/PublicLayout';

// Dynamically import LeafletMap with no SSR
const LeafletMap = dynamic(
  () => import('@/components/ui/LeafletMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="rounded-xl overflow-hidden border border-border shadow-lg bg-muted/10 animate-pulse h-[400px] flex items-center justify-center">
        <div className="text-center">
          <Map className="h-12 w-12 text-muted mx-auto mb-3 animate-bounce" />
          <p className="text-muted">Loading map...</p>
        </div>
      </div>
    )
  }
);

export default function AboutPage() {
  const stats = [
    { value: '10+', label: 'Years Experience', icon: TrendingUp },
    { value: '500+', label: 'Happy Customers', icon: Users },
    { value: '1000+', label: 'Products Available', icon: Package },
    { value: '24/7', label: 'Customer Support', icon: Clock }
  ];

  const values = [
    {
      icon: Shield,
      title: 'Quality First',
      description: 'We source only the highest quality materials from trusted manufacturers.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Users,
      title: 'Customer Focused',
      description: 'Your satisfaction is our priority. We listen, understand, and deliver.',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      icon: Star,
      title: 'Integrity',
      description: 'Honest pricing, transparent dealings, and reliable service.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'Committed to excellence in every product we offer and service we provide.',
      color: 'from-yellow-500 to-orange-500'
    }
  ];

  const services = [
    {
      icon: Building2,
      title: 'Quality Building Materials',
      description: 'Cement, steel, blocks, and all essential construction materials.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Wrench,
      title: 'Hardware Solutions',
      description: 'Complete hardware and accessories for every project.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Droplets,
      title: 'Sanitary Products',
      description: 'High-quality plumbing and sanitary supplies.',
      color: 'from-cyan-500 to-teal-500'
    },
    {
      icon: Zap,
      title: 'Electrical Supplies',
      description: 'Reliable electrical materials and accessories.',
      color: 'from-yellow-500 to-orange-500'
    }
  ];

  // Branch locations with correct coordinates
  const branches = [
    {
      id: 1,
      name: 'Mikias Ayele Building Materials & Electrical',
      address: 'Mexico, Sengatera, Addis Ababa, Ethiopia',
      phone1: '+251 911 912 611',
      phone2: '+251 912 996 222',
      email: 'info@mikiasbuilding.com',
      hours: 'Mon-Sat: 8:00 AM - 6:00 PM',
      icon: Store,
      color: 'from-blue-500 to-cyan-500',
      coordinates: [9.01498522831663,38.748420763541816 ] 
    }
  ];

  return (
    <PublicLayout activeSection="about">
      {/* Hero Section - Improved Image Sizing */}
      <div className="relative bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left Content */}
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
                <Star className="h-4 w-4" />
                <span>About Us</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
                Mikias Ayele Building Materials & Electrical
              </h1>
              <p className="text-base md:text-lg text-muted mb-6 leading-relaxed">
                Your trusted partner for quality building materials, hardware, sanitary, 
                and electrical supplies in Addis Ababa, Ethiopia. Serving the community 
                with excellence since 2014.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/products" className="inline-flex items-center gap-2 px-5 py-2.5 md:px-6 md:py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-all group text-sm md:text-base">
                  Browse Products <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/contact" className="inline-flex items-center gap-2 px-5 py-2.5 md:px-6 md:py-3 border border-border rounded-lg hover:bg-primary/10 transition-all text-sm md:text-base">
                  Contact Us
                </Link>
              </div>
            </div>

            {/* Right Image - Optimized Sizing */}
            <div className="order-1 lg:order-2">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3] max-h-[400px] md:max-h-[450px] lg:max-h-[500px] w-full">
                <Image
                  src="/about.jpg"
                  alt="Mikias Ayele Building Materials & Electrical"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2.5 md:p-3 text-white">
                    <p className="text-xs md:text-sm font-medium">🏗️ Building Materials, Hardware, Sanitary & Electrical Supplies</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-12 px-4 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center p-4 md:p-6 rounded-2xl bg-card shadow-lg border border-border hover:shadow-xl transition-all hover:-translate-y-1">
                  <Icon className="h-6 w-6 md:h-8 md:w-8 text-primary mx-auto mb-2 md:mb-3" />
                  <div className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs md:text-sm text-muted">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Branch Location with Leaflet Map */}
      <div className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Our Location
            </h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              Visit our store at Mexico, Sengatera, Addis Ababa
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Branch Info Card */}
            <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden hover:shadow-xl transition-all">
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    <Store className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-foreground">Main Branch</h3>
                    <p className="text-xs md:text-sm text-muted">Mexico, Sengatera, Addis Ababa</p>
                  </div>
                </div>
              </div>

              <div className="p-4 md:p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm md:text-base">Address</p>
                    <p className="text-xs md:text-sm text-muted">Mexico, Sengatera, Addis Ababa, Ethiopia</p>
                    <p className="text-xs text-muted mt-1">Located in the heart of the city</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm md:text-base">Contact Numbers</p>
                    <div className="space-y-1">
                      <a href="tel:+251911912611" className="text-xs md:text-sm text-muted hover:text-primary transition-colors block">
                        +251 911 912 611
                      </a>
                      <a href="tel:+251912996222" className="text-xs md:text-sm text-muted hover:text-primary transition-colors block">
                        +251 912 996 222
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm md:text-base">Business Hours</p>
                    <p className="text-xs md:text-sm text-muted">Mon - Sat: 8:00 AM - 6:00 PM</p>
                    <p className="text-xs text-muted">Sunday: Closed</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MailIcon className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm md:text-base">Email</p>
                    <a href="mailto:info@mikiasbuilding.com" className="text-xs md:text-sm text-muted hover:text-primary transition-colors">
                      info@mikiasbuilding.com
                    </a>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-3">
                  <a 
                    href="https://maps.app.goo.gl/XZYxH2MrHKEv5M7q6" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-xs md:text-sm"
                  >
                    <Navigation className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    Get Directions
                  </a>
                  <a 
                    href="https://maps.app.goo.gl/XZYxH2MrHKEv5M7q6" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-card border border-border rounded-lg hover:bg-muted/10 transition-colors text-xs md:text-sm"
                  >
                    <Map className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    View on Google Maps
                  </a>
                </div>
              </div>
            </div>

            {/* Leaflet Map with Correct Coordinates */}
            <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden hover:shadow-xl transition-all">
              <div className="p-3 md:p-4 border-b border-border flex items-center justify-between">
                <h3 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
                  <Map className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  Find Us Here
                </h3>
                <span className="text-[10px] md:text-xs text-muted bg-muted/10 px-2 py-1 rounded-full">
                  Interactive Map
                </span>
              </div>
              <LeafletMap 
                position={branches[0].coordinates}
                zoom={17}
                title={branches[0].name}
                address="Mexico, Sengatera, Addis Ababa, Ethiopia"
                phone={branches[0].phone1}
              />
              <div className="p-3 md:p-4 border-t border-border bg-muted/5">
                <div className="flex items-center gap-2 text-xs md:text-sm text-muted">
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-primary animate-pulse"></span>
                    <span>📍</span>
                  </div>
                  <span>Mexico, Sengatera, Addis Ababa</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="py-16 px-4 bg-muted/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="p-6 md:p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-all">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Target className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">Our Mission</h3>
              <p className="text-sm md:text-base text-muted">
                To provide quality building materials and exceptional service to help build 
                better homes, businesses, and communities across Ethiopia.
              </p>
            </div>
            <div className="p-6 md:p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-all">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Globe className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">Our Vision</h3>
              <p className="text-sm md:text-base text-muted">
                To become Ethiopia's most trusted and preferred supplier of building materials, 
                known for quality, reliability, and customer satisfaction.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Core Values */}
      <div className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Our Core Values</h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div key={index} className="group p-5 md:p-6 rounded-2xl bg-card shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-border">
                  <div className={`h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-to-r ${value.color} flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">{value.title}</h3>
                  <p className="text-sm text-muted">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Our Services */}
      <div className="py-16 px-4 bg-muted/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">What We Offer</h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              Comprehensive range of quality products for all your construction needs
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <div key={index} className="group p-5 md:p-6 rounded-2xl bg-card shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-border">
                  <div className={`h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-to-r ${service.color} flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">{service.title}</h3>
                  <p className="text-sm text-muted">{service.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Why Choose Mikias Ayele?
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground text-sm md:text-base">Quality Products</h4>
                    <p className="text-xs md:text-sm text-muted">All products meet international standards</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground text-sm md:text-base">Competitive Pricing</h4>
                    <p className="text-xs md:text-sm text-muted">Best prices without compromising quality</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground text-sm md:text-base">Reliable Supply</h4>
                    <p className="text-xs md:text-sm text-muted">Consistent availability of products</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground text-sm md:text-base">Expert Support</h4>
                    <p className="text-xs md:text-sm text-muted">Knowledgeable team to assist you</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground text-sm md:text-base">Convenient Location</h4>
                    <p className="text-xs md:text-sm text-muted">Easily accessible at Mexico, Sengatera</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="p-4 md:p-6 bg-card rounded-2xl border border-border text-center hover:shadow-lg transition-all">
                <Heart className="h-6 w-6 md:h-8 md:w-8 text-primary mx-auto mb-2" />
                <p className="font-semibold text-foreground text-sm md:text-base">100% Satisfaction</p>
                <p className="text-xs text-muted">Guaranteed quality</p>
              </div>
              <div className="p-4 md:p-6 bg-card rounded-2xl border border-border text-center hover:shadow-lg transition-all">
                <Truck className="h-6 w-6 md:h-8 md:w-8 text-primary mx-auto mb-2" />
                <p className="font-semibold text-foreground text-sm md:text-base">Fast Delivery</p>
                <p className="text-xs text-muted">Reliable logistics</p>
              </div>
              <div className="p-4 md:p-6 bg-card rounded-2xl border border-border text-center hover:shadow-lg transition-all">
                <Users className="h-6 w-6 md:h-8 md:w-8 text-primary mx-auto mb-2" />
                <p className="font-semibold text-foreground text-sm md:text-base">Expert Team</p>
                <p className="text-xs text-muted">Knowledgeable staff</p>
              </div>
              <div className="p-4 md:p-6 bg-card rounded-2xl border border-border text-center hover:shadow-lg transition-all">
                <Shield className="h-6 w-6 md:h-8 md:w-8 text-primary mx-auto mb-2" />
                <p className="font-semibold text-foreground text-sm md:text-base">Trusted Brand</p>
                <p className="text-xs text-muted">Serving since 2014</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact CTA */}
      <div className="py-16 px-4 bg-gradient-to-r from-primary/5 to-primary/10 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Ready to Build Your Project?
            </h2>
            <p className="text-base md:text-lg text-muted mb-6 md:mb-8">
              Visit our store at Mexico, Sengatera or contact us today
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-2.5 md:px-8 md:py-3 bg-gradient-to-r from-primary to-primary-hover text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 text-sm md:text-base">
                Contact Us <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
              </Link>
              <a href="tel:+251911912611" className="inline-flex items-center gap-2 px-6 py-2.5 md:px-8 md:py-3 border border-border rounded-xl hover:bg-primary/10 transition text-sm md:text-base">
                <Phone className="h-4 w-4 md:h-5 md:w-5" />
                Call Now
              </a>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}