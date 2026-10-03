'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { ApiStatusCard } from '@/components/api-status-card';
import { useToast } from '@/components/toast';
import { QuickViewModal, QuickViewProduct } from '@/components/quick-view-modal';
import {
  ProductCard,
  ProductGrid,
} from '@tord/ui';
import {
  ShieldCheck,
  Truck,
  Sparkles,
  ArrowRight,
  Clock,
  Copy,
  Check,
  ChevronRight,
  ShoppingBag,
  Flame,
  Zap,
  Lock,
  RotateCcw,
  Star,
  Send,
  Leaf,
  CheckCircle2,
  Tag,
  BadgePercent,
  Timer,
  Award,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from 'lucide-react';

import { apiGet } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { useCart } from '@/providers/cart-provider';

const CONTAINER = 'max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8';

export default function HomePage() {
  const { addToCart } = useCart();
  const { userCoords } = useAuth();
  const { showToast } = useToast();

  const [_categories, setCategories] = useState<any[]>([]);
  const [popularProducts, setPopularProducts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [_stores, setStores] = useState<any[]>([]);
  const [_pharmacies, setPharmacies] = useState<any[]>([]);
  const [_coupons, setCoupons] = useState<any[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Live Deal Countdown Timer State
  const [timeLeft, setTimeLeft] = useState({ hours: 8, minutes: 42, seconds: 19 });

  // Quick View Modal state
  const [selectedQuickView, setSelectedQuickView] = useState<QuickViewProduct | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  // Hero Video State (Professional Autoplay & Seamless Playback)
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        setIsPlaying(false);
      });
    }
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), 700);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  useEffect(() => {
    // 1. Categories
    apiGet<any[]>('/categories')
      .then(setCategories)
      .catch((err) => console.warn('Categories fetch error:', err));

    // 2. Products
    apiGet<{ items: any[] }>('/products?limit=24')
      .then((data) => setPopularProducts(data.items || []))
      .catch((err) => console.warn('Products fetch error:', err));

    // 3. Offers
    apiGet<any[]>('/coupons')
      .then(setCoupons)
      .catch((err) => console.warn('Coupons fetch error:', err));
  }, []);

  useEffect(() => {
    const lat = userCoords?.lat;
    const lng = userCoords?.lng;
    const query = lat && lng ? `?lat=${lat}&lng=${lng}` : '';

    // Nearby Stores
    apiGet<any[]>(`/stores${query}`)
      .then(setStores)
      .catch((err) => console.warn('Stores fetch error:', err));

    // Pharmacy Section
    apiGet<any[]>(`/pharmacies${query}`)
      .then(setPharmacies)
      .catch((err) => console.warn('Pharmacies fetch error:', err));
  }, [userCoords]);

  // Live countdown interval
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 8, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAddToCart = async (productId: string, quantity = 1) => {
    await addToCart(productId, quantity);
    showToast('Added to cart ✓', 'success');
  };

  const handleOpenQuickView = (prod: any) => {
    setSelectedQuickView({
      id: prod.id,
      name: prod.name,
      brand: prod.brand,
      unit: prod.unit,
      price: typeof prod.price === 'number' ? prod.price : parseFloat(prod.price),
      compareAtPrice: prod.compareAtPrice ? (typeof prod.compareAtPrice === 'number' ? prod.compareAtPrice : parseFloat(prod.compareAtPrice)) : null,
      imageUrl: prod.images?.[0]?.url || prod.imageUrl || undefined,
      categoryName: prod.category?.name || prod.categoryName,
      isPrescriptionRequired: prod.isPrescriptionRequired,
      isMedicine: prod.isMedicine,
      inStock: prod.inStock !== false,
      rating: prod.rating || 4.8,
      ratingCount: prod.ratingCount || 36,
      description: prod.description,
    });
    setIsQuickViewOpen(true);
  };

  const handleCopyCode = (code: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopiedCode(code);
    showToast(`Code ${code} copied to clipboard! ✓`, 'info');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSubscribed(true);
      showToast('Successfully subscribed to weekly grocery fresh updates!', 'success');
      setTimeout(() => {
        setNewsletterEmail('');
        setNewsletterSubscribed(false);
      }, 3000);
    }
  };

  // Curated fallback product list with 28+ authentic high-quality grocery products with studio photography
  const defaultGroceryProducts = [
    // --- Fresh Fruits & Vegetables ---
    {
      id: 'g-1',
      name: 'Fresh Farm Broccoli Crowns',
      brand: 'TORD Organic Farm',
      unit: '500g Pack',
      price: 68.0,
      compareAtPrice: 85.0,
      imageUrl: '/images/products/fresh-broccoli.jpg',
      category: { name: 'Fruits & Vegetables' },
      isPrescriptionRequired: false,
      isMedicine: false,
      inStock: true,
      rating: 4.9,
      ratingCount: 84,
    },
    {
      id: 'g-2',
      name: 'Hydroponic Sweet Cherry Tomatoes',
      brand: 'GreenHouse Pure',
      unit: '250g Box',
      price: 55.0,
      compareAtPrice: 70.0,
      imageUrl: '/images/products/cherry-tomatoes.jpg',
      category: { name: 'Fruits & Vegetables' },
      isPrescriptionRequired: false,
      isMedicine: false,
      inStock: true,
      rating: 4.9,
      ratingCount: 65,
    },
    {
      id: 'g-3',
      name: 'Royal Shimla Crisp Red Apples',
      brand: 'Himachal Orchards',
      unit: '1 kg Box (4-5 pcs)',
      price: 180.0,
      compareAtPrice: 220.0,
      imageUrl: '/images/products/red-apples.jpg',
      category: { name: 'Fruits & Vegetables' },
      isPrescriptionRequired: false,
      isMedicine: false,
      inStock: true,
      rating: 4.8,
      ratingCount: 118,
    },
    {
      id: 'g-4',
      name: 'Fresh Organic Hass Avocados',
      brand: 'TORD Organics',
      unit: '2 Pcs (Pack)',
      price: 199.0,
      compareAtPrice: 250.0,
      imageUrl: '/images/products/avocados.jpg',
      category: { name: 'Fruits & Vegetables' },
      isPrescriptionRequired: false,
      isMedicine: false,
      inStock: true,
      rating: 4.9,
      ratingCount: 92,
    },
    {
      id: 'g-5',
      name: 'Crunchy Sweet Baby Carrots',
      brand: 'NatureFresh Farm',
      unit: '500g Pack',
      price: 45.0,
      compareAtPrice: 60.0,
      imageUrl: '/images/products/baby-carrots.jpg',
      category: { name: 'Fruits & Vegetables' },
      isPrescriptionRequired: false,
      isMedicine: false,
      inStock: true,
      rating: 4.7,
      ratingCount: 48,
    },
    {
      id: 'g-6',
      name: 'Farm Fresh Baby Spinach Leaves',
      brand: 'GreenFields',
      unit: '250g Box',
      price: 35.0,
      compareAtPrice: 45.0,
      imageUrl: '/images/products/baby-spinach.jpg',
      category: { name: 'Fruits & Vegetables' },
      isPrescriptionRequired: false,
      isMedicine: false,
      inStock: true,
      rating: 4.8,
      ratingCount: 76,
    },
    {
      id: 'g-7',
      name: 'Ratnagiri Alphonso Mango Box',
      brand: 'Konkan Direct',
      unit: '1 Dozen Box',
      price: 599.0,
      compareAtPrice: 750.0,
      imageUrl: '/images/products/alphonso-mango.jpg',
      category: { name: 'Fruits & Vegetables' },
      isPrescriptionRequired: false,
      isMedicine: false,
      inStock: true,
      rating: 5.0,
      ratingCount: 230,
    },
    {
      id: 'g-8',
      name: 'Farm Fresh Yellow Baby Potatoes',
      brand: 'RootHarvest',
      unit: '1 kg Pack',
      price: 42.0,
      compareAtPrice: 55.0,
      imageUrl: '/images/products/baby-potatoes.jpg',
      category: { name: 'Fruits & Vegetables' },
      isPrescriptionRequired: false,
      isMedicine: false,
      inStock: true,
      rating: 4.7,
      ratingCount: 54,
    },

    // --- Dairy, Eggs & Bakery ---
    {
      id: 'g-9',
      name: 'Pure A2 Desi Cow Milk (Glass Bottle)',
      brand: 'Vedic Pastures',
      unit: '1 Litre',
      price: 74.0,
      compareAtPrice: 95.0,
      imageUrl: '/images/products/a2-cow-milk.jpg',
      category: { name: 'Dairy & Eggs' },
      isPrescriptionRequired: false,
      isMedicine: false,
      inStock: true,
      rating: 4.9,
      ratingCount: 142,
    },
    {
      id: 'g-10',
      name: 'Artisanal Fresh Farm Malai Paneer',
      brand: 'DairyCraft',
      unit: '200g Block',
      price: 95.0,
      compareAtPrice: 115.0,
      imageUrl: '/images/products/fresh-paneer.jpg',
      category: { name: 'Dairy & Eggs' },
      isPrescriptionRequired: false,
      isMedicine: false,
      inStock: true,
      rating: 4.8,
      ratingCount: 88,
    },
    {
      id: 'g-11',
      name: 'Organic Country Salted Butter',
      brand: 'Amul Gold',
      unit: '500g Block',
      price: 265.0,
      compareAtPrice: 295.0,
      imageUrl: '/images/products/butter.jpg',
      category: { name: 'Dairy & Eggs' },
      isPrescriptionRequired: false,
      isMedicine: false,
      inStock: true,
      rating: 4.8,
      ratingCount: 110,
    },
    {
      id: 'g-12',
      name: 'Free Range Farm Brown Eggs (Pack of 12)',
      brand: 'HappyHens',
      unit: '12 Eggs Box',
      price: 110.0,
      compareAtPrice: 135.0,
      imageUrl: '/images/products/brown-eggs.jpg',
      category: { name: 'Dairy & Eggs' },
      isPrescriptionRequired: false,
      isMedicine: false,
      inStock: true,
      rating: 4.9,
      ratingCount: 165,
    },
    {
      id: 'g-13',
      name: 'Artisanal 100% Sourdough Loaf',
      brand: 'Town Bakehouse',
      unit: '400g Loaf',
      price: 89.0,
      compareAtPrice: 110.0,
      imageUrl: '/images/products/sourdough-bread.jpg',
      category: { name: 'Bakery & Bread' },
      isPrescriptionRequired: false,
      isMedicine: false,
      inStock: true,
      rating: 4.7,
      ratingCount: 52,
    },
    {
      id: 'g-14',
      name: '100% Whole Wheat Sandwich Bread',
      brand: 'HarvestGold',
      unit: '400g Pack',
      price: 50.0,
      compareAtPrice: 60.0,
      imageUrl: '/images/products/sandwich-bread.jpg',
      category: { name: 'Bakery & Bread' },
      isPrescriptionRequired: false,
      isMedicine: false,
      inStock: true,
      rating: 4.6,
      ratingCount: 70,
    },

    // --- Staples, Rice, Dals & Oils ---
    {
      id: 'g-15',
      name: 'Daawat Rozana Super Basmati Rice',
      brand: 'Daawat',
      unit: '5 kg Bag',
      price: 399.0,
      compareAtPrice: 485.0,
      imageUrl: '/images/products/basmati-rice.jpg',
      category: { name: 'Organic Staples' },
      isPrescriptionRequired: false,
      isMedicine: false,
      inStock: true,
      rating: 4.9,
      ratingCount: 195,
    },
    {
      id: 'g-16',
      name: 'Aashirvaad Superior MP Sharbati Atta',
      brand: 'Aashirvaad',
      unit: '5 kg Bag',
      price: 245.0,
      compareAtPrice: 275.0,
      imageUrl: '/images/products/wheat-atta.jpg',
      category: { name: 'Organic Staples' },
      isPrescriptionRequired: false,
      isMedicine: false,
      inStock: true,
      rating: 4.8,
      ratingCount: 220,
    },
    {
      id: 'g-17',
      name: 'Tata Sampann Unpolished Toor Dal',
      brand: 'Tata Sampann',
      unit: '1 kg Bag',
      price: 159.0,
      compareAtPrice: 185.0,
      imageUrl: '/images/products/toor-dal.jpg',
      category: { name: 'Organic Staples' },
      isPrescriptionRequired: false,
      isMedicine: false,
      inStock: true,
      rating: 4.8,
      ratingCount: 135,
    },
    {
      id: 'g-18',
      name: 'Cold Pressed Extra Virgin Olive Oil',
      brand: 'OliveGold Organics',
      unit: '500 ml Bottle',
      price: 450.0,
      compareAtPrice: 550.0,
      imageUrl: '/images/products/olive-oil.jpg',
      category: { name: 'Organic Staples' },
      isPrescriptionRequired: false,
      isMedicine: false,
      inStock: true,
      rating: 4.9,
      ratingCount: 96,
    },
    {
      id: 'g-19',
      name: 'Fortune Kachi Ghani Pure Mustard Oil',
      brand: 'Fortune',
      unit: '1 Litre Bottle',
      price: 149.0,
      compareAtPrice: 175.0,
      imageUrl: '/images/products/mustard-oil.jpg',
      category: { name: 'Organic Staples' },
      isPrescriptionRequired: false,
      isMedicine: false,
      inStock: true,
      rating: 4.7,
      ratingCount: 112,
    },
    {
      id: 'g-20',
      name: 'Amul Pure Desi Cow Ghee (Tin)',
      brand: 'Amul',
      unit: '1 Litre Tin',
      price: 595.0,
      compareAtPrice: 650.0,
      imageUrl: '/images/products/desi-ghee.jpg',
      category: { name: 'Organic Staples' },
      isPrescriptionRequired: false,
      isMedicine: false,
      inStock: true,
      rating: 4.9,
      ratingCount: 280,
    },

    // --- Beverages & Snacks ---
    {
      id: 'g-21',
      name: 'Tata Tea Gold Premium Assam Blend',
      brand: 'Tata Tea',
      unit: '500g Pack',
      price: 289.0,
      compareAtPrice: 345.0,
      imageUrl: '/images/products/assam-tea.jpg',
      category: { name: 'Beverages & Juices' },
      isPrescriptionRequired: false,
      isMedicine: false,
      inStock: true,
      rating: 4.8,
      ratingCount: 145,
    },
    {
      id: 'g-22',
      name: 'Tropicana 100% Real Valencia Orange Juice',
      brand: 'Tropicana',
      unit: '1 Litre Tetra',
      price: 135.0,
      compareAtPrice: 160.0,
      imageUrl: '/images/products/orange-juice.jpg',
      category: { name: 'Beverages & Juices' },
      isPrescriptionRequired: false,
      isMedicine: false,
      inStock: true,
      rating: 4.7,
      ratingCount: 88,
    },
    {
      id: 'g-23',
      name: 'Whole Jumbo California Almonds',
      brand: 'NutriDelight',
      unit: '500g Pack',
      price: 460.0,
      compareAtPrice: 580.0,
      imageUrl: '/images/products/almonds.jpg',
      category: { name: 'Beverages & Juices' },
      isPrescriptionRequired: false,
      isMedicine: false,
      inStock: true,
      rating: 4.9,
      ratingCount: 160,
    },
    {
      id: 'g-24',
      name: "Haldiram's Bikaneri Bhujia Crisp Sev",
      brand: "Haldiram's",
      unit: '400g Pack',
      price: 115.0,
      compareAtPrice: 135.0,
      imageUrl: '/images/products/bhujia.jpg',
      category: { name: 'Beverages & Juices' },
      isPrescriptionRequired: false,
      isMedicine: false,
      inStock: true,
      rating: 4.8,
      ratingCount: 190,
    },

    // --- Health & Wellness ---
    {
      id: 'g-25',
      name: 'Vitamin C 1000mg + Zinc Effervescent',
      brand: 'HealthPlus Vitality',
      unit: '20 Tablets Tube',
      price: 289.0,
      compareAtPrice: 350.0,
      imageUrl: '/images/products/vitamin-c.jpg',
      category: { name: 'Personal Care' },
      isPrescriptionRequired: false,
      isMedicine: true,
      inStock: true,
      rating: 4.9,
      ratingCount: 210,
    },
    {
      id: 'g-26',
      name: 'Omron HEM-7120 Digital Arm BP Monitor',
      brand: 'Omron Healthcare',
      unit: '1 Unit + Cuff',
      price: 1899.0,
      compareAtPrice: 2480.0,
      imageUrl: '/images/products/bp-monitor.jpg',
      category: { name: 'Personal Care' },
      isPrescriptionRequired: false,
      isMedicine: true,
      inStock: true,
      rating: 4.9,
      ratingCount: 340,
    },
    {
      id: 'g-27',
      name: 'Dr Trust Waterproof Flexible Tip Thermometer',
      brand: 'Dr Trust',
      unit: '1 Unit',
      price: 249.0,
      compareAtPrice: 350.0,
      imageUrl: '/images/products/digital-thermometer.jpg',
      category: { name: 'Personal Care' },
      isPrescriptionRequired: false,
      isMedicine: true,
      inStock: true,
      rating: 4.8,
      ratingCount: 155,
    },
    {
      id: 'g-28',
      name: 'Accu-Chek Active Blood Glucose Monitor Kit',
      brand: 'Accu-Chek',
      unit: '1 Kit + 10 Strips',
      price: 1249.0,
      compareAtPrice: 1599.0,
      imageUrl: '/images/products/glucose-meter.jpg',
      category: { name: 'Personal Care' },
      isPrescriptionRequired: false,
      isMedicine: true,
      inStock: true,
      rating: 4.9,
      ratingCount: 275,
    },
  ];

  // Dedicated Non-Duplicated Product Sets For Every Section:
  // 1. Deal of the Day: Featured discount products across categories
  const dealSectionProducts = defaultGroceryProducts.filter((p) =>
    ['g-7', 'g-18', 'g-20', 'g-23', 'g-21', 'g-22', 'g-24', 'g-13'].includes(p.id)
  );

  // 2. Fresh Farm Harvest: Fresh Vegetables, Fruits & Dairy exclusively
  const harvestSectionProducts = defaultGroceryProducts.filter((p) =>
    ['g-1', 'g-2', 'g-3', 'g-4', 'g-5', 'g-6', 'g-9', 'g-10'].includes(p.id)
  );

  // 3. Pantry Staples: Rice, Atta, Dal, Mustard Oil, Butter, Eggs, Bread, Potatoes
  const pantrySectionProducts = defaultGroceryProducts.filter((p) =>
    ['g-15', 'g-16', 'g-17', 'g-19', 'g-11', 'g-12', 'g-14', 'g-8'].includes(p.id)
  );

  // 4. Pharmacy & Healthcare: Certified medical & wellness essentials
  const pharmacySectionProducts = defaultGroceryProducts.filter((p) =>
    ['g-25', 'g-26', 'g-27', 'g-28'].includes(p.id)
  );

  // Filter products for the Deal of the Day interactive tabs
  const filteredProducts = dealSectionProducts.filter((p) => {
    if (activeTab === 'deals') return (p.compareAtPrice! - p.price) / p.compareAtPrice! >= 0.15;
    if (activeTab === 'harvest') return ['Fruits & Vegetables', 'Bakery & Bread'].includes(p.category?.name || '');
    if (activeTab === 'rated') return (p.rating || 4.8) >= 4.9;
    return true; // 'all'
  });

  const featuredDealProduct = defaultGroceryProducts.find((p) => p.id === 'g-7') || defaultGroceryProducts[0]!;

  return (
    <div suppressHydrationWarning className="min-h-screen flex flex-col justify-between bg-[#F8FAFC] font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      <div suppressHydrationWarning>
        
        {/* ========================================================================= */}
        {/* 01–03. TOP UTILITY BAR + MAIN HEADER + PRIMARY NAVIGATION */}
        {/* ========================================================================= */}
        <SiteHeader />

        <main className="w-full space-y-12 sm:space-y-16 pb-16">
          
          {/* ========================================================================= */}
          {/* 04. HERO SECTION (LUXURY DARK FOREST GREEN WITH EXPANSIVE VIDEO SHOWCASE) */}
          {/* ========================================================================= */}
          <section className="relative overflow-hidden pt-8 sm:pt-14 pb-12 sm:pb-16 bg-[#061B12] text-white border-b border-emerald-950">
            {/* Ambient Radial Green Glows */}
            <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[700px] h-[700px] bg-emerald-500/15 rounded-full blur-[160px] pointer-events-none" />
            <div className="absolute top-10 left-10 w-[400px] h-[400px] bg-[#B4F83C]/10 rounded-full blur-[130px] pointer-events-none" />

            <div className={`${CONTAINER} relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch min-h-[520px] sm:min-h-[580px] lg:min-h-[640px]`}>
              
              {/* Left Column (Headline, Subtitle, Glowing CTA & Trust badges) */}
              <div className="lg:col-span-6 xl:col-span-5 space-y-6 flex flex-col justify-center text-center lg:text-left items-center lg:items-start py-4">
                
                {/* 1. Large Headline (Matching Reference Typography) */}
                <h1 className="text-4xl sm:text-5xl lg:text-[58px] xl:text-[64px] font-serif font-normal tracking-tight leading-[1.08] text-white">
                  <span>Experience Pure</span> <br />
                  <span className="text-[#B4F83C] font-semibold drop-shadow-[0_0_35px_rgba(180,248,60,0.4)]">
                    Organic
                  </span> <br />
                  <span>Freshness</span>
                </h1>

                {/* 2. Value Proposition Subtitle */}
                <p className="text-base sm:text-lg text-emerald-100/90 leading-relaxed font-normal max-w-lg">
                  Farm-to-door delivery from sustainable local farms. Pure quality you can trust.
                </p>

                {/* 3. Glowing Pill CTA Button */}
                <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4">
                  <Link href="/shop">
                    <button
                      type="button"
                      className="bg-[#B4F83C] hover:bg-[#A3F024] text-[#061B12] font-black text-sm px-9 py-3.5 rounded-full shadow-[0_0_35px_rgba(180,248,60,0.45)] hover:shadow-[0_0_50px_rgba(180,248,60,0.65)] hover:scale-105 transition-all active:scale-95 cursor-pointer min-h-[46px]"
                    >
                      <span>Shop Now</span>
                    </button>
                  </Link>

                  <Link href="/offers">
                    <button
                      type="button"
                      className="bg-[#0C291D]/80 backdrop-blur-xs hover:bg-emerald-900/80 text-emerald-200 hover:text-white font-bold text-xs px-6 py-3 rounded-full border border-emerald-800/80 transition-all cursor-pointer min-h-[46px]"
                    >
                      <Flame className="h-3.5 w-3.5 text-[#B4F83C] fill-[#B4F83C] inline mr-1" />
                      <span>Explore Deals</span>
                    </button>
                  </Link>
                </div>

                {/* 4. Trust Micro-Metrics */}
                <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs font-semibold text-emerald-300/80 border-t border-emerald-900/60 w-full">
                  <div className="flex items-center gap-1.5 text-emerald-200">
                    <CheckCircle2 className="h-4 w-4 text-[#B4F83C]" />
                    <span>100% Farm Fresh</span>
                  </div>
                  <span className="text-emerald-800 hidden sm:inline">•</span>
                  <div className="flex items-center gap-1.5 text-emerald-200">
                    <Zap className="h-4 w-4 text-[#B4F83C]" />
                    <span>15-Min Dispatch</span>
                  </div>
                  <span className="text-emerald-800 hidden sm:inline">•</span>
                  <div className="flex items-center gap-1.5 text-emerald-200">
                    <ShieldCheck className="h-4 w-4 text-[#B4F83C]" />
                    <span>Doctor Rx Verified</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Seamless Full-Height Video Showcase (Frameless) */}
              <div className="lg:col-span-6 xl:col-span-7 relative w-full h-full min-h-[440px] sm:min-h-[520px] lg:min-h-[580px] xl:min-h-[660px] flex items-center justify-center">
                <div
                  className="relative w-full h-full flex items-center justify-center cursor-pointer select-none group"
                  onClick={togglePlay}
                  title={isPlaying ? 'Click to pause' : 'Click to play'}
                >
                  {/* Subtle ambient green glow behind video */}
                  <div className="absolute inset-0 bg-radial from-emerald-500/15 via-transparent to-transparent rounded-full blur-3xl transform scale-110 pointer-events-none" />

                  {/* Cinematic Video Element - Frameless & Blended with Hero Background */}
                  <video
                    ref={videoRef}
                    src="/videos/hero-basket-video.mp4"
                    poster="/images/hero-basket.png"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    className="w-full h-full max-h-[660px] xl:max-h-[720px] object-contain filter drop-shadow-[0_25px_50px_rgba(0,0,0,0.6)] transition-transform duration-700 ease-out will-change-transform group-hover:scale-[1.01]"
                  />

                  {/* Play/Pause Animated Center Feedback Splash */}
                  {showFeedback && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 transition-all duration-300">
                      <div className="h-16 w-16 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl">
                        {isPlaying ? (
                          <Play className="h-7 w-7 translate-x-0.5 fill-current text-[#B4F83C]" />
                        ) : (
                          <Pause className="h-7 w-7 fill-current text-white" />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Minimal Subtle Glass Controls at Bottom Right */}
                  <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-all duration-300">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePlay();
                      }}
                      className="h-8 w-8 rounded-full bg-[#061B12]/80 backdrop-blur-md border border-emerald-500/30 text-emerald-200 hover:text-[#B4F83C] hover:border-[#B4F83C]/50 flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95"
                      title={isPlaying ? 'Pause video' : 'Play video'}
                    >
                      {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 translate-x-0.5 fill-current" />}
                    </button>
                    <button
                      type="button"
                      onClick={toggleMute}
                      className="h-8 w-8 rounded-full bg-[#061B12]/80 backdrop-blur-md border border-emerald-500/30 text-emerald-200 hover:text-[#B4F83C] hover:border-[#B4F83C]/50 flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 05. HERO TRUST / VALUE FEATURES (4 PILLARS) */}
            {/* ========================================================================= */}
            <div className={`${CONTAINER} mt-12 pt-8 border-t border-emerald-900/60 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6`}>
              
              {/* Feature 1: Farm Fresh */}
              <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#0C291D] border border-emerald-800/60 shadow-xs hover:border-[#B4F83C]/40 transition-colors">
                <div className="h-11 w-11 rounded-xl bg-emerald-900/60 text-[#B4F83C] border border-emerald-700/60 flex items-center justify-center shrink-0">
                  <Leaf className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Farm Fresh</div>
                  <div className="text-xs text-emerald-300/70">Quality Produce</div>
                </div>
              </div>

              {/* Feature 2: Free Delivery */}
              <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#0C291D] border border-emerald-800/60 shadow-xs hover:border-[#B4F83C]/40 transition-colors">
                <div className="h-11 w-11 rounded-xl bg-emerald-900/60 text-[#B4F83C] border border-emerald-700/60 flex items-center justify-center shrink-0">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Free Delivery</div>
                  <div className="text-xs text-emerald-300/70">Fast Delivery</div>
                </div>
              </div>

              {/* Feature 3: Secure Payment */}
              <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#0C291D] border border-emerald-800/60 shadow-xs hover:border-[#B4F83C]/40 transition-colors">
                <div className="h-11 w-11 rounded-xl bg-emerald-900/60 text-[#B4F83C] border border-emerald-700/60 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Secure Payment</div>
                  <div className="text-xs text-emerald-300/70">100% Protected</div>
                </div>
              </div>

              {/* Feature 4: Easy Returns */}
              <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#0C291D] border border-emerald-800/60 shadow-xs hover:border-[#B4F83C]/40 transition-colors">
                <div className="h-11 w-11 rounded-xl bg-emerald-900/60 text-[#B4F83C] border border-emerald-700/60 flex items-center justify-center shrink-0">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Easy Returns</div>
                  <div className="text-xs text-emerald-300/70">Simple Returns</div>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 06. SHOP BY CATEGORY (STUDIO PHOTOGRAPHY + HORIZONTAL SCROLL) */}
          {/* ========================================================================= */}
          <section className={`${CONTAINER} space-y-6`}>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-bold uppercase text-emerald-700 tracking-wider">BROWSE BY AISLE</span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                  Shop by Category
                </h2>
              </div>
              <Link href="/shop" className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
                <span>View All Categories</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Desktop Horizontal Row / Mobile 2-Col Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                {
                  name: 'Fruits & Vegetables',
                  count: '140+ items',
                  image: '/images/cat-fruits-veg.jpg',
                  fallback: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&auto=format&fit=crop',
                  href: '/shop/fruits-vegetables',
                },
                {
                  name: 'Dairy & Eggs',
                  count: '65+ items',
                  image: '/images/cat-dairy-eggs.jpg',
                  fallback: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop',
                  href: '/shop/dairy-eggs',
                },
                {
                  name: 'Bakery & Bread',
                  count: '45+ items',
                  image: '/images/cat-bakery-bread.jpg',
                  fallback: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop',
                  href: '/shop/bakery-sweets',
                },
                {
                  name: 'Organic Staples',
                  count: '90+ items',
                  image: '/images/cat-staples.jpg',
                  fallback: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop',
                  href: '/shop/staples-grains',
                },
                {
                  name: 'Beverages & Juices',
                  count: '80+ items',
                  image: '/images/cat-beverages.jpg',
                  fallback: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop',
                  href: '/shop/wellness-otc',
                },
                {
                  name: 'Personal Care',
                  count: '120+ items',
                  image: '/images/cat-personal-care.jpg',
                  fallback: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop',
                  href: '/shop/wellness-otc',
                },
              ].map((cat) => (
                <Link
                  key={cat.name}
                  href={cat.href}
                  className="group rounded-2xl bg-white border border-slate-200/80 p-3.5 flex flex-col items-center text-center shadow-xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer min-h-[44px]"
                >
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#FAFAF9] mb-3 flex items-center justify-center p-1">
                    <img
                      src={cat.image}
                      onError={(e) => {
                        // Fallback in case of local cache or path issue
                        (e.target as HTMLImageElement).src = cat.fallback;
                      }}
                      alt={cat.name}
                      className="h-full w-full object-contain rounded-lg transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-tight">
                    {cat.name}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium mt-1">{cat.count}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 07. PROMOTIONAL BANNER & DELIVERY PROMOTION (2-COLUMN COMPOSITION) */}
          {/* ========================================================================= */}
          <section className={CONTAINER}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Left Column (65%): Weekend Super Saver Dark-Green Promo Area */}
              <div className="lg:col-span-8 rounded-3xl bg-gradient-to-br from-[#0F3A22] via-[#14532D] to-[#166534] p-6 sm:p-8 text-white shadow-md relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-3 text-center sm:text-left z-10 flex-1">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 text-xs font-bold text-emerald-300">
                    <Tag className="h-3.5 w-3.5" />
                    <span>LIMITED TIME OFFER</span>
                  </div>
                  
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
                    Weekend <br className="hidden sm:inline" />
                    <span className="text-emerald-300">Super Saver</span>
                  </h2>
                  
                  <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-sm">
                    Enjoy great savings on selected fresh farm harvests and kitchen staples.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                    <Link href="/shop">
                      <button
                        type="button"
                        className="bg-white hover:bg-emerald-50 text-emerald-950 font-black px-6 py-2.5 rounded-xl text-xs transition-all shadow-xs cursor-pointer active:scale-95 min-h-[44px]"
                      >
                        SHOP NOW →
                      </button>
                    </Link>

                    {/* Coupon Copy Pill */}
                    <div className="flex items-center gap-2 bg-black/20 border border-white/20 rounded-xl px-3 py-1.5">
                      <span className="text-[11px] font-mono font-black text-emerald-300">WEEKEND30</span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode('WEEKEND30')}
                        className="text-[10px] font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-2 py-0.5 rounded transition-colors"
                      >
                        {copiedCode === 'WEEKEND30' ? 'COPIED' : 'COPY'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Visual Image */}
                <div className="w-44 sm:w-56 aspect-square shrink-0 z-10 flex items-center justify-center">
                  <img
                    src="/images/hero-basket.png"
                    alt="Weekend Super Saver Fresh Produce"
                    className="w-full h-full object-contain drop-shadow-xl"
                  />
                </div>
              </div>

              {/* Right Column (35%): Secondary Delivery Promotion Card */}
              <div className="lg:col-span-4 rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 text-xs font-bold text-emerald-800">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    <span>EXPRESS 15-MIN DISPATCH</span>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    Get Delivery Fast
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Fresh groceries and daily essentials delivered right to your doorstep with cold-chain packaging.
                  </p>
                </div>

                <div className="space-y-2 text-xs text-slate-700 font-medium">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 stroke-[3]" />
                    <span>No minimum order required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 stroke-[3]" />
                    <span>Real-time GPS order tracking</span>
                  </div>
                </div>

                <Link href="/shop">
                  <button
                    type="button"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[44px]"
                  >
                    <span>ORDER NOW</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 08. DEAL OF THE DAY / PRODUCT SECTION */}
          {/* ========================================================================= */}
          <section className={CONTAINER}>
            <div className="space-y-6">
              
              {/* Header & Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider">
                    <Flame className="h-3.5 w-3.5 fill-emerald-600 text-emerald-600" />
                    <span>DAILY SAVINGS</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                    Deal of the Day
                  </h2>
                </div>

                <div className="flex items-center gap-4">
                  {/* Filter Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                    {[
                      { id: 'all', label: 'All Deals' },
                      { id: 'deals', label: '🔥 Flash Deals' },
                      { id: 'harvest', label: '🥦 Fresh Harvest' },
                      { id: 'rated', label: '⭐ Top Rated' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 cursor-pointer min-h-[36px] ${
                          activeTab === tab.id
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <Link href="/offers" className="hidden md:flex text-xs font-bold text-emerald-700 hover:text-emerald-800 items-center gap-1 shrink-0">
                    <span>VIEW ALL DEALS →</span>
                  </Link>
                </div>
              </div>

              {/* Deal Spotlight Banner Card */}
              <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200/80 p-5 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  
                  {/* Deal Image */}
                  <div className="md:col-span-3 w-full max-w-[160px] aspect-square rounded-xl overflow-hidden bg-white border border-emerald-100 p-2 flex items-center justify-center mx-auto md:mx-0 shadow-xs">
                    <img
                      src={featuredDealProduct.imageUrl}
                      alt={featuredDealProduct.name}
                      className="h-full w-full object-contain"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="md:col-span-6 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-emerald-700 text-white font-bold px-2 py-0.5 text-[10px] uppercase">
                        DEAL SPOTLIGHT
                      </span>
                      <span className="rounded-md bg-amber-500 text-white font-bold px-2 py-0.5 text-[10px] uppercase">
                        SAVE 20%
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                      {featuredDealProduct.name}
                    </h3>

                    <div className="flex items-baseline gap-2.5">
                      <span className="text-2xl font-black text-emerald-800">₹{featuredDealProduct.price}</span>
                      {featuredDealProduct.compareAtPrice && (
                        <span className="text-sm line-through text-slate-400">₹{featuredDealProduct.compareAtPrice}</span>
                      )}
                      <span className="text-xs text-slate-500 font-medium">({featuredDealProduct.unit})</span>
                    </div>

                    {/* Stock Progress Bar */}
                    <div className="space-y-1 max-w-sm">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Available in Town Hub</span>
                        <span className="text-emerald-700 font-bold">Only 12 left in stock</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div className="h-full bg-emerald-600 w-3/4 rounded-full" />
                      </div>
                    </div>
                  </div>

                  {/* Timer & CTA */}
                  <div className="md:col-span-3 flex flex-col items-center md:items-end justify-center gap-3 border-t md:border-t-0 md:border-l border-emerald-200/80 pt-4 md:pt-0 md:pl-5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                      <Clock className="h-4 w-4 text-emerald-700" />
                      <span>Ends in:</span>
                      <span className="font-mono text-xs font-bold text-emerald-900 bg-white px-2 py-1 rounded border border-emerald-200 shadow-2xs">
                        {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(featuredDealProduct.id)}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold w-full sm:w-auto rounded-xl px-5 py-2.5 text-xs flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-xs min-h-[44px]"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      <span>Grab Deal Now</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Product Grid (4 col Desktop, 3 Tablet, 2 Mobile) */}
              <ProductGrid columns={4}>
                {filteredProducts.slice(0, 8).map((prod) => (
                  <ProductCard
                    key={`deal-${prod.id}`}
                    id={prod.id}
                    name={prod.name}
                    brand={prod.brand}
                    unit={prod.unit}
                    price={typeof prod.price === 'number' ? prod.price : parseFloat(prod.price)}
                    compareAtPrice={prod.compareAtPrice ? (typeof prod.compareAtPrice === 'number' ? prod.compareAtPrice : parseFloat(prod.compareAtPrice)) : null}
                    imageUrl={prod.imageUrl}
                    categoryName={prod.category?.name}
                    isPrescriptionRequired={prod.isPrescriptionRequired}
                    isMedicine={prod.isMedicine}
                    inStock={prod.inStock !== false}
                    rating={prod.rating || 4.8}
                    ratingCount={prod.ratingCount || 36}
                    onAddToCart={() => handleAddToCart(prod.id)}
                    onQuickView={() => handleOpenQuickView(prod)}
                  />
                ))}
              </ProductGrid>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 08.1. FRESH FARM HARVEST & DAIRY ESSENTIALS (8 FRESH ITEMS) */}
          {/* ========================================================================= */}
          <section className={CONTAINER}>
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider">
                    <Leaf className="h-3.5 w-3.5 text-emerald-600" />
                    <span>DIRECT FROM SUSTAINABLE FARMS</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                    Fresh Farm Harvest &amp; Daily Dairy
                  </h2>
                </div>

                <Link href="/shop/fruits-vegetables" className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
                  <span>EXPLORE FRESH HARVEST →</span>
                </Link>
              </div>

              <ProductGrid columns={4}>
                {harvestSectionProducts.map((prod) => (
                  <ProductCard
                    key={`harvest-${prod.id}`}
                    id={prod.id}
                    name={prod.name}
                    brand={prod.brand}
                    unit={prod.unit}
                    price={typeof prod.price === 'number' ? prod.price : parseFloat(prod.price)}
                    compareAtPrice={prod.compareAtPrice ? (typeof prod.compareAtPrice === 'number' ? prod.compareAtPrice : parseFloat(prod.compareAtPrice)) : null}
                    imageUrl={prod.imageUrl}
                    categoryName={prod.category?.name}
                    isPrescriptionRequired={prod.isPrescriptionRequired}
                    isMedicine={prod.isMedicine}
                    inStock={prod.inStock !== false}
                    rating={prod.rating || 4.8}
                    ratingCount={prod.ratingCount || 42}
                    onAddToCart={() => handleAddToCart(prod.id)}
                    onQuickView={() => handleOpenQuickView(prod)}
                  />
                ))}
              </ProductGrid>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 08.2. PANTRY STAPLES, SNACKS & GOURMET BEVERAGES (8 PANTRY ITEMS) */}
          {/* ========================================================================= */}
          <section className={CONTAINER}>
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                    <span>KITCHEN ESSENTIALS</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                    Pantry Staples &amp; Healthy Munchies
                  </h2>
                </div>

                <Link href="/shop/staples-grains" className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
                  <span>VIEW ALL STAPLES →</span>
                </Link>
              </div>

              <ProductGrid columns={4}>
                {pantrySectionProducts.map((prod) => (
                  <ProductCard
                    key={`pantry-${prod.id}`}
                    id={prod.id}
                    name={prod.name}
                    brand={prod.brand}
                    unit={prod.unit}
                    price={typeof prod.price === 'number' ? prod.price : parseFloat(prod.price)}
                    compareAtPrice={prod.compareAtPrice ? (typeof prod.compareAtPrice === 'number' ? prod.compareAtPrice : parseFloat(prod.compareAtPrice)) : null}
                    imageUrl={prod.imageUrl}
                    categoryName={prod.category?.name}
                    isPrescriptionRequired={prod.isPrescriptionRequired}
                    isMedicine={prod.isMedicine}
                    inStock={prod.inStock !== false}
                    rating={prod.rating || 4.8}
                    ratingCount={prod.ratingCount || 58}
                    onAddToCart={() => handleAddToCart(prod.id)}
                    onQuickView={() => handleOpenQuickView(prod)}
                  />
                ))}
              </ProductGrid>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 08.3. PHARMACY & VERIFIED HEALTHCARE (4 WELLNESS ESSENTIALS) */}
          {/* ========================================================================= */}
          <section className={CONTAINER}>
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span>DOCTOR VERIFIED</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                    Pharmacy &amp; Health Essentials
                  </h2>
                </div>

                <Link href="/shop/wellness-otc" className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
                  <span>VIEW PHARMACY CATALOG →</span>
                </Link>
              </div>

              <ProductGrid columns={4}>
                {pharmacySectionProducts.map((prod) => (
                  <ProductCard
                    key={`health-${prod.id}`}
                    id={prod.id}
                    name={prod.name}
                    brand={prod.brand}
                    unit={prod.unit}
                    price={typeof prod.price === 'number' ? prod.price : parseFloat(prod.price)}
                    compareAtPrice={prod.compareAtPrice ? (typeof prod.compareAtPrice === 'number' ? prod.compareAtPrice : parseFloat(prod.compareAtPrice)) : null}
                    imageUrl={prod.imageUrl}
                    categoryName={prod.category?.name}
                    isPrescriptionRequired={prod.isPrescriptionRequired}
                    isMedicine={prod.isMedicine}
                    inStock={prod.inStock !== false}
                    rating={prod.rating || 4.9}
                    ratingCount={prod.ratingCount || 120}
                    onAddToCart={() => handleAddToCart(prod.id)}
                    onQuickView={() => handleOpenQuickView(prod)}
                  />
                ))}
              </ProductGrid>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 09. WHY CHOOSE US (5 BENEFIT CARDS) */}
          {/* ========================================================================= */}
          <section className={`${CONTAINER} space-y-6`}>
            <div className="text-center max-w-xl mx-auto space-y-1.5">
              <span className="text-xs font-bold uppercase text-emerald-700 tracking-wider">OUR CORE PROMISE</span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Why Choose TORD Fresh
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                We combine the freshest local farm harvests with certified safety and 15-minute dispatch.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                {
                  icon: Leaf,
                  title: 'Best Quality',
                  desc: 'Fresh, carefully selected organic produce directly from certified local farms.',
                },
                {
                  icon: BadgePercent,
                  title: 'Affordable Prices',
                  desc: 'Competitive town rates, wholesale savings, and direct coupon discounts.',
                },
                {
                  icon: Truck,
                  title: 'Fast Delivery',
                  desc: '15-minute temperature-controlled delivery straight to your doorstep.',
                },
                {
                  icon: ShieldCheck,
                  title: '100% Secure',
                  desc: '256-bit encrypted checkout and doctor-verified pharmaceutical safety.',
                },
                {
                  icon: RotateCcw,
                  title: 'Easy Returns',
                  desc: 'Simple, hassle-free doorstep returns and instant refund guarantee.',
                },
              ].map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={benefit.title}
                    className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2.5 hover:border-emerald-300 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{benefit.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{benefit.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 10. CUSTOMER REVIEWS (WHAT OUR CUSTOMERS SAY) */}
          {/* ========================================================================= */}
          <section className={`${CONTAINER} space-y-6`}>
            <div className="text-center max-w-lg mx-auto space-y-1">
              <span className="text-xs font-bold uppercase text-emerald-700 tracking-wider">TESTIMONIALS</span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                What Our Customers Say
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  quote: 'The 15-minute express delivery for organic vegetables and pure A2 milk has transformed our family morning routine. Produce always arrives crisp and farm-fresh!',
                  name: 'Ananya Sharma',
                  role: 'Regular Grocery Buyer',
                  rating: 5,
                  avatar: 'AS',
                },
                {
                  quote: 'Uploading prescription meds and having verified pharmacist approval in minutes is fantastic. Highly reliable and convenient for monthly elder care medicines.',
                  name: 'Dr. Rajesh Patel',
                  role: 'Medical Consultant',
                  rating: 5,
                  avatar: 'RP',
                },
                {
                  quote: 'Crisp user interface, instant coupon discounts, and truly fresh fruits. Customer support on order tracking is prompt and polite.',
                  name: 'Priya Verma',
                  role: 'Town Resident',
                  rating: 5,
                  avatar: 'PV',
                },
              ].map((t) => (
                <div key={t.name} className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex text-amber-400 gap-0.5 text-xs">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 italic leading-relaxed">"{t.quote}"</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                        {t.avatar}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{t.name}</div>
                        <div className="text-[10px] text-emerald-700 font-semibold">{t.role}</div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                      ✓ Verified
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 11. SOCIAL PROOF / TRUST METRICS */}
          {/* ========================================================================= */}
          <section className={CONTAINER}>
            <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs">
              <div className="text-center mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">COMMUNITY TRUST</span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                  Trusted by Thousands of Customers
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div className="space-y-1">
                  <div className="text-3xl font-black text-emerald-700">50,000+</div>
                  <div className="text-xs font-medium text-slate-500">Happy Households Served</div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-black text-emerald-700">1,200+</div>
                  <div className="text-xs font-medium text-slate-500">Certified Partner Farms</div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-black text-emerald-700">15 Min</div>
                  <div className="text-xs font-medium text-slate-500">Average Doorstep Delivery</div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-black text-emerald-700">4.9 / 5</div>
                  <div className="text-xs font-medium text-slate-500">Customer Satisfaction Rating</div>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 12. NEWSLETTER (GET EXCLUSIVE OFFERS) */}
          {/* ========================================================================= */}
          <section className={CONTAINER}>
            <div className="rounded-3xl bg-gradient-to-r from-slate-900 to-[#0A2616] text-white p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
              <div className="space-y-1 max-w-md">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <Leaf className="h-3.5 w-3.5" />
                  <span>WEEKLY HARVEST DISPATCH</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Get Exclusive Offers</h2>
                <p className="text-xs text-slate-300">
                  Subscribe for offers, new arrivals and grocery updates delivered straight to your inbox.
                </p>
              </div>

              <form onSubmit={handleNewsletter} className="flex items-center gap-2 w-full md:w-auto">
                <input
                  type="email"
                  required
                  placeholder="Enter your email address..."
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="px-4 py-2.5 text-xs text-white bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:border-emerald-400 w-full md:w-64 placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl px-4 py-2.5 text-xs shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 min-h-[44px]"
                >
                  {newsletterSubscribed ? (
                    <>
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                      <span>Subscribed</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>SUBSCRIBE</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </section>

          {/* System API Status */}
          <section className={CONTAINER}>
            <ApiStatusCard />
          </section>
        </main>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={selectedQuickView}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        onAddToCart={(productId, qty) => handleAddToCart(productId, qty)}
      />

      {/* ========================================================================= */}
      {/* 13. FOOTER (5-COLUMN DARK-GREEN FOOTER) */}
      {/* ========================================================================= */}
      <SiteFooter />
    </div>
  );
}
