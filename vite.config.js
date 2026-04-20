import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  // For GitHub Pages user site, your base is '/' at root.
  // But because we're deploying under /f1-game/, set base accordingly.
  // If you later move it to the site root, change base to "/".
  return {
    base: "/f1-game/"
  };
});
