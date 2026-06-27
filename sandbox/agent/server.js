import httpServer from "./src/app.js";

httpServer.listen(3000, () => {
    console.log("Sandbox agent is running on port 3000");
});