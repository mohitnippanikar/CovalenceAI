/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['randomuser.me'],
  },
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig 