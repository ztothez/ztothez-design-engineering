import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const planId = "aegisops-operations-brief-design-plan";

function targetIdentity(): Plugin {
  return {
    name: "ztothez-design-target-identity",
    configureServer(server) {
      server.middlewares.use((_request, response, next) => {
        response.setHeader("X-ZtotheZ-Design-Plan", planId);
        if ((_request.url === "/run" && _request.method === "POST") || (_request.url === "/health" && _request.method === "GET")) {
          response.setHeader("Content-Type", "application/json");
          response.statusCode = _request.headers["x-fail"] ? 500 : 200;
          response.end(JSON.stringify({ status: response.statusCode === 200 ? "ok" : "error" }));
          return;
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((_request, response, next) => {
        response.setHeader("X-ZtotheZ-Design-Plan", planId);
        if ((_request.url === "/run" && _request.method === "POST") || (_request.url === "/health" && _request.method === "GET")) {
          response.setHeader("Content-Type", "application/json");
          response.statusCode = _request.headers["x-fail"] ? 500 : 200;
          response.end(JSON.stringify({ status: response.statusCode === 200 ? "ok" : "error" }));
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({ plugins: [targetIdentity(), react()] });
