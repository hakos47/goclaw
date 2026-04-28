<script lang="ts">
	import { cn } from "$lib/utils";
	import { badgeVariants } from ".";
	import type { VariantProps } from "class-variance-authority";

	type BadgeProps = {
		variant?: VariantProps<typeof badgeVariants>["variant"];
		class?: string;
		children?: import("svelte").Snippet;
	};

	let {
		variant = "default",
		class: className,
		children,
		...restProps
	}: BadgeProps = $props();
</script>

<span
	class={cn(badgeVariants({ variant }), className)}
	{...restProps}
>
	{@render children?.()}
</span>