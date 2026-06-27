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
        // NOTE: no `ws: true`. With it, http-proxy-middleware registers its OWN
        // server "upgrade" listener (after the first HTTP request), which races
        // the manual handleUpgrade() below. hpm's listener forwards the upgrade
        // unmodified, re-introducing permessage-deflate → intermittent
        // "RSV1 must be clear". We drive upgrades only through handleUpgrade().
        proxies[ sandboxId ] = createProxyMiddleware({
            target,
            changeOrigin: true,
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

    // Disable WebSocket per-message compression (permessage-deflate). The proxy
    // chain (ingress → router → vite) desyncs the extension negotiation: vite
    // ends up compressing frames (RSV1 bit set) while the browser's socket was
    // told no compression, so it rejects every frame with
    // "Invalid WebSocket frame: RSV1 must be clear" and reload-loops. Stripping
    // the offer on the last hop before vite means vite never compresses.
    delete req.headers[ 'sec-websocket-extensions' ];

    proxy.upgrade(req, socket, head);
}

export default app