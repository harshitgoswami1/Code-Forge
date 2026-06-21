import app, { handleUpgrade } from "./src/app.js";

const server = app.listen(3000, () => {
    console.log("sandbox server is running on port 3000")
})

// Forward WebSocket upgrades (e.g. Vite HMR) to the resolved sandbox proxy.
server.on("upgrade", handleUpgrade);