<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "$lib/components/ui/card";
  import { Badge } from "$lib/components/ui/badge";
  import { Input } from "$lib/components/ui/input";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Switch } from "$lib/components/ui/switch";
  import { Alert, AlertTitle, AlertDescription } from "$lib/components/ui/alert";
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "$lib/components/ui/dialog";
  import { Tabs, TabsList, TabsTrigger, TabsContent } from "$lib/components/ui/tabs";
  import { Info, AlertTriangle, CheckCircle2, XCircle } from "lucide-svelte";

  let showDialog = $state(false);
  let switchValue = $state(true);
  let inputValue = $state("");
  let tabsValue = $state("buttons");
</script>

<div class="p-8 space-y-12 max-w-5xl mx-auto overflow-y-auto h-full custom-scrollbar pb-32">
  <header>
    <h1 class="text-4xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-goclaw-neon-purple to-goclaw-neon-cyan drop-shadow-sm">
      Core UI Styleguide
    </h1>
    <p class="text-white/40 font-mono text-xs mt-2 tracking-widest uppercase">GoClaw V2 System Components</p>
  </header>

  <Tabs bind:value={tabsValue}>
    <TabsList>
      <TabsTrigger value="buttons">Buttons & Badges</TabsTrigger>
      <TabsTrigger value="inputs">Inputs & Controls</TabsTrigger>
      <TabsTrigger value="cards">Cards & Containers</TabsTrigger>
      <TabsTrigger value="overlays">Overlays & Alerts</TabsTrigger>
    </TabsList>

    <TabsContent value="buttons" class="space-y-8 pt-6">
      <section class="space-y-4">
        <h2 class="text-xs font-black uppercase tracking-widest text-white/30 border-b border-white/5 pb-2">Buttons</h2>
        <div class="flex flex-wrap gap-4">
          <Button variant="default">Default Neon</Button>
          <Button variant="outline">Outline Glass</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
        <div class="flex flex-wrap gap-4 items-center">
          <Button size="xs">Extra Small</Button>
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      <section class="space-y-4">
        <h2 class="text-xs font-black uppercase tracking-widest text-white/30 border-b border-white/5 pb-2">Badges</h2>
        <div class="flex flex-wrap gap-4">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
        </div>
      </section>
    </TabsContent>

    <TabsContent value="inputs" class="space-y-8 pt-6">
      <section class="space-y-4 max-w-md">
        <h2 class="text-xs font-black uppercase tracking-widest text-white/30 border-b border-white/5 pb-2">Text Inputs</h2>
        <div class="space-y-2">
          <label class="block">
            <span class="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Standard Input</span>
            <Input placeholder="Type something..." bind:value={inputValue} class="mt-1" />
          </label>
          {#if inputValue}
            <p class="text-[10px] font-mono text-goclaw-neon-cyan">Value: {inputValue}</p>
          {/if}
        </div>
        <div class="space-y-2">
          <label class="block">
            <span class="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Disabled Input</span>
            <Input disabled placeholder="Can't touch this" class="mt-1" />
          </label>
        </div>
      </section>

      <section class="space-y-4 max-w-md">
        <h2 class="text-xs font-black uppercase tracking-widest text-white/30 border-b border-white/5 pb-2">Textareas</h2>
        <div class="space-y-2">
          <label class="block">
            <span class="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Standard Textarea</span>
            <Textarea placeholder="Write a long message..." class="mt-1" />
          </label>
        </div>
      </section>

      <section class="space-y-4">
        <h2 class="text-xs font-black uppercase tracking-widest text-white/30 border-b border-white/5 pb-2">Switches</h2>
        <div class="flex items-center gap-4">
          <Switch bind:checked={switchValue} />
          <span class="text-xs font-mono text-white/60 uppercase tracking-widest">
            {switchValue ? 'System Active' : 'System Offline'}
          </span>
        </div>
      </section>
    </TabsContent>

    <TabsContent value="cards" class="space-y-8 pt-6">
      <section class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card class="glass-panel">
          <CardHeader>
            <CardTitle>Glass Panel Card</CardTitle>
            <CardDescription>Using the standard @utility glass-panel</CardDescription>
          </CardHeader>
          <CardContent>
            <p class="text-sm text-white/70 leading-relaxed">
              This card uses the refractive glassmorphism style defined in the project. 
              It includes backdrop-blur and a subtle translucent border.
            </p>
          </CardContent>
          <CardFooter class="flex justify-between">
            <Button variant="ghost" size="sm">Cancel</Button>
            <Button size="sm">Accept</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Standard Card</CardTitle>
            <CardDescription>Simple border and background</CardDescription>
          </CardHeader>
          <CardContent>
             <div class="space-y-2">
               <div class="h-2 w-full bg-white/5 rounded"></div>
               <div class="h-2 w-3/4 bg-white/5 rounded"></div>
               <div class="h-2 w-1/2 bg-white/5 rounded"></div>
             </div>
          </CardContent>
        </Card>
      </section>
    </TabsContent>

    <TabsContent value="overlays" class="space-y-8 pt-6">
       <section class="space-y-4 max-w-2xl">
        <h2 class="text-xs font-black uppercase tracking-widest text-white/30 border-b border-white/5 pb-2">Alerts</h2>
        <Alert>
          <Info size={16} class="text-blue-400" />
          <AlertTitle>Information</AlertTitle>
          <AlertDescription>Your session will expire in 5 minutes due to inactivity.</AlertDescription>
        </Alert>

        <Alert variant="warning">
          <AlertTriangle size={16} class="text-amber-500" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>High CPU usage detected on Node-Alpha.</AlertDescription>
        </Alert>

        <Alert variant="destructive">
          <XCircle size={16} class="text-red-500" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to connect to the secondary database cluster.</AlertDescription>
        </Alert>

        <Alert variant="success">
          <CheckCircle2 size={16} class="text-emerald-500" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Subagent "Coder-X" has completed the deployment task.</AlertDescription>
        </Alert>
      </section>

      <section class="space-y-4">
        <h2 class="text-xs font-black uppercase tracking-widest text-white/30 border-b border-white/5 pb-2">Dialogs</h2>
        <Button onclick={() => showDialog = true}>Open Modal Dialog</Button>
        
        <Dialog bind:open={showDialog} onClose={() => console.log("Dialog closed")}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm System Purge</DialogTitle>
              <DialogDescription>
                This action is irreversible. All temporary memory buffers will be cleared.
              </DialogDescription>
            </DialogHeader>
            <div class="py-6">
               <Alert variant="warning">
                <AlertTriangle size={16} class="text-amber-500" />
                <AlertDescription>You will lose all unsaved progress in active sessions.</AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button variant="ghost" onclick={() => showDialog = false}>Cancel</Button>
              <Button variant="destructive" onclick={() => showDialog = false}>Purge Buff/0</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </TabsContent>
  </Tabs>
</div>
