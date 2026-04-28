<script lang="ts">
	import { cn } from "$lib/utils";

	type Props = {
		class?: string;
		children?: import("svelte").Snippet;
	};
	let { class: className, children, ...restProps }: Props = $props();
</script>

<div
	class={cn("text-muted-foreground text-sm", className)}
	{...restProps}
>
	{@render children?.()}
</div>