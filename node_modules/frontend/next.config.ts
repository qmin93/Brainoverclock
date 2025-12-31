import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 404 에러 해결을 위해 output: 'export' 줄이 있다면 반드시 지워야 합니다.
  // 아래 설정은 API 경로를 백엔드와 연결해 줍니다.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`
          : 'http://127.0.0.1:5328/api/:path*',
      },
    ];
  },
};

export default nextConfig;
