import type { NextConfig } from "next";

/**
 * Два режима сборки:
 *  - обычная (серверная, standalone) — локальный прод с API/Prisma/движком :3003;
 *  - статик (BUILD_STATIC=1) — GitHub Pages: export, basePath /feco-taxi,
 *    картинки без оптимизатора, API-роуты на время сборки временно убираются
 *    (скрипт .zscripts/build-static.sh), фронтенд живёт на фолбэках и
 *    локальном мини-движке (mvp-local.ts).
 */
const isStatic = process.env.BUILD_STATIC === "1";
const BASE_PATH = "/feco-taxi";

const staticConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  basePath: BASE_PATH,
  assetPrefix: BASE_PATH,
  trailingSlash: true,
  typescript: { ignoreBuildErrors: true },
  reactStrictMode: false,
  env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH, NEXT_PUBLIC_STATIC: "1" },
};

const serverConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default isStatic ? staticConfig : serverConfig;
