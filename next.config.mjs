/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "framer-motion",
      "@radix-ui/react-icons",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-slot",
    ],
  },
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
