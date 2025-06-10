/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['cf.quizizz.com', 'quizizz.com'],
  },
}

module.exports = nextConfig 