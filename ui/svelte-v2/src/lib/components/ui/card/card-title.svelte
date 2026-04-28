<script lang="ts">
	import { cn } from "$lib/utils";

	type Props = {
		class?: string;
		children?: import("svelte").Snippet;
	};
	let { class: className, children, ...restProps }: Props = $props();
</script>

<div
	class={cn("leading-none font-semibold", className)}
	{...restProps}
>
	{@render children?.()}
</div>