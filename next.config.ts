import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // 開発環境（ローカル）でのみ、フロントエンド（3000番）への /api/* リクエストを Express バックエンド（8081番）にプロキシする
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/api/:path*",
          destination: "http://localhost:8081/api/:path*",
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
