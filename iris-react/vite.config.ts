import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const backendProxy = {
  target: "http://127.0.0.1:5000",
  changeOrigin: true,
  cookieDomainRewrite: "",
  cookiePathRewrite: "/"
} as const;

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: {
      "/user": backendProxy,
      "/main": backendProxy,
      "/segmentation": backendProxy,
      "/admin": backendProxy,
      "/help": backendProxy,
      "/image_info": backendProxy,
      "/get_action_info": backendProxy,
      "/set_action_info": backendProxy,
      "/metadata": backendProxy,
      "/image": backendProxy
    }
  },
  preview: {
    port: 5173
  }
});
