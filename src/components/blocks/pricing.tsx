"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import confetti from "canvas-confetti";

interface PricingPlan {
  name: string;
  price: string;
  yearlyPrice: string;
  period: string;
  features: string[];
  description: string;
  buttonText: string;
  href: string;
  isPopular: boolean;
}

interface PricingProps {
  plans: PricingPlan[];
  title?: string;
  description?: string;
}

export function Pricing({ plans, title, description }: PricingProps) {
  const [isYearly, setIsYearly] = useState(false);

  const triggerConfetti = () => {
    // Create a burst of confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8B5CF6', '#3B82F6', '#6366F1', '#10B981', '#F59E0B']
    });

    // Add a second burst with different settings
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ['#8B5CF6', '#3B82F6', '#6366F1']
      });
    }, 200);

    // Add a third burst from the other side
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

  return (
    <div className="w-full py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          {title && (
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {description.split('\n').map((line, index) => (
                <span key={index}>
                  {line}
                  {index < description.split('\n').length - 1 && <br />}
                </span>
              ))}
            </p>
          )}
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mt-8">
            <Label htmlFor="billing-toggle" className="text-sm font-medium text-gray-700">
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={isYearly}
              onCheckedChange={handleYearlyToggle}
              className="data-[state=checked]:bg-purple-600"
            />
            <Label htmlFor="billing-toggle" className="text-sm font-medium text-gray-700">
              Yearly
            </Label>
            <Badge className="bg-green-100 text-green-800 border-green-200 ml-2">
              Save 20%
            </Badge>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative ${plan.isPopular ? 'scale-105' : ''}`}
            >
              <Card className={`relative h-full flex flex-col ${
                plan.isPopular
                  ? 'border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-blue-50 shadow-2xl'
                  : 'border border-gray-200 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300'
              } rounded-3xl overflow-visible`}>
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                    <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-full flex items-center space-x-2 shadow-lg border-2 border-white">
                      <Sparkles className="h-4 w-4" />
                      <span className="font-semibold">Most Popular</span>
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8 pt-8">
                  <CardTitle className={`text-2xl font-bold mb-2 ${
                    plan.isPopular 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent' 
                      : 'text-gray-900'
                  }`}>
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-gray-600 mb-6">
                    {plan.description}
                  </CardDescription>
                  
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-center space-x-1">
                      <span className={`text-5xl font-bold ${
                        plan.isPopular 
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent' 
                          : 'text-gray-900'
                      }`}>
                        ${isYearly ? plan.yearlyPrice : plan.price}
                      </span>
                      <span className="text-gray-500 text-lg">{plan.period}</span>
                    </div>
                    {isYearly && (
                      <p className="text-sm text-green-600 font-medium">
                        Save ${(parseInt(plan.price) - parseInt(plan.yearlyPrice)) * 12}/year
                      </p>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="px-8 pb-8 flex-grow flex flex-col">
                  <ul className="space-y-4 mb-8 flex-grow">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto">
                    <Button
                      className={`w-full h-12 font-semibold rounded-xl transition-all duration-300 ${
                        plan.isPopular
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
                          : 'bg-gray-900 hover:bg-gray-800 text-white'
                      }`}
                      onClick={() => window.open(plan.href, '_blank')}
                    >
                      {plan.buttonText}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
