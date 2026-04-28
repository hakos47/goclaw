<script lang="ts">
	import { cn } from "$lib/utils";

	type Props = {
		class?: string;
		children?: import("svelte").Snippet;
	};
	let { class: className, children, ...restProps }: Props = $props();
</script>

<div
	class={cn(
		"glass-panel text-card-foreground flex flex-col gap-6 py-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] hover:border-white/20",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>