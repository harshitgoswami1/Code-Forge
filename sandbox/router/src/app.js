import express from 'express';
import morgan from 'morgan';
import { createProxyMiddleware } from "http-proxy-middleware"

const app = express();
app.use(morgan('combined'));

app.get('/api/status/healthz', (req, res) => {
    res.status(200).json({ status: 'ok' });
})

app.get('/api/status/readyz', (req, res) => {
    res.status(200).json({ status: 'ready' });
})



const proxies = {}
const agentProxies = {}

function getProxy(sandboxId) {

    const target = `http://sandbox-service-${sandboxId}`; // Construct target URL based on sandboxId

    if (!proxies[ sandboxId ]) {
        proxies[ sandboxId ] = createProxyMiddleware({
            target,
            changeOrigin: true,
            ws: true,
        })
    }
    return proxies[ sandboxId ];
}

function getAgentProxy(sandboxId) {

    const target = `http://sandbox-service-${sandboxId}:3000`; // Construct target URL based on sandboxId

    if (!agentProxies[ sandboxId ]) {
        agentProxies[ sandboxId ] = createProxyMiddleware({
            target,
            changeOrigin: true,
            ws: true,
        })
    }

    return agentProxies[ sandboxId ];
}

// Resolve the right proxy for an incoming host header (or null if unknown).
function resolveProxy(host) {
    if (!host) return null;

    const [ sandboxId, kind ] = host.split('.');

    if (kind === 'agent') return getAgentProxy(sandboxId);
    if (kind === 'preview') return getProxy(sandboxId);

    return null;
}

app.use((req, res, next) => {
    const proxy = resolveProxy(req.headers.host);

    if (!proxy) return next();

    return proxy(req, res, next);
})

// WebSocket upgrade handler — must be attached to the HTTP server's "upgrade"
// event (Express middleware never sees upgrades). Without this, Vite HMR's
// WebSocket can't connect through the router and the preview reload-loops.
export function handleUpgrade(req, socket, head) {
    const proxy = resolveProxy(req.headers.host);

    if (!proxy) {
        socket.destroy();
        return;
    }

    proxy.upgrade(req, socket, head);
}

export default app