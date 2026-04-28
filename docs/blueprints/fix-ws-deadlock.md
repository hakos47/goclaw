# BLUEPRINT: FIX WS-CLIENT DEADLOCK

## Context
A deadlock was identified in `ui/svelte-v2/src/lib/api/ws-client.ts`. 

## Problem
In the `authenticate` method, the client calls:
```typescript
const res = await this.call<{ ... }>("connect", { ... });
```
However, `this.call` internally calls `await this.waitForConnection()`. 
`waitForConnection` checks `this.isConnected`, which evaluates to `this.authenticated === true && this.ws?.readyState === WebSocket.OPEN`.
But `this.authenticated` is only set to `true` *after* the `connect` response is received and processed.
Thus, the `connect` call hangs indefinitely waiting for `this.authenticated` to become true, which can never happen.

## Solution / Implementation Instructions
For the Worker (Nivel 3 - Tropa de Choque):

1. **Target File:** `ui/svelte-v2/src/lib/api/ws-client.ts`
2. **Action:** Refactor the `authenticate` method to bypass `this.waitForConnection()`.
3. **Change to Make:** Replace the usage of `this.call` with `this.callWithId(...).promise`.

### Target Code Adjustment:
```typescript
  private async authenticate(generation: number): Promise<void> {
    try {
      const res = await this.callWithId<{
        role?: string;
        status?: string;
        pairing_code?: string;
        sender_id?: string;
        tenant_id?: string;
        tenant_name?: string;
        tenant_slug?: string;
        is_owner?: boolean;
        is_master_scope?: boolean;
        edition?: "standard" | "lite";
        server?: { name?: string; version?: string };
      }>("connect", {
        token: this.getToken(),
        user_id: this.getUserId(),
        sender_id: this.getSenderID(),
        locale: localStorage.getItem("goclaw:language") || "en",
        tenant_hint: localStorage.getItem("goclaw:tenant_hint") || "",
        tenant_id: localStorage.getItem("goclaw:tenant_id") || "",
        protocolVersion: PROTOCOL_VERSION,
      }).promise;
      
      // ... rest of the method remains the same ...
```

By using `this.callWithId(...).promise` directly, the connection message is sent immediately over the open WebSocket (which we know is open since `authenticate` is called from `socket.onopen`), bypassing the `waitForConnection` check that relies on `this.authenticated`.
