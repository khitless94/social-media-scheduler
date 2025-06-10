import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Zap, Check, Star } from "lucide-react";

const SubscriptionPlans = () => {
  return (
    <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
      <CardHeader className="text-center pb-8">
        <CardTitle className="flex items-center justify-center space-x-3 text-2xl">
          <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
            <CreditCard className="h-6 w-6 text-purple-600" />
          </div>
          <span>Choose Your Plan</span>
        </CardTitle>
        <CardDescription className="text-lg">
          Unlock the full potential of AI-powered content creation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Current Plan Status */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Zap className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800">Free Plan</h3>
              <p className="text-sm text-green-700">5 AI-generated posts per month</p>
            </div>
          </div>
          <Badge className="bg-green-500 text-white px-4 py-2 text-sm font-medium">
            Current Plan
          </Badge>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Starter Plan */}
          <Card className="relative p-8 border-2 border-gray-200 rounded-2xl hover:shadow-xl transition-all duration-300 hover:border-blue-300 group">
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gray-900">Starter</h3>
                <p className="text-gray-500">Perfect for individuals</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline justify-center space-x-1">
                  <span className="text-4xl font-bold text-blue-600">$9</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="text-sm text-gray-400">Billed monthly</p>
              </div>
              <ul className="space-y-4 text-left">
                <li className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">25 AI posts per month</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Basic analytics dashboard</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Email support</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Up to 2 social accounts</span>
                </li>
              </ul>
              <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                Upgrade to Starter
              </Button>
            </div>
          </Card>

          {/* Pro Plan - Most Popular */}
          <Card className="relative p-8 border-2 border-purple-300 rounded-2xl hover:shadow-2xl transition-all duration-300 scale-105 bg-gradient-to-br from-purple-50 to-pink-50">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full flex items-center space-x-2 shadow-lg">
                <Star className="h-4 w-4" />
                <span className="font-semibold">Most Popular</span>
              </Badge>
            </div>
            <div className="text-center space-y-6 pt-4">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Pro Plan</h3>
                <p className="text-gray-600">For growing businesses</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline justify-center space-x-1">
                  <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">$29</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="text-sm text-gray-400">Billed monthly</p>
              </div>
              <ul className="space-y-4 text-left">
                <li className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">Unlimited AI posts</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">AI image generation</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Priority support</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Advanced analytics & insights</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Up to 10 social accounts</span>
                </li>
              </ul>
              <Button className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                Upgrade to Pro
              </Button>
            </div>
          </Card>

          {/* Enterprise Plan */}
          <Card className="relative p-8 border-2 border-gray-200 rounded-2xl hover:shadow-xl transition-all duration-300 hover:border-green-300 group">
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gray-900">Enterprise</h3>
                <p className="text-gray-500">For large organizations</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline justify-center space-x-1">
                  <span className="text-4xl font-bold text-green-600">$99</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="text-sm text-gray-400">Custom pricing available</p>
              </div>
              <ul className="space-y-4 text-left">
                <li className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">Everything in Pro</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Team collaboration tools</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Custom branding & themes</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">API access & integrations</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Unlimited social accounts</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">White-label solution</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full h-12 border-2 border-green-600 text-green-600 hover:bg-green-50 hover:border-green-700 font-semibold rounded-xl transition-all duration-200">
                Contact Sales
              </Button>
            </div>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionPlans;