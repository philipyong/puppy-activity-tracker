/** @type {import("next").NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["*.preview.same-app.com"],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: [
      "source.unsplash.com",
      "images.unsplash.com",
      "ext.same-assets.com",
      "ugc.same-assets.com",
    ],
  },
};

module.exports = nextConfig;
