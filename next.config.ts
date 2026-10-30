import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 yerel (native) bir modül; paketlenmeden Node'dan yüklenmeli
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    serverActions: { bodySizeLimit: "6mb" }, // fotoğraflı bildirimler için
  },
};

export default nextConfig;
