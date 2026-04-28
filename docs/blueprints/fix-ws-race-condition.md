# Technical Blueprint: WebSocket Race Condition Fix

## 1. Problem Analysis
The Svelte V2 UI encounters an `ApiError: WebSocket not connected` upon page initialization (e.g., in `ChannelDetail.svelte`). This is a classic race condition where the component calls `loadStatus()` via `useChannels()` synchronously within `onMount`. 

Because `WsClient.connect()` is asynchronous (it involves TCP connection followed by an application-level authentication handshake), the `readyState` is not yet `OPEN` and the client is not yet `authenticated`. Consequently, `WsClient.callWithId()` throws an exception immediately instead of waiting for the connection lifecycle to complete.

## 2. Proposed Architecture (Svelte 5 Runes & Promise Queue)

The fix requires a multi-layered approach: making the underlying client connection-aware, handling pending states, and making the UI react to connection lifecycle events correctly.

### 2.1. Update `WsClient` to Queue Pending Requests (`ui/svelte-v2/src/lib/api/ws-client.ts`)
Instead of rejecting requests immediately if the connection is not fully established, `WsClient` should await the `connected` state up to a specified timeout.

**Modifications:**
1. Add an internal queue array to store pending promises while the handshake completes:
   ```typescript
   private connectionWaiters: Array<{ resolve: () => void; reject: (err: ApiError) => void; timeout: ReturnType<typeof setTimeout> }> = [];
   ```

2. Introduce a `waitForConnection` method:
   ```typescript
   async waitForConnection(timeoutMs = 10000): Promise<void> {
     if (this.isConnected) return Promise.resolve();
     if (this.intentionalClose) throw new ApiError("UNAVAILABLE", "Connection permanently closed");

     return new Promise((resolve, reject) => {
       const timer = setTimeout(() => {
         this.connectionWaiters = this.connectionWaiters.filter(w => w.resolve !== resolve);
         reject(new ApiError("AGENT_TIMEOUT", "Timed out waiting for WebSocket connection"));
       }, timeoutMs);

       this.connectionWaiters.push({
         resolve: () => { clearTimeout(timer); resolve(); },
         reject: (err) => { clearTimeout(timer); reject(err); },
         timeout: timer
       });
     });
   }
   ```

3. Modify the `authenticate` logic on success (`this.authenticated = true`):
   ```typescript
   // After this.authenticated = true;
   this.connectionWaiters.forEach(w => w.resolve());
   this.connectionWaiters = [];
   ```

4. Modify the `disconnect` / `onclose` logic:
   ```typescript
   this.connectionWaiters.forEach(w => w.reject(new ApiError("UNAVAILABLE", "Connection failed or closed")));
   this.connectionWaiters = [];
   ```

5. Modify the `call` method to wait for the connection:
   ```typescript
   async call<T = unknown>(
     method: string,
     params?: Record<string, unknown>,
     timeoutMs?: number,
   ): Promise<T> {
     await this.waitForConnection(timeoutMs);
     return this.callWithId<T>(method, params, timeoutMs).promise;
   }
   ```

### 2.2. Update `useChannels` (`ui/svelte-v2/src/pages/channels/hooks/use-channels.svelte.ts`)
The `loadStatus` function should cleanly capture errors from the timeout and avoid throwing fatal unhandled promises.
No structural change is heavily needed here since `channelsStatusState.error` already catches it, but the queue mechanism introduced in `WsClient` natively handles the retry wait.

### 2.3. Reactive Polling via Runes in `ChannelDetail.svelte`
Instead of tightly coupling WebSocket operations to `onMount` (which ignores the WebSocket state), Svelte 5 Runes should be used to bind the polling lifecycle strictly to `wsState.connected`.

**Modifications:**
1. Import the reactive global `wsState`:
   ```typescript
   import { wsState } from "$lib/state/ws.svelte";
   ```

2. Remove `loadStatus()` and `setInterval` from the `onMount` block. `onMount` should only handle the HTTP REST calls:
   ```typescript
   onMount(async () => {
     loadAgents();
     await loadData();
   });
   ```

3. Create an `$effect` rune that automatically triggers and maintains polling *only* when connected:
   ```typescript
   $effect(() => {
     if (wsState.connected) {
       // Initial fetch on connection established
       loadStatus();
       
       // Setup polling interval
       const interval = setInterval(() => {
         loadData(false); // background refresh for http
         loadStatus();
       }, 15000);
       
       return () => clearInterval(interval);
     }
   });
   ```

## 3. Definition of Done
1. `WsClient` gracefully buffers `call()` invocations and resolves them post-authentication.
2. Svelte components do not crash or throw `WebSocket not connected` exceptions during navigation or initialization.
3. Live `ChannelDetail.svelte` components correctly resume polling dynamically whenever the socket reconnects, owing to the `$effect` binding to `wsState.connected`.