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
import { Link } from "react-router-dom";
import AuthModal from "./AuthModal";

const CompleteLandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isYearly, setIsYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Redirect authenticated users to dashboard only from landing page
  useEffect(() => {
    if (user && window.location.pathname === '/') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

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
      answer: "Yes! ScribeSchedule supports bulk scheduling via CSV upload, making it easy to schedule multiple posts at once."
    },
    {
      question: "Does ScribeSchedule support Reddit and subreddit-specific scheduling?",
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
              <span className="text-4xl md:text-6xl">5 platforms in seconds</span>
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

            {/* Hero Image */}
            <div className="relative max-w-5xl mx-auto mb-12">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-100 px-4 py-3 flex items-center space-x-2">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                  <div className="flex-1 bg-white rounded-md px-3 py-1 text-sm text-gray-600 ml-4">
                    scribeschedule.com/dashboard
                  </div>
                </div>
                <div className="p-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 min-h-[400px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg" style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }}>
                      <Calendar className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">ScribeSchedule Dashboard</h3>
                    <p className="text-lg text-gray-600 mb-6">Your complete social media command center</p>
                    <div className="flex justify-center space-x-4">
                      <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
                        <div className="text-2xl font-bold text-blue-600">247</div>
                        <div className="text-xs text-gray-500">Posts</div>
                      </div>
                      <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
                        <div className="text-2xl font-bold text-green-600">23</div>
                        <div className="text-xs text-gray-500">Scheduled</div>
                      </div>
                      <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
                        <div className="text-2xl font-bold text-purple-600">5</div>
                        <div className="text-xs text-gray-500">Platforms</div>
                      </div>
                    </div>
                  </div>
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

export default CompleteLandingPage;
