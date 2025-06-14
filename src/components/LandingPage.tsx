import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Clock, Users, TrendingUp, Sparkles, Target, BarChart3, Rocket, Play, Facebook, Twitter, Instagram, Linkedin, ArrowUpRight, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import AuthModal from "./AuthModal";
import TrustedBy from "./TrustedBy";

const LandingPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  // Handle scroll effect for navigation
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 10;
      setIsScrolled(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Material Design Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
      </div>

      {/* Material Design App Bar */}
      <nav className={`sticky-nav transition-all duration-300 border-b ${
        isScrolled
          ? 'bg-white/95 shadow-lg border-gray-200/50'
          : 'bg-white/80 shadow-md border-gray-200/30'
      }`}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-gray-900 tracking-tight">
                ContentPilot AI
              </span>
              <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs font-medium px-2 py-1 rounded-full">
                Beta
              </Badge>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <nav className="flex items-center space-x-6">
              <a href="#features" className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">Pricing</a>
              <a href="#testimonials" className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">Reviews</a>
            </nav>
            {user ? (
              <Button
                asChild
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-lg px-6"
              >
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  onClick={() => openAuth('signin')}
                  className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg px-4"
                >
                  Sign In
                </Button>
                <Button
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-lg px-6"
                  onClick={() => openAuth('signup')}
                >
                  Start Free Trial
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-200/50 shadow-lg">
            <div className="px-4 py-4 space-y-4">
              <a
                href="#features"
                className="block text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#pricing"
                className="block text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </a>
              <a
                href="#testimonials"
                className="block text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Reviews
              </a>
              <div className="pt-4 border-t border-gray-200 space-y-3">
                {user ? (
                  <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                    <Link to="/dashboard">Dashboard</Link>
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        openAuth('signin');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full"
                    >
                      Sign In
                    </Button>
                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      onClick={() => {
                        openAuth('signup');
                        setMobileMenuOpen(false);
                      }}
                    >
                      Start Free Trial
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Enhanced Hero Section */}
      <section className="relative py-16 md:py-24 px-4 overflow-hidden min-h-screen flex items-center">
        {/* Enhanced Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-400/15 rounded-full blur-2xl animate-pulse delay-500 transform -translate-x-1/2 -translate-y-1/2"></div>

          {/* Floating Elements */}
          <div className="absolute top-32 right-1/4 w-4 h-4 bg-blue-500 rounded-full animate-bounce delay-300"></div>
          <div className="absolute bottom-32 left-1/4 w-3 h-3 bg-purple-500 rounded-full animate-bounce delay-700"></div>
          <div className="absolute top-1/3 left-1/6 w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-1000"></div>
        </div>

        <div className="container mx-auto text-center max-w-7xl relative z-10 w-full">
          {/* Enhanced Header with Badges */}
          <div className="mb-12">
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <Badge className="bg-green-100 text-green-800 border-green-200 px-4 py-2 text-sm font-medium animate-pulse">
                <Star className="w-4 h-4 mr-2 fill-current" />
                #1 AI Content Creator
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-4 py-2 text-sm font-medium">
                <Users className="w-4 h-4 mr-2" />
                10,000+ Happy Users
              </Badge>
              <Badge className="bg-purple-100 text-purple-800 border-purple-200 px-4 py-2 text-sm font-medium">
                <Zap className="w-4 h-4 mr-2" />
                5x Faster Creation
              </Badge>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
              Create <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">brilliant</span> content with AI
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed font-light px-4">
              Transform your ideas into engaging social media content in seconds.
              Powered by advanced AI that understands your brand voice.
            </p>

            {/* Value Propositions */}
            <div className="flex flex-wrap justify-center items-center gap-6 mb-8 text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium">Free 7-day trial</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium">Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Enhanced Platform Support */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Works with all your favorite platforms</h3>
              <p className="text-gray-600">One-click publishing to multiple social networks</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                { icon: Linkedin, name: "LinkedIn", color: "text-blue-600", bgColor: "bg-blue-50", users: "900M+" },
                { icon: Twitter, name: "Twitter", color: "text-sky-500", bgColor: "bg-sky-50", users: "450M+" },
                { icon: Instagram, name: "Instagram", color: "text-pink-500", bgColor: "bg-pink-50", users: "2B+" },
                { icon: Facebook, name: "Facebook", color: "text-blue-700", bgColor: "bg-blue-50", users: "3B+" },
              ].map((platform, index) => (
                <div
                  key={index}
                  className={`group relative ${platform.bgColor} rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer border border-gray-100`}
                >
                  <div className="text-center">
                    <div className={`w-12 h-12 ${platform.bgColor} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300`}>
                      <platform.icon className={`w-7 h-7 ${platform.color}`} />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">{platform.name}</h4>
                    <p className="text-xs text-gray-500">{platform.users} users</p>
                  </div>

                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                </div>
              ))}
            </div>

            {/* Additional Features */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500 mb-4">Plus many more platforms coming soon...</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Badge variant="outline" className="text-gray-600 border-gray-300">
                  TikTok (Coming Soon)
                </Badge>
                <Badge variant="outline" className="text-gray-600 border-gray-300">
                  YouTube Shorts
                </Badge>
                <Badge variant="outline" className="text-gray-600 border-gray-300">
                  Pinterest
                </Badge>
              </div>
            </div>
          </div>

          {/* Enhanced CTA Section */}
          <div className="mb-20">
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
              {user ? (
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-12 py-5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden group"
                >
                  <Link to="/create" className="flex items-center">
                    <Zap className="w-5 h-5 mr-2" />
                    Create Your First Post
                    <ArrowUpRight className="w-5 h-5 ml-2" />
                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-pulse"></div>
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-12 py-5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto relative overflow-hidden group"
                    onClick={() => openAuth('signup')}
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Start Creating for Free
                    <ArrowUpRight className="w-5 h-5 ml-2" />
                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-pulse"></div>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 text-lg px-12 py-5 rounded-full transition-all duration-200 w-full sm:w-auto group"
                    onClick={() => openAuth('signin')}
                  >
                    <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
                    Watch Demo
                  </Button>
                </>
              )}
            </div>

            {/* Social Proof */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full border-2 border-white"></div>
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full border-2 border-white"></div>
                  <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-600 rounded-full border-2 border-white"></div>
                  <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full border-2 border-white"></div>
                </div>
                <span className="font-medium">Join 10,000+ creators</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="font-medium">4.9/5 rating</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium">1,247 posts created today</span>
              </div>
            </div>
          </div>

          {/* Enhanced Interactive Demo */}
          <div className="relative max-w-6xl mx-auto">
            {/* Demo Header */}
            <div className="text-center mb-8">
              <Badge className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border-blue-200 px-4 py-2 mb-4">
                <Sparkles className="w-4 h-4 mr-2" />
                Live AI Demo
              </Badge>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">See the magic happen in real-time</h3>
              <p className="text-gray-600">Watch AI create professional content in seconds</p>
            </div>

            <Card className="bg-white shadow-2xl rounded-3xl border-0 transform transition-all duration-500 hover:scale-[1.02] hover:shadow-3xl relative">
              {/* Floating Stats - positioned inside the card */}
              <div className="absolute top-4 right-4 z-20">
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-xl animate-bounce border-2 border-green-300">
                  ⚡ Generated in 2.3s
                </div>
              </div>
              <div className="absolute top-4 left-4 z-20">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium shadow-xl border-2 border-blue-300">
                  🎯 98% Accuracy
                </div>
              </div>

              <CardContent className="p-0">
                <div className="aspect-[16/9] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center relative overflow-hidden">
                  {/* Enhanced Background Pattern */}
                  <div className="absolute inset-0">
                    <div className="absolute top-4 left-4 w-32 h-32 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
                    <div className="absolute bottom-4 right-4 w-24 h-24 bg-purple-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
                    <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-indigo-200 rounded-full opacity-10 animate-pulse delay-500 transform -translate-x-1/2 -translate-y-1/2"></div>

                    {/* Floating Icons */}
                    <div className="absolute top-20 right-20 text-blue-300 animate-bounce delay-300">
                      <Linkedin className="w-6 h-6" />
                    </div>
                    <div className="absolute bottom-20 left-20 text-purple-300 animate-bounce delay-700">
                      <Twitter className="w-6 h-6" />
                    </div>
                    <div className="absolute top-32 left-32 text-pink-300 animate-bounce delay-1000">
                      <Instagram className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-8">
                    {/* Enhanced Interface Mockup */}
                    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xl border border-gray-100 relative">
                      {/* Browser Header */}
                      <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-yellow-400"></div>
                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-green-400"></div>
                        <div className="flex-1 bg-gray-100 rounded-full h-6 sm:h-8 flex items-center px-3 sm:px-4">
                          <span className="text-xs text-gray-500">contentpilot.ai/create</span>
                        </div>
                        <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        </div>
                      </div>

                      {/* Demo Content */}
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Input Side */}
                        <div className="text-left space-y-4">
                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <div className="text-xs text-blue-600 font-medium mb-2">✨ Your Input</div>
                            <div className="text-sm text-gray-800">"Write a LinkedIn post about AI in marketing"</div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            <span className="text-xs sm:text-sm text-gray-600 font-medium">AI is generating your content...</span>
                          </div>

                          <div className="h-2 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full animate-pulse"></div>
                        </div>

                        {/* Output Side */}
                        <div className="text-left">
                          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                            <div className="text-xs text-green-600 font-medium mb-2">🎯 AI Generated</div>
                            <div className="text-sm font-medium text-gray-800 leading-relaxed">
                              🚀 Just witnessed AI transform a startup's marketing strategy in real-time.
                              <br /><br />
                              The results? 300% increase in engagement, 150% boost in leads, and a completely revolutionized customer journey.
                              <br /><br />
                              #AIMarketing #Innovation #Growth
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced CTA */}
                    <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full px-8 shadow-lg hover:shadow-xl transition-all duration-300 group"
                      >
                        <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
                        Watch Full Demo
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="border-2 border-blue-200 text-blue-700 hover:bg-blue-50 rounded-full px-8 transition-all duration-200"
                        onClick={() => openAuth('signup')}
                      >
                        <Rocket className="w-5 h-5 mr-2" />
                        Try It Now
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <TrustedBy />

      {/* Interactive Demo Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl animate-pulse delay-500 transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 mb-4 px-4 py-2">
              <Zap className="w-4 h-4 mr-2" />
              Live Demo
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              See the magic in action
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Watch how ContentPilot AI transforms a simple idea into engaging social media content
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Demo Interface */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
              <div className="bg-white rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-4 h-4 rounded-full bg-red-400"></div>
                  <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
                  <div className="w-4 h-4 rounded-full bg-green-400"></div>
                  <div className="flex-1 bg-gray-100 rounded-full h-8 flex items-center px-4">
                    <span className="text-xs text-gray-500">contentpilot.ai/create</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">What do you want to post about?</label>
                    <div className="bg-gray-50 rounded-lg p-3 border-2 border-blue-200">
                      <span className="text-gray-800">Launch of our new AI-powered analytics dashboard</span>
                      <div className="w-2 h-4 bg-blue-500 inline-block ml-1 animate-pulse"></div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Platform:</span>
                      <Badge className="bg-blue-100 text-blue-800">LinkedIn</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Tone:</span>
                      <Badge className="bg-purple-100 text-purple-800">Professional</Badge>
                    </div>
                  </div>

                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate with AI
                  </Button>
                </div>
              </div>
            </div>

            {/* Generated Result */}
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4">Generated in 3 seconds:</h3>
                <div className="bg-white rounded-2xl p-6 shadow-2xl">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">AI</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">ContentPilot AI</div>
                        <div className="text-sm text-gray-500">Just now</div>
                      </div>
                    </div>
                    <div className="text-gray-800 leading-relaxed">
                      🚀 Excited to unveil our latest innovation: an AI-powered analytics dashboard that transforms how you understand your audience!
                      <br /><br />
                      ✨ Key features:<br />
                      • Real-time engagement insights<br />
                      • Predictive content performance<br />
                      • Automated optimization suggestions<br />
                      <br />
                      Ready to revolutionize your content strategy?
                      <br /><br />
                      #AI #Analytics #ContentStrategy #Innovation
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>👍 24 likes</span>
                      <span>💬 8 comments</span>
                      <span>🔄 12 shares</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Button
                  size="lg"
                  className="bg-white text-gray-900 hover:bg-gray-100 rounded-full px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => openAuth('signup')}
                >
                  Try It Yourself - Free
                  <ArrowUpRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Material Design Problem Cards */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Stop struggling with content creation
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We solve the biggest challenges content creators face every day
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Clock,
                title: "Writer's Block",
                desc: "AI generates unlimited ideas instantly",
                color: "from-red-500 to-pink-500",
                bgColor: "bg-red-50"
              },
              {
                icon: Target,
                title: "Inconsistent Posting",
                desc: "Schedule content weeks in advance",
                color: "from-blue-500 to-cyan-500",
                bgColor: "bg-blue-50"
              },
              {
                icon: TrendingUp,
                title: "Low Engagement",
                desc: "AI optimizes for maximum performance",
                color: "from-green-500 to-emerald-500",
                bgColor: "bg-green-50"
              },
              {
                icon: BarChart3,
                title: "Content Planning",
                desc: "One-click generation and scheduling",
                color: "from-purple-500 to-indigo-500",
                bgColor: "bg-purple-50"
              }
            ].map((problem, index) => (
              <Card
                key={index}
                className="group border-0 bg-white shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 rounded-2xl overflow-hidden"
              >
                <CardContent className="p-8 text-center relative">
                  <div className={`w-16 h-16 ${problem.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <problem.icon className="w-8 h-8 text-gray-700" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{problem.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{problem.desc}</p>

                  {/* Material Design Ripple Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Before vs After Section */}
      <section className="py-20 px-4 bg-white relative overflow-hidden">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              The difference is <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">dramatic</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See how ContentPilot AI transforms your content creation process
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Before */}
            <div className="relative">
              <div className="absolute -top-4 left-4">
                <Badge className="bg-red-100 text-red-800 border-red-200 px-4 py-2">
                  ❌ Before ContentPilot AI
                </Badge>
              </div>
              <Card className="bg-red-50 border-red-200 shadow-lg rounded-3xl overflow-hidden">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 text-red-700">
                      <Clock className="w-6 h-6" />
                      <span className="font-semibold text-lg">3-4 hours per post</span>
                    </div>
                    <ul className="space-y-4 text-gray-700">
                      <li className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Staring at blank screen for inspiration</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Writing multiple drafts and revisions</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Manually adapting content for each platform</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Inconsistent posting schedule</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Low engagement and reach</span>
                      </li>
                    </ul>
                    <div className="bg-red-100 rounded-2xl p-4 border border-red-200">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600 mb-1">😰</div>
                        <div className="text-sm text-red-700 font-medium">Stressed & Overwhelmed</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* After */}
            <div className="relative">
              <div className="absolute -top-4 left-4">
                <Badge className="bg-green-100 text-green-800 border-green-200 px-4 py-2">
                  ✅ After ContentPilot AI
                </Badge>
              </div>
              <Card className="bg-green-50 border-green-200 shadow-lg rounded-3xl overflow-hidden">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 text-green-700">
                      <Zap className="w-6 h-6" />
                      <span className="font-semibold text-lg">30 seconds per post</span>
                    </div>
                    <ul className="space-y-4 text-gray-700">
                      <li className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span>AI generates ideas instantly from simple prompts</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Perfect content created in one click</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Auto-optimized for each platform</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Automated scheduling across all channels</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span>3x higher engagement rates</span>
                      </li>
                    </ul>
                    <div className="bg-green-100 rounded-2xl p-4 border border-green-200">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600 mb-1">🚀</div>
                        <div className="text-sm text-green-700 font-medium">Confident & Productive</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="text-center mt-16">
            <Button
              size="lg"
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-xl px-10 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              onClick={() => openAuth('signup')}
            >
              Transform Your Content Today
              <ArrowUpRight className="w-6 h-6 ml-2" />
            </Button>
            <p className="text-gray-500 mt-4">Join 10,000+ creators who made the switch</p>
          </div>
        </div>
      </section>

      {/* Material Design How It Works */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto max-w-6xl text-center relative z-10">
          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How it works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From idea to published post in just 4 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: "✍️",
                title: "Write a prompt",
                desc: "Describe your content idea in plain English",
                step: "01"
              },
              {
                icon: "🤖",
                title: "AI creates content",
                desc: "Advanced AI generates post and image instantly",
                step: "02"
              },
              {
                icon: "📅",
                title: "Schedule or post",
                desc: "Choose when and where to publish",
                step: "03"
              },
              {
                icon: "🚀",
                title: "Track performance",
                desc: "Monitor engagement and optimize",
                step: "04"
              }
            ].map((step, index) => (
              <div key={index} className="relative">
                {/* Connection Line */}
                {index < 3 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-blue-200 to-purple-200 z-0"></div>
                )}

                <Card className="relative z-10 bg-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-2xl border-0">
                  <CardContent className="p-8 text-center">
                    {/* Step Number */}
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                        {step.step}
                      </div>
                    </div>

                    <div className="text-5xl mb-6 mt-4">{step.icon}</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{step.desc}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="mt-16">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => openAuth('signup')}
            >
              Try It Now - It's Free
              <ArrowUpRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Material Design Feature Showcase */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Powerful features, simple interface
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to create, schedule, and optimize your social media content
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Sparkles,
                title: "AI Content Generator",
                desc: "Create professional posts with advanced AI that understands your brand voice",
                color: "from-purple-500 to-indigo-500",
                bgColor: "bg-purple-50",
                features: ["Multiple tone options", "Brand voice learning", "Instant generation"]
              },
              {
                icon: TrendingUp,
                title: "Multi-Platform Publishing",
                desc: "Publish to LinkedIn, Twitter, Instagram, and more with platform-specific optimization",
                color: "from-blue-500 to-cyan-500",
                bgColor: "bg-blue-50",
                features: ["Auto-formatting", "Platform optimization", "Bulk scheduling"]
              },
              {
                icon: BarChart3,
                title: "Smart Analytics",
                desc: "Track performance and get insights to improve your content strategy",
                color: "from-green-500 to-emerald-500",
                bgColor: "bg-green-50",
                features: ["Engagement tracking", "Performance insights", "Growth metrics"]
              }
            ].map((feature, index) => (
              <Card
                key={index}
                className="group bg-white shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 rounded-3xl border-0 overflow-hidden"
              >
                <CardContent className="p-0">
                  {/* Feature Header */}
                  <div className={`${feature.bgColor} p-8 relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full transform translate-x-8 -translate-y-8"></div>
                    <div className="relative z-10">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <feature.icon className="w-8 h-8 text-gray-700" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                    </div>
                  </div>

                  {/* Feature Content */}
                  <div className="p-8">
                    <p className="text-gray-600 mb-6 leading-relaxed">{feature.desc}</p>

                    <ul className="space-y-3 mb-6">
                      {feature.features.map((item, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-600">
                          <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant="outline"
                      className="w-full rounded-full border-2 hover:bg-gray-50 transition-all duration-200"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      View Demo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Material Design Testimonials */}
      <section id="testimonials" className="py-20 px-4 bg-gradient-to-br from-blue-50 to-indigo-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 left-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl transform -translate-x-1/2"></div>
          <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl transform translate-x-1/2"></div>
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Loved by creators worldwide
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of content creators who've transformed their social media strategy
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Chen",
                role: "Marketing Director @ TechCorp",
                text: "ContentPilot AI saved me 10 hours per week. The AI posts perform better than what I wrote myself! Our engagement increased by 300%.",
                avatar: "SC",
                company: "TechCorp",
                rating: 5
              },
              {
                name: "Mike Johnson",
                role: "Solo Creator & Influencer",
                text: "From idea to scheduled post in under 2 minutes. This tool is a game-changer for content creation. I've grown my following by 50K in 3 months.",
                avatar: "MJ",
                company: "Personal Brand",
                rating: 5
              },
              {
                name: "Lisa Rodriguez",
                role: "Agency Owner",
                text: "We've scaled our content output 5x while maintaining quality. Our clients love the results and we've increased our revenue by 200%.",
                avatar: "LR",
                company: "Digital Marketing Pro",
                rating: 5
              }
            ].map((testimonial, index) => (
              <Card
                key={index}
                className="bg-white shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 rounded-3xl border-0 overflow-hidden group"
              >
                <CardContent className="p-8 relative">
                  {/* Quote Icon */}
                  <div className="absolute top-6 right-6 w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center opacity-50">
                    <span className="text-2xl text-blue-600">"</span>
                  </div>

                  {/* Rating */}
                  <div className="flex text-yellow-400 mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-current" />
                    ))}
                  </div>

                  {/* Testimonial Text */}
                  <p className="text-gray-700 mb-6 leading-relaxed text-lg">
                    "{testimonial.text}"
                  </p>

                  {/* User Info */}
                  <div className="flex items-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{testimonial.name}</p>
                      <p className="text-gray-600">{testimonial.role}</p>
                      <p className="text-sm text-blue-600 font-medium">{testimonial.company}</p>
                    </div>
                  </div>

                  {/* Verified Badge */}
                  <div className="absolute bottom-6 right-6">
                    <div className="flex items-center space-x-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                      <Check className="w-3 h-3" />
                      <span>Verified</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Trust Indicators */}
          <div className="text-center mt-16">
            <div className="flex flex-wrap justify-center items-center gap-8 text-gray-500">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span className="font-medium">10,000+ Active Users</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="font-medium">4.9/5 Average Rating</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span className="font-medium">2M+ Posts Generated</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-purple-500 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <Badge className="bg-purple-100 text-purple-800 border-purple-200 mb-4 px-4 py-2">
              <Star className="w-4 h-4 mr-2 fill-current" />
              Special Launch Pricing
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Choose your <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">growth plan</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start free, scale as you grow. No hidden fees, cancel anytime.
            </p>
          </div>

          {/* Plans Grid - Using Settings Component Structure */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-16">
            {/* Starter Plan */}
            <Card className="relative p-8 border-2 border-gray-200 rounded-2xl hover:shadow-xl transition-all duration-300 hover:border-blue-300 group h-full flex flex-col">
              <div className="text-center space-y-6 flex-grow">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gray-900">Starter</h3>
                  <p className="text-gray-500">Perfect for trying out</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline justify-center space-x-1">
                    <span className="text-4xl font-bold text-gray-900">Free</span>
                  </div>
                  <p className="text-sm text-gray-400">Always free</p>
                </div>
                <ul className="space-y-4 text-left flex-grow min-h-[200px]">
                  <li className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">5 posts per month</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">2 social platforms</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Basic AI templates</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Community support</span>
                  </li>
                </ul>
                <div className="mt-auto pt-6">
                  <Button
                    className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    onClick={() => openAuth('signup')}
                  >
                    Get Started Free
                  </Button>
                </div>
              </div>
            </Card>

            {/* Pro Plan - Most Popular */}
            <Card className="relative p-8 border-2 border-purple-300 rounded-2xl hover:shadow-2xl transition-all duration-300 scale-105 bg-gradient-to-br from-purple-50 to-pink-50 h-full flex flex-col">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-yellow-400 to-amber-400 text-yellow-900 px-6 py-2 rounded-full flex items-center space-x-2 shadow-lg font-bold border-2 border-yellow-300">
                  <Star className="h-4 w-4" />
                  <span className="font-semibold">Most Popular</span>
                </Badge>
              </div>
              <div className="text-center space-y-6 pt-4 flex-grow flex flex-col">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Pro</h3>
                  <p className="text-gray-600">For growing creators</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline justify-center space-x-1">
                    <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">$29</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  <p className="text-sm text-gray-400">Billed monthly</p>
                </div>
                <ul className="space-y-4 text-left flex-grow min-h-[200px]">
                  <li className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">Unlimited posts</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">All social platforms</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Advanced AI models</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Analytics & insights</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Priority support</span>
                  </li>
                </ul>
                <div className="mt-auto pt-6">
                  <Button
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    onClick={() => openAuth('signup')}
                  >
                    Start 7-Day Free Trial
                  </Button>
                </div>
              </div>
            </Card>

            {/* Enterprise Plan */}
            <Card className="relative p-8 border-2 border-gray-200 rounded-2xl hover:shadow-xl transition-all duration-300 hover:border-green-300 group h-full flex flex-col">
              <div className="text-center space-y-6 flex-grow">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gray-900">Enterprise</h3>
                  <p className="text-gray-500">For large teams</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline justify-center space-x-1">
                    <span className="text-4xl font-bold text-green-600">Custom</span>
                  </div>
                  <p className="text-sm text-gray-400">Custom pricing available</p>
                </div>
                <ul className="space-y-4 text-left flex-grow min-h-[200px]">
                  <li className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">Everything in Pro</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Team collaboration</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Custom AI training</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Dedicated support</span>
                  </li>
                </ul>
                <div className="mt-auto pt-6">
                  <Button
                    variant="outline"
                    className="w-full h-12 border-2 border-green-600 text-green-600 hover:bg-green-50 hover:border-green-700 font-semibold rounded-xl transition-all duration-200"
                  >
                    Contact Sales
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Money Back Guarantee */}
          <div className="text-center mt-16">
            <div className="bg-white rounded-3xl p-8 shadow-lg max-w-2xl mx-auto">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-gray-900">30-Day Money-Back Guarantee</div>
                  <div className="text-gray-600">Not satisfied? Get a full refund, no questions asked.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Material Design Use Cases & Results Combined */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          {/* Use Cases */}
          <div className="mb-20">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Perfect for every creator
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Whether you're just starting or scaling up, ContentPilot AI adapts to your needs
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: Users,
                  title: "Solo Creators",
                  desc: "Build your personal brand with consistent, high-quality content",
                  color: "from-blue-500 to-cyan-500",
                  bgColor: "bg-blue-50"
                },
                {
                  icon: Rocket,
                  title: "Startup Teams",
                  desc: "Move fast and grow your audience with limited marketing resources",
                  color: "from-purple-500 to-indigo-500",
                  bgColor: "bg-purple-50"
                },
                {
                  icon: BarChart3,
                  title: "Marketing Agencies",
                  desc: "Scale your client deliverables and increase your profit margins",
                  color: "from-green-500 to-emerald-500",
                  bgColor: "bg-green-50"
                },
                {
                  icon: TrendingUp,
                  title: "Product Launches",
                  desc: "Generate buzz and drive awareness for your new products",
                  color: "from-orange-500 to-red-500",
                  bgColor: "bg-orange-50"
                }
              ].map((useCase, index) => (
                <Card
                  key={index}
                  className="group bg-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-2xl border-0 text-center overflow-hidden"
                >
                  <CardContent className="p-8">
                    <div className={`w-16 h-16 ${useCase.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <useCase.icon className="w-8 h-8 text-gray-700" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{useCase.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{useCase.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Results Section */}
          <div className="text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Real results that matter
            </h2>
            <p className="text-xl text-gray-600 mb-16 max-w-2xl mx-auto">
              See the impact ContentPilot AI has made for creators like you
            </p>

            <div className="grid md:grid-cols-3 gap-12">
              {[
                {
                  metric: "+1.2K",
                  label: "Average followers gained per month",
                  icon: Users,
                  color: "text-blue-600",
                  bgColor: "bg-blue-50"
                },
                {
                  metric: "80%",
                  label: "Faster content creation process",
                  icon: Clock,
                  color: "text-green-600",
                  bgColor: "bg-green-50"
                },
                {
                  metric: "2.5x",
                  label: "Higher engagement rates",
                  icon: TrendingUp,
                  color: "text-purple-600",
                  bgColor: "bg-purple-50"
                }
              ].map((result, index) => (
                <div key={index} className="group">
                  <div className={`w-20 h-20 ${result.bgColor} rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <result.icon className={`w-10 h-10 ${result.color}`} />
                  </div>
                  <div className={`text-5xl md:text-6xl font-bold ${result.color} mb-3`}>
                    {result.metric}
                  </div>
                  <p className="text-gray-600 text-lg font-medium max-w-xs mx-auto">
                    {result.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Limited Time Offer Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/20"></div>
        {/* Enhanced Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-200/20 rounded-full blur-2xl transform -translate-x-1/2 -translate-y-1/2 animate-pulse delay-500"></div>
        </div>

        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white mb-6 px-6 py-3 text-lg font-bold animate-pulse shadow-lg">
            🔥 Limited Time: 50% OFF First Month
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Don't miss out on this exclusive launch offer
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join the first 1,000 users and get 50% off your first month + exclusive bonuses worth $500
          </p>

          {/* Countdown Timer */}
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 mb-8 border border-gray-200 shadow-2xl">
            <div className="text-gray-700 mb-4">
              <div className="text-lg font-medium mb-2">Offer expires in:</div>
              <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 backdrop-blur-sm rounded-2xl p-4 border border-blue-200 shadow-lg">
                  <div className="text-3xl font-bold text-blue-700">23</div>
                  <div className="text-sm text-blue-600">Days</div>
                </div>
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 backdrop-blur-sm rounded-2xl p-4 border border-blue-200 shadow-lg">
                  <div className="text-3xl font-bold text-blue-700">14</div>
                  <div className="text-sm text-blue-600">Hours</div>
                </div>
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 backdrop-blur-sm rounded-2xl p-4 border border-blue-200 shadow-lg">
                  <div className="text-3xl font-bold text-blue-700">35</div>
                  <div className="text-sm text-blue-600">Minutes</div>
                </div>
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 backdrop-blur-sm rounded-2xl p-4 border border-blue-200 shadow-lg">
                  <div className="text-3xl font-bold text-blue-700">42</div>
                  <div className="text-sm text-blue-600">Seconds</div>
                </div>
              </div>
            </div>
          </div>

          {/* Exclusive Bonuses */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="text-2xl mb-2">🎯</div>
              <div className="font-bold text-gray-800 mb-2">Content Strategy Guide</div>
              <div className="text-blue-600 text-sm">Worth $200</div>
            </div>
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="text-2xl mb-2">📚</div>
              <div className="font-bold text-gray-800 mb-2">500+ AI Prompts Library</div>
              <div className="text-blue-600 text-sm">Worth $150</div>
            </div>
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="text-2xl mb-2">🎓</div>
              <div className="font-bold text-gray-800 mb-2">1-on-1 Onboarding Call</div>
              <div className="text-blue-600 text-sm">Worth $150</div>
            </div>
          </div>

          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 text-2xl px-12 py-6 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 font-bold animate-pulse border-2 border-blue-300"
            onClick={() => openAuth('signup')}
          >
            Claim Your 50% Discount Now
            <ArrowUpRight className="w-6 h-6 ml-2" />
          </Button>

          <div className="mt-6 text-gray-600">
            <div className="flex items-center justify-center space-x-4 text-sm">
              <span>✅ No credit card required</span>
              <span>✅ Cancel anytime</span>
              <span>✅ 30-day guarantee</span>
            </div>
            <div className="mt-2 text-xs opacity-75">
              *Offer valid for new users only. Limited to first 1,000 signups.
            </div>
          </div>
        </div>
      </section>

      {/* Material Design Final CTA */}
      <section className="py-24 px-4 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-200/15 rounded-full blur-2xl transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        <div className="container mx-auto text-center max-w-4xl relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6 leading-tight">
            Ready to transform your content strategy?
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join over 10,000 creators who've already revolutionized their social media presence with AI
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 text-xl px-10 py-6 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 font-semibold"
              onClick={() => openAuth('signup')}
            >
              Start Creating for Free
              <ArrowUpRight className="w-6 h-6 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-blue-300 text-blue-600 hover:bg-blue-50 text-xl px-10 py-6 rounded-full backdrop-blur-sm transition-all duration-300"
              onClick={() => openAuth('signin')}
            >
              Watch Demo
              <Play className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-gray-600 text-sm">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4" />
              <span>Free 7-day trial</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Material Design Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <span className="text-2xl font-bold">ContentPilot AI</span>
              </div>
              <p className="text-gray-400 leading-relaxed max-w-md mb-6">
                Transform your social media strategy with AI-powered content creation.
                Generate, schedule, and optimize your posts across all platforms.
              </p>
              <div className="flex space-x-4">
                {[Twitter, Linkedin, Instagram, Facebook].map((Icon, index) => (
                  <a
                    key={index}
                    href="#"
                    className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors duration-200"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-lg mb-4">Product</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors duration-200">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors duration-200">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Integrations</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Support</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors duration-200">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm mb-4 md:mb-0">
                © 2024 ContentPilot AI. All rights reserved.
              </p>
              <div className="flex items-center space-x-6 text-sm text-gray-400">
                <span>Made with ❤️ for creators</span>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  🟢 All systems operational
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        currentMode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  );
};

export default LandingPage;
