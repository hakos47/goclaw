import WebSocket from "ws";

const ws = new WebSocket("ws://localhost:8080/ws/dashboard");
ws.on("open", () => {
    ws.send(JSON.stringify({ type: "call", id: "1", method: "agents.list", params: {} }));
});
ws.on("message", (data) => {
    console.log("REPLY:", data.toString());
    process.exit(0);
});
