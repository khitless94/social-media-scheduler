import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Menu,
  X,
  Play,
  Calendar,
  Share2,
  BarChart3,
  Clock,
  Users,
  TrendingUp,
  Target,
  ChevronDown,
  Star,
  Check,
  Sparkles,
  Zap,
  ArrowRight
} from "lucide-react";
import { FaLinkedin, FaTwitter, FaInstagram, FaFacebook, FaReddit } from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import { useRoutePreservation } from "@/hooks/useRoutePreservation";
import { Link } from "react-router-dom";
import AuthModal from "./AuthModal";
import ProfessionalDashboard from "./ProfessionalDashboard";

const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getLastVisitedRoute } = useRoutePreservation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isYearly, setIsYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Redirect authenticated users to their last visited route or dashboard
  useEffect(() => {
    if (user && window.location.pathname === '/') {
      const lastRoute = getLastVisitedRoute();
      navigate(lastRoute);
    }
  }, [user, navigate, getLastVisitedRoute]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqData = [
    {
      question: "Can I schedule posts using a CSV file?",
      answer: "Yes! Our platform supports bulk scheduling via CSV upload, making it easy to schedule multiple posts at once."
    },
    {
      question: "Do you support Reddit and subreddit-specific scheduling?",
      answer: "Absolutely! You can schedule posts to specific subreddits and manage your Reddit content alongside other platforms."
    },
    {
      question: "What type of media can I schedule?",
      answer: "You can schedule images, videos, text posts, and links across all supported platforms."
    },
    {
      question: "Can I preview how a post will look on each platform?",
      answer: "Yes, our preview feature shows you exactly how your post will appear on each social media platform before publishing."
    },
    {
      question: "Do you offer analytics or performance tracking?",
      answer: "Yes, we provide detailed analytics and performance tracking for all your scheduled and published posts."
    },
    {
      question: "Do you offer any discounts?",
      answer: "Yes! Use code 50KMRR for 10% off all plans. We also offer annual billing discounts."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Absolutely! You can cancel your subscription at any time with no cancellation fees."
    },
    {
      question: "How fast is customer support?",
      answer: "We provide priority support with typical response times under 24 hours for all paid plans."
    },
    {
      question: "Can I customize post timings per platform?",
      answer: "Yes, you can set different optimal posting times for each platform to maximize engagement."
    },
    {
      question: "Will you support more platforms in the future?",
      answer: "Yes! We're constantly adding new platforms based on user demand and platform availability."
    },
    {
      question: "What happens if I hit a platform's posting limit?",
      answer: "Our system respects platform limits and will queue posts appropriately to avoid any issues."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-xl shadow-sm' : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}>
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900">ScribeSchedule</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-gray-600 hover:text-gray-900">Blogs</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Affiliates</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900">Testimonials</a>
              <a href="#faq" className="text-gray-600 hover:text-gray-900">FAQ</a>
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" onClick={() => openAuth('signin')}>
                Log in
              </Button>
              <Button
                className="text-white font-semibold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
                onClick={() => openAuth('signup')}
              >
                Start Posting
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col space-y-4">
                <a href="#" className="text-gray-600 hover:text-gray-900">Blogs</a>
                <a href="#" className="text-gray-600 hover:text-gray-900">Affiliates</a>
                <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
                <a href="#testimonials" className="text-gray-600 hover:text-gray-900">Testimonials</a>
                <a href="#faq" className="text-gray-600 hover:text-gray-900">FAQ</a>
                <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                  <Button variant="ghost" onClick={() => openAuth('signin')}>
                    Log in
                  </Button>
                  <Button
                    className="text-white font-semibold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }}
                    onClick={() => openAuth('signup')}
                  >
                    Start Posting
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Schedule content across<br />
              <span className="text-4xl md:text-6xl">9 platforms in seconds</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Batch upload, schedule, and boost engagement on your socials without wasting time and money.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Button
                className="text-white font-semibold px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
                onClick={() => openAuth('signup')}
              >
                <Zap className="w-5 h-5 mr-2" />
                Start Free Trial
              </Button>
              <Button
                variant="outline"
                className="px-8 py-4 text-lg rounded-xl border-2 hover:bg-gray-50 transition-all duration-300"
                onClick={() => document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Play className="w-4 h-4 mr-2" />
                Watch Demo
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-500 mb-12">
              <span>7-day free trial</span>
              <span>Cancel anytime</span>
              <span>No credit card required</span>
            </div>

            {/* Real Dashboard Demo */}
            <div className="relative max-w-7xl mx-auto mb-12">
              <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
                {/* Browser Chrome */}
                <div className="bg-gray-100 px-6 py-4 flex items-center justify-between border-b border-gray-200">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-white rounded-lg px-4 py-2 text-sm text-gray-600 text-center">
                      scribeschedule.com/dashboard
                    </div>
                  </div>
                  <div className="w-16"></div>
                </div>

                {/* Real Dashboard Content */}
                <div className="h-[600px] overflow-hidden">
                  <div className="transform scale-75 origin-top-left w-[133.33%] h-[133.33%]">
                    <ProfessionalDashboard />
                  </div>
                </div>
              </div>

              {/* Demo Overlay */}
              <div className="absolute inset-0 bg-transparent pointer-events-none">
                <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                  🎯 Live Demo
                </div>
              </div>
            </div>

            {/* Live Stats */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-8">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-gray-700 font-medium">🔥 Live: 23 posts scheduled</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-700 font-medium">⚡ 156 hours saved today</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AS SEEN ON Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-gray-500 mb-6 uppercase tracking-wider font-medium">AS SEEN ON:</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">PH</span>
            </div>
            <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">X</span>
            </div>
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">YT</span>
            </div>
            <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">@</span>
            </div>
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              Top 1 Daily Winner
            </div>
          </div>
        </div>
      </section>

      {/* Platforms Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm text-blue-600 font-semibold uppercase tracking-wider mb-4">SUPPORTED PLATFORMS</p>
            <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-6">
              Manage all your social media in one place
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Connect and manage all major social media platforms from a single dashboard. No more switching between apps or logging into multiple accounts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: FaTwitter,
                name: "X (formerly Twitter)",
                description: "Share quick updates, engage in conversations, and build your voice",
                color: "text-black",
                bgColor: "bg-gray-100",
                hoverBg: "group-hover:bg-gray-200"
              },
              {
                icon: FaReddit,
                name: "Reddit",
                description: "Engage with communities and share content across subreddits",
                color: "text-orange-500",
                bgColor: "bg-orange-50",
                hoverBg: "group-hover:bg-orange-100"
              },
              {
                icon: FaLinkedin,
                name: "LinkedIn",
                description: "Build professional networks and share industry insights",
                color: "text-blue-600",
                bgColor: "bg-blue-50",
                hoverBg: "group-hover:bg-blue-100"
              },
              {
                icon: FaFacebook,
                name: "Facebook",
                description: "Connect with your audience through posts, stories, and community building",
                color: "text-blue-600",
                bgColor: "bg-blue-50",
                hoverBg: "group-hover:bg-blue-100"
              },
              {
                icon: FaInstagram,
                name: "Instagram",
                description: "Share photos, stories, and reels with perfect timing and engagement",
                color: "text-pink-500",
                bgColor: "bg-pink-50",
                hoverBg: "group-hover:bg-pink-100"
              }
            ].map((platform, index) => (
              <a
                key={index}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  openAuth('signup');
                }}
                className="group block p-8 bg-white rounded-2xl border border-gray-200 hover:shadow-xl hover:border-blue-200 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center mb-4">
                  <div className={`w-14 h-14 ${platform.bgColor} rounded-xl flex items-center justify-center mr-4 transition-colors ${platform.hoverBg}`}>
                    <platform.icon className={`w-7 h-7 ${platform.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{platform.name}</h3>
                </div>
                <p className="text-gray-600 leading-relaxed">{platform.description}</p>
              </a>
            ))}
          </div>

          <div className="text-center mt-16">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 max-w-2xl mx-auto">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}>
                  <Check className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">5 Platforms</div>
                  <div className="text-sm text-gray-600">All connected and ready</div>
                </div>
              </div>
              <p className="text-gray-600 font-medium">Complete social media coverage with more platforms being added regularly</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section id="dashboard" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-wider mb-4" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>DASHBOARD PREVIEW</p>
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4">
              Everything you need in one place
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              Manage all your social media accounts from a single, intuitive dashboard designed for efficiency.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg" style={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
              }}>
                <Share2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">All platforms synced</h3>
              <p className="text-gray-600 text-sm">Connect all your social accounts in one dashboard</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg" style={{
                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
              }}>
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Bulk Scheduling</h3>
              <p className="text-gray-600 text-sm">Schedule multiple posts across platforms at once</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}>
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart scheduling</h3>
              <p className="text-gray-600 text-sm">AI-powered optimal posting times for maximum reach</p>
            </div>
          </div>

          {/* Enhanced Dashboard Preview */}
          <div className="relative max-w-6xl mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-100 px-6 py-4 flex items-center justify-between border-b border-gray-200">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white rounded-lg px-4 py-2 text-sm text-gray-600 text-center">
                    scribeschedule.com/dashboard
                  </div>
                </div>
                <div className="w-16"></div>
              </div>

              <div className="bg-gray-50 p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Welcome back! 👋</h3>
                    <p className="text-gray-600 mt-1">Here's what's happening with your social media today</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                      All systems operational
                    </div>
                    <Button
                      className="text-white font-semibold px-4 py-2 rounded-xl shadow-lg"
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      }}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Create Post
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Posts</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">247</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex items-center mt-4 text-sm">
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-green-600 font-medium">+12%</span>
                      <span className="text-gray-500 ml-1">vs last month</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Scheduled</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">23</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                    <div className="flex items-center mt-4 text-sm">
                      <Clock className="w-4 h-4 text-blue-500 mr-1" />
                      <span className="text-gray-600">Next in 2 hours</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Engagement</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">8.4K</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                    <div className="flex items-center mt-4 text-sm">
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-green-600 font-medium">+28%</span>
                      <span className="text-gray-500 ml-1">this week</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Platforms</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">5</p>
                      </div>
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                        <Share2 className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                    <div className="flex items-center mt-4 text-sm">
                      <Check className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-green-600 font-medium">All connected</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-semibold text-gray-900">Recent Posts</h4>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View all</button>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                      <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                        <FaInstagram className="w-6 h-6 text-pink-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">New product launch announcement 🚀</p>
                        <p className="text-xs text-gray-500 mt-1">Posted 2 hours ago • 156 likes, 23 comments</p>
                      </div>
                      <div className="text-green-600 text-sm font-medium">Published</div>
                    </div>
                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <FaLinkedin className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Behind the scenes: Team collaboration tips</p>
                        <p className="text-xs text-gray-500 mt-1">Scheduled for tomorrow 9:00 AM</p>
                      </div>
                      <div className="text-blue-600 text-sm font-medium">Scheduled</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-wider mb-4" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>PROVEN RESULTS</p>
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-6">
              Real results from real businesses
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our customers consistently save hours every week while achieving better results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl">
              <div className="text-5xl font-bold mb-2" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>15+</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Hours Saved Per Week</h3>
              <p className="text-gray-600">Automate your social media workflow and reclaim your valuable time for strategic tasks.</p>
            </div>
            <div className="text-center p-8 bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl">
              <div className="text-5xl font-bold mb-2" style={{
                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>50%</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Reduction in Manual Work</h3>
              <p className="text-gray-600">Cut your workload in half with our streamlined scheduling and management tools.</p>
            </div>
            <div className="text-center p-8 bg-gradient-to-br from-pink-50 to-red-50 rounded-2xl">
              <div className="text-5xl font-bold mb-2" style={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>40%</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Increase in Engagement</h3>
              <p className="text-gray-600">Optimize your posting schedule to reach your audience when they're most active and engaged.</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl p-8 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-6">
                  How ScribeSchedule transforms your workflow
                </h3>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }}>
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Streamlined Scheduling</h4>
                      <p className="text-gray-600">Schedule posts across all platforms from one intuitive dashboard</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                      background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                    }}>
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Time-Saving Tools</h4>
                      <p className="text-gray-600">Manage all your social accounts in half the time with our powerful tools</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                    }}>
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Better Engagement</h4>
                      <p className="text-gray-600">Reach your audience at optimal times for maximum impact</p>
                    </div>
                  </div>
                </div>
                <div className="mt-8">
                  <Button
                    className="text-white font-semibold px-8 py-3 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }}
                    onClick={() => openAuth('signup')}
                  >
                    Start your free trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">No credit card required • 7 days free</p>
                </div>
              </div>
              <div className="relative">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg" style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }}>
                      <TrendingUp className="w-10 h-10 text-white" />
                    </div>
                    <h4 className="text-2xl font-semibold text-gray-900 mb-4">Time Saving Dashboard</h4>
                    <p className="text-gray-600 mb-6">Visualize your social media performance and save hours every week</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-blue-600">15h</div>
                        <div className="text-xs text-gray-500">Saved/Week</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-green-600">+40%</div>
                        <div className="text-xs text-gray-500">Engagement</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-lg text-gray-600 mb-4">
              <Button variant="link" className="p-0 text-lg" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }} onClick={() => openAuth('signup')}>
                Join 1000+ businesses
              </Button> that have transformed their social media management with ScribeSchedule
            </p>
            <p className="text-sm text-gray-500">🚀 Start your free 7-day trial today - no credit card required!</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-wider mb-4" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>PRICING</p>
            <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-6">Simple, transparent pricing</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Choose the plan that's right for your business. Start with our 7-day free trial - no credit card required.</p>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-12">
            <Label className={`text-sm font-medium cursor-pointer ${!isYearly ? 'text-gray-900' : 'text-gray-600'}`}>
              Monthly
            </Label>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-purple-600"
            />
            <Label className={`text-sm font-medium cursor-pointer ${isYearly ? 'text-gray-900' : 'text-gray-600'}`}>
              Annual <span className="text-green-600 font-semibold">(Save 20%)</span>
            </Label>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Free Trial",
                price: "Free for 7 days",
                description: "No payment required - starts automatically",
                subtext: "Perfect for testing out the application with professional features",
                features: [
                  "7 Days Free Access",
                  "5 social media accounts",
                  "15 scheduled posts",
                  "Preview posts before publishing",
                  "Content calendar",
                  "Basic analytics",
                  "Email support",
                  "No credit card required"
                ],
                buttonText: "Start Free Trial",
                buttonClass: "primary"
              },
              {
                name: "Professional",
                price: isYearly ? "$144/year" : "$16/month",
                description: "Ideal for growing brands and marketing teams.",
                features: [
                  "25 social media accounts",
                  "Unlimited scheduled posts",
                  "Preview posts before publishing",
                  "Content calendar",
                  "Bulk Scheduling",
                  "Advanced analytics",
                  "Team collaboration",
                  "Priority support",
                  "Custom branding",
                  "API access"
                ],
                popular: true,
                buttonText: "Get Started",
                buttonClass: "primary"
              },
              {
                name: "Enterprise",
                price: "Custom",
                description: "For large enterprises needing advanced features and dedicated support.",
                features: [
                  "Unlimited social accounts",
                  "Full customization",
                  "White-label solution",
                  "Dedicated account manager",
                  "24/7 priority support",
                  "Custom integrations",
                  "SLA guarantee",
                  "Advanced security",
                  "Custom reporting",
                  "Training & onboarding"
                ],
                buttonText: "Contact Sales",
                buttonClass: "secondary"
              }
            ].map((plan, index) => (
              <div key={index} className={`relative bg-white rounded-2xl shadow-lg border-2 ${plan.popular ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-200'} p-8 hover:shadow-xl transition-all duration-300`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full text-sm font-semibold text-white shadow-lg" style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }}>
                      MOST POPULAR
                    </span>
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold text-gray-900 mb-2">{plan.price}</div>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  {plan.subtext && <p className="text-sm text-gray-500 mb-6">{plan.subtext}</p>}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center mr-3 flex-shrink-0" style={{
                        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                      }}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full font-semibold py-3 rounded-xl transition-all duration-300 ${
                    plan.buttonClass === 'primary'
                      ? 'text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                      : 'border-2 hover:bg-gray-50'
                  }`}
                  style={plan.buttonClass === 'primary' ? {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  } : {}}
                  variant={plan.buttonClass === 'primary' ? 'default' : 'outline'}
                  onClick={() => plan.buttonText === "Contact Sales" ? window.open('mailto:support@scribeschedule.com', '_blank') : openAuth('signup')}
                >
                  {plan.buttonText}
                </Button>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600">Ready to get started? Begin with our 7-day free trial - no credit card required.</p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-wider mb-4" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>TESTIMONIALS</p>
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-6">
              Trusted by professionals
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              See how creators like you achieve remarkable results with ScribeSchedule.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
              <div className="flex items-center mb-6">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                "Since implementing ScribeSchedule, I've increased my engagement by 42% while cutting my social media management time in half. The scheduling features are incredibly intuitive!"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4" style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}>
                  <span className="text-white font-bold">KG</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Krish Gohil</div>
                  <div className="text-gray-600">Founder, Picyard</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-8 border border-green-100">
              <div className="flex items-center mb-6">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                "ScribeSchedule has transformed my content strategy. I can now focus on creating great content instead of worrying about when to post it. The analytics are fantastic!"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4" style={{
                  background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                }}>
                  <span className="text-white font-bold">AT</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Arpit Tiwari</div>
                  <div className="text-gray-600">Social Media Manager</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-red-50 rounded-2xl p-8 border border-pink-100">
              <div className="flex items-center mb-6">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                "The bulk scheduling feature is a game-changer! I can plan my entire month's content in just a few hours. My productivity has skyrocketed."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4" style={{
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                }}>
                  <span className="text-white font-bold">SM</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Sarah Mitchell</div>
                  <div className="text-gray-600">Content Creator</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-8 border border-purple-100">
              <div className="flex items-center mb-6">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                "ScribeSchedule's analytics helped me understand my audience better. I now post at optimal times and my engagement rates have never been higher!"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4" style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}>
                  <span className="text-white font-bold">MJ</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Mike Johnson</div>
                  <div className="text-gray-600">Digital Marketer</div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button
              className="text-white font-semibold px-8 py-3 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
              onClick={() => openAuth('signup')}
            >
              Join our happy customers
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-wider mb-4" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>FAQ</p>
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-6">
              Frequently asked questions
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to know about ScribeSchedule
            </p>
          </div>

          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <div key={index} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <button
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 rounded-2xl transition-colors"
                  onClick={() => toggleFaq(index)}
                >
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">{faq.question}</h3>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    openFaq === index
                      ? 'transform rotate-180'
                      : ''
                  }`} style={{
                    background: openFaq === index
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'transparent'
                  }}>
                    <ChevronDown className={`w-5 h-5 transition-colors ${
                      openFaq === index ? 'text-white' : 'text-gray-500'
                    }`} />
                  </div>
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">Still have questions?</p>
            <Button
              variant="outline"
              className="border-2 hover:bg-gray-50 px-6 py-2 rounded-xl"
              onClick={() => window.open('mailto:support@scribeschedule.com', '_blank')}
            >
              Contact Support
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-3xl p-12 shadow-2xl border border-gray-200">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4">
              Ready to save time and grow your social media?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of businesses that are saving time and growing their audience with ScribeSchedule.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6">
              <Button
                className="text-white font-semibold px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
                onClick={() => openAuth('signup')}
              >
                <Zap className="w-5 h-5 mr-2" />
                Start Free Trial
              </Button>
              <Button
                variant="outline"
                className="px-8 py-4 text-lg rounded-xl border-2 hover:bg-gray-50 transition-all duration-300"
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              >
                View Pricing
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-500">
              <span>✅ 7-day free trial</span>
              <span>✅ Cancel anytime</span>
              <span>✅ No credit card required</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}>
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-semibold">ScribeSchedule</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                The complete social media management solution for growing businesses. Schedule, analyze, and grow your social presence effortlessly.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <FaTwitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <FaLinkedin className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <FaInstagram className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <FaFacebook className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#testimonials" className="text-gray-400 hover:text-white transition-colors">Testimonials</a></li>
                <li><a href="#faq" className="text-gray-400 hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="mailto:support@scribeschedule.com" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API Docs</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">© 2025 ScribeSchedule. All rights reserved.</p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          mode={authMode}
        />
      )}
    </div>
  );
};

export default LandingPage;
