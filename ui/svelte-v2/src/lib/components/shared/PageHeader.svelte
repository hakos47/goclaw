<script lang="ts">
	import type { ComponentType } from "svelte";
	import type { Icon } from "lucide-svelte";
	import { type Snippet } from "svelte";

	type Props = {
		title: string;
		description?: string | Snippet;
		actions?: Snippet;
		icon?: ComponentType<Icon>;
	};

	let { title, description, actions, icon: IconIcon }: Props = $props();
</script>

<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
	<div class="flex items-start gap-3">
		{#if IconIcon}
			<IconIcon class="mt-1 h-6 w-6 text-muted-foreground" />
		{/if}
		<div>
			<h1 class="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">{title}</h1>
			{#if description}
				<p class="mt-1 text-sm font-mono text-white/50 tracking-wider uppercase">
					{#if typeof description === 'string'}
						{description}
					{:else}
						{@render description()}
					{/if}
				</p>
			{/if}
		</div>
	</div>
	{#if actions}
		<div class="flex items-center gap-2">
			{@render actions()}
		</div>
	{/if}
</div>