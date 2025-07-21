import { FaLinkedin, FaTwitter, FaInstagram, FaFacebook, FaReddit } from "react-icons/fa";

export const platforms = [
  {
    key: "twitter",
    name: "X (formerly Twitter)",
    description: "Share updates and engage with your audience",
    icon: FaTwitter,
    color: "text-black",
  },
  {
    key: "reddit",
    name: "Reddit",
    description: "Connect with communities and share content",
    icon: FaReddit,
    color: "text-orange-500",
  },
  {
    key: "linkedin",
    name: "LinkedIn",
    description: "Professional networking and business content",
    icon: FaLinkedin,
    color: "text-blue-600",
  },
  {
    key: "facebook",
    name: "Facebook",
    description: "Connect with friends and share moments",
    icon: FaFacebook,
    color: "text-blue-600",
  },
  {
    key: "instagram",
    name: "Instagram",
    description: "Share photos and stories with your followers",
    icon: FaInstagram,
    color: "text-pink-500",
  },
];