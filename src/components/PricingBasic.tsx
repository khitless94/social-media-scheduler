"use client";

import { Pricing } from "@/components/blocks/pricing";

const demoPlans = [
  {
    name: "STARTER",
    price: "9",
    yearlyPrice: "7",
    period: "per month",
    features: [
      "50 AI-generated posts per month",
      "5 platforms (LinkedIn, Twitter, Instagram, Facebook, Reddit)",
      "Basic content scheduling",
      "Standard AI content templates",
      "Email support",
      "Basic analytics dashboard",
    ],
    description: "Perfect for individuals and content creators getting started",
    buttonText: "Start Free Trial",
    href: "/sign-up",
    isPopular: false,
  },
  {
    name: "PROFESSIONAL",
    price: "29",
    yearlyPrice: "23",
    period: "per month",
    features: [
      "Unlimited AI-generated posts",
      "All 5 platforms with advanced features",
      "AI image generation & optimization",
      "Advanced content scheduling & automation",
      "Premium AI content templates & tones",
      "Advanced analytics & performance insights",
      "Priority support (24-hour response)",
      "Content calendar & team collaboration",
      "Custom brand voice training",
    ],
    description: "Ideal for growing businesses and marketing teams",
    buttonText: "Get Started",
    href: "/sign-up",
    isPopular: true,
  },
  {
    name: "ENTERPRISE",
    price: "99",
    yearlyPrice: "79",
    period: "per month",
    features: [
      "Everything in Professional",
      "White-label solution",
      "Custom AI model training",
      "Dedicated account manager",
      "API access & custom integrations",
      "Advanced team management & permissions",
      "Custom analytics & reporting",
      "SSO & enterprise security",
      "SLA with 1-hour support response",
      "Custom onboarding & training",
    ],
    description: "For large organizations with custom requirements",
    buttonText: "Contact Sales",
    href: "/contact",
    isPopular: false,
  },
];

function PricingBasic() {
  return (
    <div className="w-full">
      <Pricing
        plans={demoPlans}
        title="Choose Your ContentPilot AI Plan"
        description="Transform your social media strategy with AI-powered content creation. Generate, schedule, and optimize posts across all major platforms with our advanced AI agents."
      />
    </div>
  );
}

export { PricingBasic };
