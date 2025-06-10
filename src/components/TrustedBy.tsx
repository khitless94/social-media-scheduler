import { motion } from "framer-motion";

const TrustedBy = () => {
  const companies = [
    {
      name: "Microsoft",
      logo: "https://images.unsplash.com/photo-1633409361618-c73427e4e206?w=150&h=150&fit=crop&crop=center",
      description: "Global Technology Leader"
    },
    {
      name: "Spotify",
      logo: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=150&h=150&fit=crop&crop=center",
      description: "Music Streaming Platform"
    },
    {
      name: "Slack",
      logo: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=150&h=150&fit=crop&crop=center",
      description: "Workplace Communication"
    },
    {
      name: "Dropbox",
      logo: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=150&h=150&fit=crop&crop=center",
      description: "Cloud Storage Solution"
    },
    {
      name: "Airbnb",
      logo: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=150&h=150&fit=crop&crop=center",
      description: "Travel & Hospitality"
    },
    {
      name: "Stripe",
      logo: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=150&h=150&fit=crop&crop=center",
      description: "Payment Processing"
    }
  ];

  return (
    <section className="py-12 md:py-16 bg-gradient-to-r from-purple-50 to-pink-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Trusted by Industry Leaders
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base px-4">
            Join thousands of companies that trust our AI-powered social media management platform
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 lg:gap-8">
          {companies.map((company, index) => (
            <motion.div
              key={company.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="group w-full"
            >
              <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 backdrop-blur-sm h-full">
                <div className="flex flex-col items-center justify-center space-y-3 md:space-y-4 text-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-purple-200 group-hover:border-purple-400 transition-colors flex-shrink-0">
                    <img
                      src={company.logo}
                      alt={`${company.name} logo`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="min-h-0">
                    <h3 className="font-semibold text-sm md:text-base text-gray-900 group-hover:text-purple-600 transition-colors leading-tight">
                      {company.name}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-500 mt-1 leading-tight">
                      {company.description}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 md:mt-12 text-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="inline-flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 bg-white rounded-full px-4 md:px-6 py-3 shadow-lg border border-purple-200 max-w-sm sm:max-w-none mx-auto"
          >
            <div className="flex -space-x-2">
              {companies.slice(0, 3).map((company, index) => (
                <img
                  key={index}
                  src={company.logo}
                  alt=""
                  className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-white object-cover"
                />
              ))}
            </div>
            <span className="text-gray-700 font-medium text-sm md:text-base text-center">
              +2,500 companies trust our platform
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TrustedBy;