import type { NextConfig } from "next";
import os from "os";

// 開発時にLAN内の他デバイスからアクセスできるようにするため、マシンのローカルIPアドレスを動的に取得する
const getLocalIPs = (): string[] => {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];
  for (const name of Object.keys(interfaces)) {
    const netList = interfaces[name];
    if (netList) {
      for (const net of netList) {
        // IPv4かつループバックアドレス（127.0.0.1）以外を取得
        if (net.family === "IPv4" && !net.internal) {
          ips.push(net.address);
          // ポート番号付きも追加
          ips.push(`${net.address}:3000`);
        }
      }
    }
  }
  return ips;
};

const localIPs = getLocalIPs();

const nextConfig: NextConfig = {
  allowedDevOrigins: localIPs,
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

