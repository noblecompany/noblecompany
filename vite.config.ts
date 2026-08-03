import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { seedDesignPlugin } from "@seed-design/vite-plugin";

/**
 * GitHub Pages는 https://<user>.github.io/<repo>/ 하위 경로로 서빙된다.
 * 배포용 빌드에서만 BASE_PATH 를 넘겨 하위 경로를 붙이고,
 * 로컬 dev/preview 와 실제 도메인 배포(e-noble.kr)에서는 루트("/")를 쓴다.
 *   예) BASE_PATH=/noble-preview/ npm run build
 */
export default defineConfig({
  base: process.env.BASE_PATH || "/",
  plugins: [react(), tsconfigPaths(), seedDesignPlugin()],
});
