import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const planId = "scenestart-brief-design-plan";

function targetIdentity(): Plugin {
  return {
    name: "ztothez-design-target-identity",
    configureServer(server) {
      server.middlewares.use((_request, response, next) => {
        response.setHeader("X-ZtotheZ-Design-Plan", planId);
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((_request, response, next) => {
        response.setHeader("X-ZtotheZ-Design-Plan", planId);
        next();
      });
    },
  };
}

export default defineConfig({ plugins: [targetIdentity(), react()] });
