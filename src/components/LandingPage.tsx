import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import confetti from 'canvas-confetti';
import {
  Check,
  Star,
  Sparkles,
  Play,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Menu,
  X,
  Wand2,
  Calendar,
  BarChart,
  Zap,
  Users,
  TrendingUp,
  Target,
  Rocket,
  ArrowRight,
  Globe,
  Shield,
  Clock,
  Image,
  Hash,
  Link as LinkIcon,
  MessageSquare,
  Eye,
  Heart,
  Share2,
  BarChart3,
  PieChart,
  Activity,
  Palette,
  Type,
  Layout,
  Smartphone,
  Monitor,
  Tablet
} from "lucide-react";
import { FaReddit } from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import AuthModal from "./AuthModal";

const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isYearly, setIsYearly] = useState(false);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (user) {
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

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8B5CF6', '#3B82F6', '#6366F1', '#10B981', '#F59E0B']
    });

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ['#8B5CF6', '#3B82F6', '#6366F1']
      });
    }, 200);

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ['#8B5CF6', '#3B82F6', '#6366F1']
      });
    }, 400);
  };

  const handleYearlyToggle = (checked: boolean) => {
    setIsYearly(checked);
    if (checked) {
      triggerConfetti();
    }
  };

  const handleToggleClick = () => {
    const newValue = !isYearly;
    handleYearlyToggle(newValue);
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/2 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-100'
          : 'bg-white/80 backdrop-blur-sm'
      }`}>
        <div className="container-responsive h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">ScribeSchedule</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <nav className="flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium">Pricing</a>
            </nav>
            {user ? (
              <Button asChild className="btn-primary">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <div className="flex items-center space-x-3">
                <Button variant="ghost" onClick={() => openAuth('signin')}>Login</Button>
                <Button className="btn-primary" onClick={() => openAuth('signup')}>Try free</Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100">
            <div className="container-responsive py-4 space-y-4">
              <a href="#features" className="block text-gray-600 hover:text-gray-900 font-medium py-2">Features</a>
              <a href="#pricing" className="block text-gray-600 hover:text-gray-900 font-medium py-2">Pricing</a>
              <div className="pt-4 border-t border-gray-200 space-y-3">
                {user ? (
                  <Button asChild className="w-full btn-primary">
                    <Link to="/dashboard">Dashboard</Link>
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => openAuth('signin')} className="w-full">Login</Button>
                    <Button className="w-full btn-primary" onClick={() => openAuth('signup')}>Try free</Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        <div className="container-responsive relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Headline */}
            <h1 className="text-responsive-xl font-bold text-gray-900 mb-6 leading-tight">
              Effortless Social Media
              <br />
              <span className="text-gradient-primary">Content Creation</span>
            </h1>

            {/* Subheadline */}
            <p className="text-responsive-md text-gray-600 mb-8 leading-relaxed">
              Transform your social media strategy with intelligent content creation.<br />
              From idea to published post in minutes, not hours.<br />
              Built for creators, marketers, and growing businesses.
            </p>

            {/* CTA Buttons */}
            <div className="flex justify-center items-center mb-12">
              {user ? (
                <Button asChild size="lg" className="btn-primary text-lg px-8 py-4">
                  <Link to="/dashboard">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Go to Dashboard
                  </Link>
                </Button>
              ) : (
                <Button size="lg" className="btn-primary text-lg px-8 py-4" onClick={() => openAuth('signup')}>
                  Start creating now
                </Button>
              )}
            </div>

            {/* Social Proof */}
            <div className="flex flex-wrap justify-center items-center gap-8 mb-16 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-1">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full border-2 border-white"></div>
                  ))}
                </div>
                <span>Trusted by content creators worldwide</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span>Highly rated platform</span>
              </div>
            </div>
          </div>

          {/* Interactive Demo */}
          <div className="max-w-6xl mx-auto mb-16">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">See ScribeSchedule in action</h3>
              <p className="text-lg text-gray-600">Experience our intuitive dashboard and powerful features</p>
            </div>

            <div className="relative">
              {/* Demo Container - Sample Interactive Demo */}
              <div
                id="scribeschedule-demo"
                className="bg-gray-50 rounded-2xl shadow-2xl border border-gray-200 overflow-hidden min-h-[600px]"
                style={{ aspectRatio: '16/10' }}
              >
                {/* Sample Dashboard Demo */}
                <div className="h-full flex">
                  {/* Sidebar */}
                  <div className="w-64 bg-white border-r border-gray-200 p-4">
                    <div className="flex items-center space-x-3 mb-8">
                      <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-bold text-gray-900">ScribeSchedule</span>
                    </div>

                    <nav className="space-y-2">
                      <div className="flex items-center space-x-3 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg">
                        <Wand2 className="w-4 h-4" />
                        <span className="text-sm font-medium">Create Post</span>
                      </div>
                      <div className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">Schedule</span>
                      </div>
                      <div className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                        <BarChart className="w-4 h-4" />
                        <span className="text-sm">Analytics</span>
                      </div>
                      <div className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">My Posts</span>
                      </div>
                    </nav>


                  </div>

                  {/* Main Content */}
                  <div className="flex-1 p-6">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Create your first post</h2>
                      <p className="text-gray-600">Transform your ideas into engaging content with AI assistance.</p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                      {/* Content Creation */}
                      <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Wand2 className="w-4 h-4 text-purple-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900">AI Content Generator</h3>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-3">What's your post about?</label>
                              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <Type className="w-4 h-4" />
                                  <span>"Launching our new product next week..."</span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-3">AI Generated Content</label>
                              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-5 border border-blue-200">
                                <div className="flex items-start space-x-3 mb-4">
                                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Sparkles className="w-3 h-3 text-white" />
                                  </div>
                                  <p className="text-sm text-gray-800 leading-relaxed">
                                    🚀 Big news is coming! We can't wait to share what we've been working on.
                                    Get ready for something that will change the game! #Innovation #ComingSoon #Excited
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">#Innovation</Badge>
                                  <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">#ProductLaunch</Badge>
                                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">#Startup</Badge>
                                </div>
                              </div>
                            </div>

                            <div className="flex space-x-3">
                              <Button className="btn-primary text-sm">
                                <Zap className="w-4 h-4 mr-2" />
                                Regenerate
                              </Button>
                              <Button variant="outline" className="text-sm">
                                <Calendar className="w-4 h-4 mr-2" />
                                Schedule Post
                              </Button>
                            </div>
                          </div>
                        </div>


                      </div>

                      {/* Stats Sidebar */}
                      <div className="space-y-4">
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Calendar className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="font-medium text-gray-900">Scheduled Posts</span>
                          </div>
                          <div className="text-2xl font-bold text-gray-900">24</div>
                          <div className="text-sm text-gray-500">This month</div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <TrendingUp className="w-4 h-4 text-green-600" />
                            </div>
                            <span className="font-medium text-gray-900">Engagement</span>
                          </div>
                          <div className="text-2xl font-bold text-gray-900">+23%</div>
                          <div className="text-sm text-gray-500">vs last month</div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Eye className="w-4 h-4 text-purple-600" />
                            </div>
                            <span className="font-medium text-gray-900">Reach</span>
                          </div>
                          <div className="text-2xl font-bold text-gray-900">12.5K</div>
                          <div className="text-sm text-gray-500">Total impressions</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Demo overlay with browser chrome */}
              <div className="absolute top-0 left-0 right-0 bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center space-x-3 rounded-t-2xl">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <div className="text-sm text-gray-500">app.scribeschedule.com</div>
                <div className="ml-auto">
                  <Badge className="bg-green-100 text-green-700 text-xs">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    Live Demo
                  </Badge>
                </div>
              </div>
            </div>

            {/* Demo Features Highlight */}
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Wand2 className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">AI Content Creation</h4>
                <p className="text-sm text-gray-600">Watch how AI generates engaging posts in seconds</p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Smart Scheduling</h4>
                <p className="text-sm text-gray-600">See optimal timing recommendations in action</p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <BarChart className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Analytics Dashboard</h4>
                <p className="text-sm text-gray-600">Explore real-time performance insights</p>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center items-center gap-8 mb-16">
            {[
              { name: "Trustpilot", rating: "4.8/5" },
              { name: "Capterra", rating: "4.9/5" },
              { name: "G2", rating: "4.7/5" },
            ].map((badge, index) => (
              <div key={index} className="flex items-center space-x-2 text-gray-600">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="font-medium">{badge.name}</span>
                <span className="text-sm">{badge.rating}</span>
              </div>
            ))}
          </div>

          {/* Company Logos */}
          <div className="text-center mb-16">
            <p className="text-xl text-gray-600 mb-8 font-medium">Trusted by growing businesses worldwide</p>
            <div className="flex justify-center items-center">
              <div className="flex items-center justify-center gap-12 opacity-80 hover:opacity-100 transition-opacity duration-300">
              {[
                {
                  name: "Microsoft",
                  logo: (
                    <svg className="w-14 h-14" viewBox="0 0 23 23" fill="none">
                      <path d="M0 0h11v11H0V0z" fill="#f25022"/>
                      <path d="M12 0h11v11H12V0z" fill="#7fba00"/>
                      <path d="M0 12h11v11H0V12z" fill="#00a4ef"/>
                      <path d="M12 12h11v11H12V12z" fill="#ffb900"/>
                    </svg>
                  )
                },
                {
                  name: "WooCommerce",
                  logo: (
                    <svg className="w-14 h-14" viewBox="0 0 24 24" fill="#96588A">
                      <path d="M23.09 9.46c-.47-1.4-1.15-2.65-2.04-3.74-.89-1.09-1.97-1.95-3.24-2.58C16.54 2.51 15.09 2.17 13.6 2.17c-1.49 0-2.94.34-4.21.97-1.27.63-2.35 1.49-3.24 2.58-.89 1.09-1.57 2.34-2.04 3.74-.47 1.4-.71 2.87-.71 4.41 0 1.54.24 3.01.71 4.41.47 1.4 1.15 2.65 2.04 3.74.89 1.09 1.97 1.95 3.24 2.58 1.27.63 2.72.97 4.21.97 1.49 0 2.94-.34 4.21-.97 1.27-.63 2.35-1.49 3.24-2.58.89-1.09 1.57-2.34 2.04-3.74.47-1.4.71-2.87.71-4.41 0-1.54-.24-3.01-.71-4.41zM12 20.5c-4.69 0-8.5-3.81-8.5-8.5S7.31 3.5 12 3.5s8.5 3.81 8.5 8.5-3.81 8.5-8.5 8.5zm3.5-13h-7c-.28 0-.5.22-.5.5v7c0 .28.22.5.5.5h7c.28 0 .5-.22.5-.5V8c0-.28-.22-.5-.5-.5z"/>
                    </svg>
                  )
                },
                {
                  name: "Slack",
                  logo: (
                    <svg className="w-14 h-14" viewBox="0 0 24 24" fill="none">
                      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#E01E5A"/>
                      <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.527 2.527 0 0 1 2.521 2.521 2.527 2.527 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="#36C5F0"/>
                      <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.522 2.521 2.528 2.528 0 0 1-2.521-2.521V2.522A2.528 2.528 0 0 1 15.166 0a2.528 2.528 0 0 1 2.522 2.522v6.312z" fill="#2EB67D"/>
                      <path d="M15.166 18.956a2.528 2.528 0 0 1 2.522 2.522A2.528 2.528 0 0 1 15.166 24a2.528 2.528 0 0 1-2.521-2.522v-2.522h2.521zM15.166 17.688a2.528 2.528 0 0 1-2.521-2.523 2.528 2.528 0 0 1 2.521-2.521h6.312A2.528 2.528 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.312z" fill="#ECB22E"/>
                    </svg>
                  )
                },
                {
                  name: "Airbnb",
                  logo: (
                    <svg className="w-14 h-14" viewBox="0 0 24 24" fill="#FF5A5F">
                      <path d="M12 0.3c-0.9 0-1.6 0.7-1.6 1.6 0 0.9 0.7 1.6 1.6 1.6s1.6-0.7 1.6-1.6c0-0.9-0.7-1.6-1.6-1.6zM12 5.8c-2.1 0-3.8 1.7-3.8 3.8 0 2.1 1.7 3.8 3.8 3.8s3.8-1.7 3.8-3.8c0-2.1-1.7-3.8-3.8-3.8zM12 11.1c-0.8 0-1.5-0.7-1.5-1.5s0.7-1.5 1.5-1.5 1.5 0.7 1.5 1.5-0.7 1.5-1.5 1.5zM12 15.4c-3.2 0-5.8 2.6-5.8 5.8 0 0.5 0.4 0.9 0.9 0.9h9.8c0.5 0 0.9-0.4 0.9-0.9 0-3.2-2.6-5.8-5.8-5.8z"/>
                    </svg>
                  )
                },
                {
                  name: "Spotify",
                  logo: (
                    <svg className="w-14 h-14" viewBox="0 0 24 24" fill="#1DB954">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                  )
                },
              ].map((company, index) => (
                <div key={index} className="group text-center cursor-pointer transition-all duration-300 hover:scale-110">
                  <div className="flex flex-col items-center">
                    {company.logo}
                    <div className="text-base font-semibold text-gray-700 group-hover:text-gray-900 transition-colors duration-300 mt-3">
                      {company.name}
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features Section */}
      <section id="features" className="py-4 lg:py-6 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-r from-pink-400 to-orange-400 rounded-full blur-3xl"></div>
        </div>

        <div className="container-responsive relative z-10">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <span className="text-6xl animate-bounce">👋</span>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
              </div>
              <div className="ml-6">
                <h2 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                  Create social media content. Effortlessly.
                </h2>
                <div className="h-1.5 w-40 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full mt-3 mx-auto animate-pulse"></div>
              </div>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Everything you need to create, manage, and grow your social media presence
              from one <span className="font-semibold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">intuitive dashboard</span>.
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {[
              {
                icon: Wand2,
                title: "AI Content Creation",
                description: "Transform your ideas into engaging social media posts with our AI-powered writing tools and content suggestions.",
                gradient: "from-purple-500 to-pink-500",
                bgGradient: "from-purple-50 to-pink-50",
                iconBg: "bg-gradient-to-r from-purple-100 to-pink-100",
                hoverShadow: "hover:shadow-purple-200/50",
                logo: (
                  <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.516 6.516 0 0 1 9.5 16 6.5 6.5 0 0 1 3 9.5 6.5 6.5 0 0 1 9.5 3m0 2C7.01 5 5 7.01 5 9.5S7.01 14 9.5 14 14 11.99 14 9.5 11.99 5 9.5 5z"/>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 6L12 10.5 8.5 8 12 5.5 15.5 8z"/>
                  </svg>
                )
              },
              {
                icon: Zap,
                title: "Smart Automation",
                description: "Automate your posting schedule and content distribution across multiple social platforms.",
                gradient: "from-yellow-500 to-orange-500",
                bgGradient: "from-yellow-50 to-orange-50",
                iconBg: "bg-gradient-to-r from-yellow-100 to-orange-100",
                hoverShadow: "hover:shadow-orange-200/50",
                logo: (
                  <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                )
              },
              {
                icon: Calendar,
                title: "Strategic Scheduling",
                description: "Plan your content calendar weeks ahead. Schedule posts for optimal engagement times across time zones.",
                gradient: "from-green-500 to-teal-500",
                bgGradient: "from-green-50 to-teal-50",
                iconBg: "bg-gradient-to-r from-green-100 to-teal-100",
                hoverShadow: "hover:shadow-green-200/50",
                logo: (
                  <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                    <circle cx="12" cy="12" r="1"/>
                  </svg>
                )
              },
              {
                icon: BarChart,
                title: "Growth Analytics",
                description: "Monitor your social media growth with comprehensive analytics and performance insights that matter.",
                gradient: "from-blue-500 to-indigo-500",
                bgGradient: "from-blue-50 to-indigo-50",
                iconBg: "bg-gradient-to-r from-blue-100 to-indigo-100",
                hoverShadow: "hover:shadow-blue-200/50",
                logo: (
                  <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 13h8V3H9v6H3v4zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                    <path d="M5 7h2v2H5V7zm0 4h2v2H5v-2zm0 4h2v2H5v-2zm10-8h2v2h-2V7zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z"/>
                  </svg>
                )
              }
            ].map((feature, index) => (
              <div key={index} className={`group relative p-8 rounded-3xl bg-gradient-to-br ${feature.bgGradient} border border-white/60 shadow-lg ${feature.hoverShadow} hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 cursor-pointer backdrop-blur-sm`}>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Animated border */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm`}></div>

                <div className="relative z-10 text-center">
                  <div className={`w-20 h-20 ${feature.iconBg} rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg group-hover:shadow-xl relative overflow-hidden`}>
                    <div className="flex items-center justify-center w-full h-full">
                      {feature.logo}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-gray-800 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                    {feature.description}
                  </p>

                  {/* Bottom accent line */}
                  <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-gradient-to-r ${feature.gradient} rounded-full group-hover:w-20 transition-all duration-500`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Writing Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="container-responsive relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <Wand2 className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-pink-900 bg-clip-text text-transparent">
                  Write your content using AI.
                </h2>
              </div>
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                Our AI assistant helps you generate compelling marketing text for social media posts and blogs in multiple languages and tones.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-4 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-gray-800 font-medium">Multiple content tones and styles</span>
                </div>
                <div className="flex items-center space-x-4 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-gray-800 font-medium">Platform-specific optimization</span>
                </div>
                <div className="flex items-center space-x-4 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-gray-800 font-medium">Hashtag and caption generation</span>
                </div>
              </div>
              <Button
                className="btn-primary text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => openAuth('signup')}
              >
                Try AI Writing
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
            <div className="relative">
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce delay-500 opacity-80"></div>
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-gradient-to-r from-pink-400 to-red-500 rounded-full animate-bounce delay-1000 opacity-80"></div>

              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 backdrop-blur-sm relative overflow-hidden">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-2xl"></div>

                <div className="relative z-10">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Wand2 className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-gray-900 text-lg">AI Content Generator</span>
                    <div className="ml-auto">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-5 border border-blue-100 shadow-sm">
                      <div className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                        <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
                        Generated Post:
                      </div>
                      <div className="text-gray-900 font-medium leading-relaxed">
                        "🚀 Exciting news! We're launching our new product line next week.
                        Stay tuned for something amazing! #Innovation #ProductLaunch #Excited"
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200">Professional</Badge>
                      <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-200">Engaging</Badge>
                      <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200">Twitter Optimized</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Integrations */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-24 h-24 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-32 h-32 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-2xl animate-pulse delay-1000"></div>
        </div>

        <div className="container-responsive relative z-10">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mr-4">
                <span className="text-3xl">🔗</span>
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                Connect to 5 major platforms
              </h2>
            </div>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
              Publish your content across the most important social media platforms with one click.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: Facebook,
                name: "Facebook",
                color: "text-blue-600",
                bgColor: "from-blue-50 to-blue-100",
                hoverColor: "hover:from-blue-100 hover:to-blue-200",
                shadowColor: "hover:shadow-blue-200/50"
              },
              {
                icon: Instagram,
                name: "Instagram",
                color: "text-pink-500",
                bgColor: "from-pink-50 to-purple-100",
                hoverColor: "hover:from-pink-100 hover:to-purple-200",
                shadowColor: "hover:shadow-pink-200/50"
              },
              {
                icon: Twitter,
                name: "Twitter",
                color: "text-sky-500",
                bgColor: "from-sky-50 to-blue-100",
                hoverColor: "hover:from-sky-100 hover:to-blue-200",
                shadowColor: "hover:shadow-sky-200/50"
              },
              {
                icon: Linkedin,
                name: "LinkedIn",
                color: "text-blue-700",
                bgColor: "from-blue-50 to-indigo-100",
                hoverColor: "hover:from-blue-100 hover:to-indigo-200",
                shadowColor: "hover:shadow-blue-200/50"
              },
              {
                icon: FaReddit,
                name: "Reddit",
                color: "text-orange-600",
                bgColor: "from-orange-50 to-red-100",
                hoverColor: "hover:from-orange-100 hover:to-red-200",
                shadowColor: "hover:shadow-orange-200/50"
              },
            ].map((platform, index) => (
              <div key={index} className={`group relative p-8 text-center bg-gradient-to-br ${platform.bgColor} ${platform.hoverColor} rounded-2xl border border-white/60 shadow-lg ${platform.shadowColor} hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer backdrop-blur-sm`}>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative z-10">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg group-hover:shadow-xl border border-gray-100">
                    <platform.icon className={`w-8 h-8 ${platform.color} group-hover:scale-110 transition-transform duration-300`} />
                  </div>
                  <h4 className="font-bold text-gray-900 text-base group-hover:text-gray-800 transition-colors duration-300">{platform.name}</h4>

                  {/* Connection indicator */}
                  <div className="absolute top-3 right-3 w-3 h-3 bg-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Connection status */}
          <div className="text-center mt-12">
            <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 border border-gray-200 shadow-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">All platforms ready to connect</span>
            </div>
          </div>
        </div>
      </section>

      {/* Social Media Evolution Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="container-responsive relative z-10">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg mr-4 animate-pulse">
                <span className="text-3xl">🚀</span>
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-blue-900 bg-clip-text text-transparent">
                Social media has evolved. Have you?
              </h2>
            </div>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Modern content creation requires modern tools. Discover AI-powered generation, smart scheduling, and automated workflows.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              {/* Floating elements */}
              <div className="absolute -top-6 -right-6 w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce delay-300 opacity-80"></div>
              <div className="absolute -bottom-6 -left-6 w-8 h-8 bg-gradient-to-r from-pink-400 to-red-500 rounded-full animate-bounce delay-700 opacity-80"></div>

              <div className="bg-gradient-to-br from-white via-blue-50/50 to-purple-50/50 rounded-3xl p-8 shadow-2xl border border-white/60 backdrop-blur-sm">
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 group hover:shadow-xl transition-all duration-300">
                    <div className="w-full h-28 bg-gradient-to-r from-pink-300 to-purple-400 rounded-xl mb-4 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                      <Wand2 className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-sm font-bold text-gray-900">AI Content Creation</div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 group hover:shadow-xl transition-all duration-300">
                    <div className="w-full h-28 bg-gradient-to-r from-blue-300 to-indigo-400 rounded-xl mb-4 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                      <Calendar className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-sm font-bold text-gray-900">Smart Scheduling</div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 group hover:shadow-xl transition-all duration-300">
                    <div className="w-full h-28 bg-gradient-to-r from-green-300 to-teal-400 rounded-xl mb-4 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                      <BarChart className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-sm font-bold text-gray-900">Analytics Dashboard</div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 group hover:shadow-xl transition-all duration-300">
                    <div className="w-full h-28 bg-gradient-to-r from-orange-300 to-red-400 rounded-xl mb-4 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                      <Zap className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-sm font-bold text-gray-900">Auto Publishing</div>
                  </div>
                </div>
                <div className="text-center">
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 text-sm font-semibold shadow-lg">
                    All-in-One Platform
                  </Badge>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-purple-900 bg-clip-text text-transparent mb-6">
                Everything you need in one place
              </h3>
              <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                From AI-powered content creation to advanced analytics, ScribeSchedule provides all the tools you need to succeed on social media.
              </p>
              <div className="space-y-6">
                <div className="flex items-center space-x-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Wand2 className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-gray-800 font-medium">AI-powered content generation</span>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-gray-800 font-medium">Intelligent scheduling optimization</span>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                    <BarChart className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-gray-800 font-medium">Real-time performance analytics</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container-responsive">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              <span className="text-4xl">🎉</span> Results, Fast.
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the power of intelligent social media management. Here's what makes us different.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: Image,
                title: "Visual Content",
                description: "AI-generated images and manual upload options for your posts.",
                color: "text-blue-600",
                bgColor: "bg-blue-50"
              },
              {
                icon: Type,
                title: "AI Copywriting",
                description: "Engaging captions and copy generated by advanced AI.",
                color: "text-purple-600",
                bgColor: "bg-purple-50"
              },
              {
                icon: Calendar,
                title: "Smart Scheduling",
                description: "Optimal timing across all platforms and time zones.",
                color: "text-green-600",
                bgColor: "bg-green-50"
              },
              {
                icon: BarChart3,
                title: "Performance Analytics",
                description: "Real-time insights and actionable recommendations.",
                color: "text-orange-600",
                bgColor: "bg-orange-50"
              },
              {
                icon: Globe,
                title: "Multi-Platform",
                description: "Publish everywhere with platform-specific optimization.",
                color: "text-indigo-600",
                bgColor: "bg-indigo-50"
              },
              {
                icon: Zap,
                title: "Auto Publishing",
                description: "Automated posting to all your connected social accounts.",
                color: "text-yellow-600",
                bgColor: "bg-yellow-50"
              }
            ].map((feature, index) => (
              <div key={index} className="text-center group hover:scale-105 transition-transform duration-300">
                <div className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-lg transition-shadow duration-300`}>
                  <feature.icon className={`w-8 h-8 ${feature.color} group-hover:scale-110 transition-transform duration-300`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-gray-800 transition-colors duration-300">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed group-hover:text-gray-700 transition-colors duration-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Caption Generation */}
      <section className="py-16 lg:py-24">
        <div className="container-responsive">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold text-lg">AI Caption Generator</span>
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-2">Input:</div>
                    <div className="text-gray-900">"New product launch announcement"</div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-2">Generated Caption:</div>
                    <div className="text-gray-900 mb-3">
                      "🚀 Big news is coming! We can't wait to share what we've been working on.
                      Get ready for something that will change the game! #Innovation #ComingSoon #Excited"
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">#Innovation</Badge>
                      <Badge variant="secondary">#ProductLaunch</Badge>
                      <Badge variant="secondary">#Startup</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Captions, hashtags? AI-generated.
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Create compelling captions, generate relevant hashtags, and write engaging copy. All powered by your simple description.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">AI copywriter for all platforms</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">Inspirational quotes and content</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">Smart hashtag suggestions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 lg:py-24 bg-gray-50">
        <div className="container-responsive">
          <div className="text-center mb-16">
            <h2 className="text-responsive-lg font-bold text-gray-900 mb-4">Choose your plan</h2>
            <p className="text-lg text-gray-600 mb-8">Simple, transparent pricing for creators and businesses</p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center space-x-4 mb-8">
              <Label
                className={`text-sm font-medium cursor-pointer transition-colors ${!isYearly ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}
                onClick={() => handleYearlyToggle(false)}
              >
                Monthly
              </Label>

              {/* Custom Toggle */}
              <div
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors cursor-pointer"
                style={{
                  backgroundColor: isYearly ? '#667eea' : '#e5e7eb'
                }}
                onClick={handleToggleClick}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isYearly ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </div>

              <Label
                className={`text-sm font-medium cursor-pointer transition-colors ${isYearly ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}
                onClick={() => handleYearlyToggle(true)}
              >
                Yearly
              </Label>
              <Badge className="bg-green-100 text-green-800 border-green-200 ml-2">
                Save 20%
              </Badge>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                name: "Starter",
                monthlyPrice: 15,
                yearlyPrice: 12,
                description: "Perfect for solo creators",
                features: ["3 social accounts", "50 posts per month", "Basic scheduling", "AI content generation"]
              },
              {
                name: "Professional",
                monthlyPrice: 39,
                yearlyPrice: 31,
                description: "For growing creators",
                features: ["5 social platforms", "200 posts per month", "AI content assistance", "Analytics dashboard"],
                popular: true
              },
              {
                name: "Business",
                monthlyPrice: 79,
                yearlyPrice: 63,
                description: "For teams and agencies",
                features: ["5 social platforms", "Unlimited posts", "Team collaboration", "Priority support"]
              }
            ].map((plan, index) => (
              <div key={index} className={`card-modern p-8 text-center relative ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white px-4 py-1">Most Popular</Badge>
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <div className="text-4xl font-bold text-gray-900 mb-6">
                  ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  <span className="text-lg text-gray-500 font-normal">/{isYearly ? 'year' : 'month'}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center justify-center space-x-2">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full btn-primary"
                  onClick={() => openAuth('signup')}
                >
                  Get started
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scheduling Section */}
      <section className="py-16 lg:py-24">
        <div className="container-responsive">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Schedule across platforms. For your team too.
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Collaborate with team members or clients to plan and review campaigns together. Perfect for agencies and growing businesses.
              </p>
              <div className="mb-8">
                <h4 className="font-semibold text-gray-900 mb-4">Supported Platforms:</h4>
                <div className="flex flex-wrap gap-3">
                  {[
                    { icon: Facebook, color: "text-blue-600" },
                    { icon: Instagram, color: "text-pink-500" },
                    { icon: Twitter, color: "text-sky-500" },
                    { icon: Linkedin, color: "text-blue-700" },
                    { icon: FaReddit, color: "text-orange-600" },
                  ].map((platform, index) => (
                    <div key={index} className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <platform.icon className={`w-5 h-5 ${platform.color}`} />
                    </div>
                  ))}
                </div>
              </div>
              <Button
                className="btn-primary"
                onClick={() => openAuth('signup')}
              >
                Start Scheduling
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            <div className="relative max-w-lg mx-auto">
              {/* Floating elements */}
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-bounce delay-300 opacity-80"></div>
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-gradient-to-r from-green-400 to-teal-500 rounded-full animate-bounce delay-700 opacity-80"></div>

              <div className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 rounded-2xl shadow-xl border border-white/60 p-8 backdrop-blur-sm relative overflow-hidden max-w-lg mx-auto">
                {/* Background gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-purple-50/20 rounded-2xl"></div>

                <div className="relative z-10">
                  {/* Calendar header */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold text-gray-900">December 2024</h3>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-gray-600 font-medium">Live</span>
                    </div>
                  </div>

                  {/* Calendar grid - larger */}
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                      <div key={day} className="text-sm font-bold text-gray-600 text-center py-3 bg-gray-50 rounded">
                        {day}
                      </div>
                    ))}
                    {[...Array(35)].map((_, i) => {
                      const dayNumber = i + 1 <= 31 ? i + 1 : '';
                      const isToday = i === 15;
                      const hasEvent = i === 22;
                      const isWeekend = i % 7 === 0 || i % 7 === 6;

                      return (
                        <div key={i} className={`aspect-square flex items-center justify-center text-sm rounded-lg font-medium transition-all duration-300 cursor-pointer relative ${
                          isToday
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md' :
                          hasEvent
                            ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-300' :
                          isWeekend
                            ? 'text-gray-400 hover:bg-gray-50'
                            : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                        }`}>
                          {dayNumber}
                          {hasEvent && (
                            <div className="absolute bottom-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Scheduled posts - compact */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-900 flex items-center">
                      <Calendar className="w-3 h-3 mr-1 text-blue-500" />
                      Upcoming Posts
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 p-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Instagram className="w-3 h-3 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-gray-900 truncate">Product Launch</div>
                          <div className="text-xs text-gray-600 flex items-center">
                            <Clock className="w-2 h-2 mr-1" />
                            3:30 PM
                          </div>
                        </div>
                        <Badge className="bg-green-500 text-white text-xs px-2 py-0.5">
                          Ready
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Awards and Recognition */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container-responsive">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="grid grid-cols-2 gap-4">
              {[
                { title: "Best Social Media Tool", year: "2024", category: "Startup Awards" },
                { title: "Top Performer", year: "2024", category: "G2 Reviews" },
                { title: "Rising Star", year: "2024", category: "Product Hunt" },
                { title: "User's Choice", year: "2024", category: "Capterra" },
              ].map((award, index) => (
                <div key={index} className="bg-white rounded-xl p-6 text-center shadow-sm">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-sm font-bold text-gray-900">{award.title}</div>
                  <div className="text-xs text-gray-500">{award.category}</div>
                  <div className="text-xs text-gray-400">{award.year}</div>
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">Sarah Johnson</div>
                  <div className="text-sm text-gray-600">Marketing Director, TechStart</div>
                </div>
              </div>
              <blockquote className="text-lg text-gray-700 mb-6">
                "ScribeSchedule transformed our social media workflow. The AI content generation saves us hours every week, and the scheduling features are incredibly intuitive."
              </blockquote>
              <div className="flex space-x-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 lg:py-24">
        <div className="container-responsive">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Join thousands of creators worldwide
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Start creating better social media content today. No credit card required.
            </p>
            <Button size="lg" className="btn-primary text-lg px-12 py-4" onClick={() => openAuth('signup')}>
              Start creating now
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-gray-900 text-white">
        <div className="container-responsive">
          <div className="grid md:grid-cols-5 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">ScribeSchedule</span>
              </div>
              <p className="text-gray-400 mb-6">
                Streamline your social media workflow with intelligent content creation, scheduling, and analytics tools designed for modern creators.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">AI Content Creation</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Smart Scheduling</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Analytics Dashboard</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Multi-Platform Posting</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Platforms</h4>
              <ul className="space-y-2 text-gray-400">
                <li><span className="text-gray-400">Facebook</span></li>
                <li><span className="text-gray-400">Instagram</span></li>
                <li><span className="text-gray-400">Twitter</span></li>
                <li><span className="text-gray-400">LinkedIn</span></li>
                <li><span className="text-gray-400">Reddit</span></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">© 2024 ScribeSchedule. All rights reserved. Terms of Service and Privacy Policy apply.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
      />
    </div>
  );
};

export default LandingPage;
