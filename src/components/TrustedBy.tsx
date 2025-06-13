import { motion } from "framer-motion";
import { Star, TrendingUp, Users, Zap, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TrustedBy = () => {
  const companies = [
    {
      name: "Microsoft",
      logo: "https://images.unsplash.com/photo-1633409361618-c73427e4e206?w=150&h=150&fit=crop&crop=center",
      description: "Global Technology Leader",
      industry: "Technology",
      growth: "+45% engagement"
    },
    {
      name: "Spotify",
      logo: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=150&h=150&fit=crop&crop=center",
      description: "Music Streaming Platform",
      industry: "Entertainment",
      growth: "+60% reach"
    },
    {
      name: "Slack",
      logo: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=150&h=150&fit=crop&crop=center",
      description: "Workplace Communication",
      industry: "SaaS",
      growth: "+35% followers"
    },
    {
      name: "Dropbox",
      logo: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=150&h=150&fit=crop&crop=center",
      description: "Cloud Storage Solution",
      industry: "Cloud Services",
      growth: "+50% engagement"
    },
    {
      name: "Airbnb",
      logo: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=150&h=150&fit=crop&crop=center",
      description: "Travel & Hospitality",
      industry: "Travel",
      growth: "+70% bookings"
    },
    {
      name: "Stripe",
      logo: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=150&h=150&fit=crop&crop=center",
      description: "Payment Processing",
      industry: "FinTech",
      growth: "+40% conversions"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Enhanced Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 mb-4 px-4 py-2 text-sm font-medium">
              <Star className="w-4 h-4 mr-2 fill-current" />
              Trusted by 10,000+ Companies
            </Badge>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Trusted by <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">Industry Leaders</span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Join thousands of companies that have transformed their social media strategy with our AI-powered platform
            </p>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap justify-center items-center gap-8 mb-12 text-gray-600"
          >
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="font-medium">98% Customer Satisfaction</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-500" />
              <span className="font-medium">2M+ Posts Generated</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-purple-500" />
              <span className="font-medium">5x Faster Content Creation</span>
            </div>
          </motion.div>
        </div>

        {/* Enhanced Company Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {companies.map((company, index) => (
            <motion.div
              key={company.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -8 }}
              className="group w-full"
            >
              <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border-0 backdrop-blur-sm h-full relative overflow-hidden">
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative z-10">
                  {/* Company Logo & Info */}
                  <div className="flex items-start space-x-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-gray-100 group-hover:border-blue-200 transition-colors flex-shrink-0 shadow-lg">
                      <img
                        src={company.logo}
                        alt={`${company.name} logo`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-xl text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                        {company.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2">
                        {company.description}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {company.industry}
                      </Badge>
                    </div>
                  </div>

                  {/* Growth Metric */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-gray-700">Growth Impact</span>
                      </div>
                      <span className="text-lg font-bold text-green-600">{company.growth}</span>
                    </div>
                  </div>

                  {/* Success Indicator */}
                  <div className="mt-4 flex items-center space-x-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Active since 2023</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Enhanced CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center"
        >
          {/* Social Proof */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border-0 max-w-4xl mx-auto mb-8">
            <div className="grid md:grid-cols-3 gap-8 items-center">
              {/* Company Avatars */}
              <div className="flex justify-center">
                <div className="flex -space-x-3">
                  {companies.slice(0, 5).map((company, index) => (
                    <div key={index} className="relative">
                      <img
                        src={company.logo}
                        alt=""
                        className="w-12 h-12 rounded-full border-4 border-white object-cover shadow-lg"
                      />
                      {index === 4 && (
                        <div className="absolute inset-0 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          +2.5K
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">10,000+</div>
                <div className="text-gray-600 font-medium">Companies Trust Us</div>
                <div className="flex justify-center mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                  <span className="ml-2 text-sm text-gray-600">4.9/5 Rating</span>
                </div>
              </div>

              {/* CTA */}
              <div className="flex justify-center">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  Join Them Today
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>

          {/* Additional Trust Signals */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-gray-500 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>SOC 2 Type II Certified</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>99.9% Uptime SLA</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>24/7 Support</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TrustedBy;