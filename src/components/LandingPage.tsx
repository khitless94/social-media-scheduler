import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Clock, Users, TrendingUp, Sparkles, Target, BarChart3, Rocket, Play, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import AuthModal from "./AuthModal";
import TrustedBy from "./TrustedBy";

const LandingPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-100">
      {/* Sticky Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/20">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              ContentPilot AI
            </span>
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
              Coming Soon
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <Button asChild className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => openAuth('signin')}>
                  Sign In
                </Button>
                <Button 
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  onClick={() => openAuth('signup')}
                >
                  Start Free Trial
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Create <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">scroll-stopping</span> content in seconds using AI
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Generate high-performing posts for Twitter, LinkedIn & more — in just one click. 
            Say goodbye to writer's block forever.
          </p>
          
          {/* Social Media Platforms */}
          <div className="flex justify-center items-center space-x-6 mb-8">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Available for:</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 rounded-full">
                <Linkedin className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">LinkedIn</span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1 bg-sky-100 rounded-full">
                <Twitter className="w-4 h-4 text-sky-600" />
                <span className="text-sm font-medium text-sky-800">Twitter</span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1 bg-pink-100 rounded-full">
                <Instagram className="w-4 h-4 text-pink-600" />
                <span className="text-sm font-medium text-pink-800">Instagram</span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 rounded-full">
                <Facebook className="w-4 h-4 text-blue-700" />
                <span className="text-sm font-medium text-blue-900">Facebook</span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1 bg-orange-100 rounded-full">
                <div className="w-4 h-4 bg-orange-600 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">r</span>
                </div>
                <span className="text-sm font-medium text-orange-800">Reddit</span>
              </div>
            </div>
          </div>

          {user ? (
            <Button 
              asChild
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg px-8 py-6"
            >
              <Link to="/create">
                <Zap className="w-5 h-5 mr-2" />
                Create Your First Post
              </Link>
            </Button>
          ) : (
            <Button 
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg px-8 py-6"
              onClick={() => openAuth('signup')}
            >
              <Zap className="w-5 h-5 mr-2" />
              Generate Your First Post
            </Button>
          )}
          
          {/* Hero Demo Video */}
          <div className="mt-16 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 p-8 shadow-2xl">
            <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20"></div>
              <div className="relative z-10 text-center">
                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 mx-4 shadow-lg">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                    <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                  </div>
                  <div className="text-left space-y-2">
                    <div className="text-sm text-gray-600">Prompt: "Write a LinkedIn post about AI in marketing"</div>
                    <div className="h-1 bg-gradient-to-r from-purple-200 to-pink-200 rounded animate-pulse"></div>
                    <div className="text-sm font-medium text-gray-800">🚀 Just witnessed AI transform a startup's marketing strategy in real-time...</div>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="mt-4">
                  <Play className="w-4 h-4 mr-2" />
                  Watch Demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <TrustedBy />

      {/* Problem Cards */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Clock, title: "Tired of writer's block?", desc: "AI generates ideas instantly" },
              { icon: Target, title: "No time to post consistently?", desc: "Schedule weeks ahead" },
              { icon: TrendingUp, title: "Low engagement on socials?", desc: "AI optimizes for performance" },
              { icon: BarChart3, title: "Content planning feels overwhelming?", desc: "One-click generation" }
            ].map((problem, index) => (
              <Card key={index} className="border-0 bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <problem.icon className="w-8 h-8 text-purple-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">{problem.title}</h3>
                  <p className="text-sm text-gray-600">{problem.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-white/20 backdrop-blur-sm">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">How it works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: "✍️", title: "Write a simple prompt", desc: "Just describe what you want" },
              { icon: "🤖", title: "AI generates post & image", desc: "Powered by Google Gemini" },
              { icon: "📅", title: "Schedule with 1 click", desc: "Pick date, time & platform" },
              { icon: "🚀", title: "Auto-post everywhere", desc: "Via n8n/Make.com integration" }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl mb-4">{step.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Demo Cards with Videos */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">See it in action</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 bg-white/60 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-6 h-40 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-pink-400/10"></div>
                  <div className="text-center relative z-10">
                    <Sparkles className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-sm font-medium">LinkedIn Post Generator</p>
                    <Button size="sm" variant="outline" className="mt-2">
                      <Play className="w-3 h-3 mr-1" />
                      Demo
                    </Button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-2">Professional Content</h3>
                  <p className="text-sm text-gray-600">Generate thought leadership posts that build your professional brand</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/60 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-6 h-40 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-indigo-400/10"></div>
                  <div className="text-center relative z-10">
                    <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm font-medium">Twitter Thread Builder</p>
                    <Button size="sm" variant="outline" className="mt-2">
                      <Play className="w-3 h-3 mr-1" />
                      Demo
                    </Button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-2">Viral Threads</h3>
                  <p className="text-sm text-gray-600">Create engaging Twitter threads that get retweeted and liked</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/60 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-pink-100 to-rose-100 p-6 h-40 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-400/10 to-rose-400/10"></div>
                  <div className="text-center relative z-10">
                    <BarChart3 className="w-8 h-8 text-pink-600 mx-auto mb-2" />
                    <p className="text-sm font-medium">Analytics Dashboard</p>
                    <Button size="sm" variant="outline" className="mt-2">
                      <Play className="w-3 h-3 mr-1" />
                      Demo
                    </Button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-2">Smart Analytics</h3>
                  <p className="text-sm text-gray-600">Track performance and optimize your content strategy</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 bg-white/20 backdrop-blur-sm">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">What our users say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                name: "Sarah Chen", 
                role: "Marketing Director", 
                text: "ContentPilot AI saved me 10 hours per week. The AI posts perform better than what I wrote myself!",
                avatar: "SC"
              },
              { 
                name: "Mike Johnson", 
                role: "Solo Creator", 
                text: "From idea to scheduled post in under 2 minutes. This tool is a game-changer for content creation.",
                avatar: "MJ"
              },
              { 
                name: "Lisa Rodriguez", 
                role: "Agency Owner", 
                text: "We've scaled our content output 5x while maintaining quality. Our clients love the results.",
                avatar: "LR"
              }
            ].map((testimonial, index) => (
              <Card key={index} className="border-0 bg-white/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex text-yellow-400 mb-4">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                  </div>
                  <p className="text-gray-700 mb-4">"{testimonial.text}"</p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Perfect for...</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, title: "Solo creators", desc: "Scale your personal brand" },
              { icon: Rocket, title: "Startup marketers", desc: "Move fast with limited resources" },
              { icon: BarChart3, title: "Agencies", desc: "Deliver more for clients" },
              { icon: TrendingUp, title: "Product launches", desc: "Generate buzz quickly" }
            ].map((useCase, index) => (
              <Card key={index} className="border-0 bg-white/60 backdrop-blur-sm text-center">
                <CardContent className="p-6">
                  <useCase.icon className="w-8 h-8 text-purple-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">{useCase.title}</h3>
                  <p className="text-sm text-gray-600">{useCase.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-16 px-4 bg-white/20 backdrop-blur-sm">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Real results from real users</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { metric: "+1.2K", label: "followers in 1 month", icon: Users },
              { metric: "80%", label: "faster content creation", icon: Clock },
              { metric: "2x", label: "engagement rate", icon: TrendingUp }
            ].map((result, index) => (
              <div key={index} className="text-center">
                <result.icon className="w-8 h-8 text-purple-600 mx-auto mb-4" />
                <div className="text-4xl font-bold text-purple-600 mb-2">{result.metric}</div>
                <p className="text-gray-600">{result.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-4xl font-bold text-white mb-6">
            Stop guessing what to post — let AI do it for you
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Join thousands of creators who've already transformed their content strategy
          </p>
          <Button 
            size="lg"
            className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6"
            onClick={() => openAuth('signup')}
          >
            Start your free trial today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">ContentPilot AI</span>
            </div>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="hover:text-purple-400">Privacy Policy</a>
              <a href="#" className="hover:text-purple-400">Terms</a>
              <a href="#" className="hover:text-purple-400">Contact</a>
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
