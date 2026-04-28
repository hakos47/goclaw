<script lang="ts">
	import { cn } from "$lib/utils";
	import { buttonVariants } from ".";
	import type { VariantProps } from "class-variance-authority";

	type ButtonProps = {
		variant?: VariantProps<typeof buttonVariants>["variant"];
		size?: VariantProps<typeof buttonVariants>["size"];
		class?: string;
		href?: string;
		type?: "button" | "submit" | "reset";
		disabled?: boolean;
		onclick?: (event: MouseEvent) => void;
		children?: import("svelte").Snippet;
	};

	let {
		variant = "default",
		size = "default",
		class: className,
		href,
		type = "button",
		disabled = false,
		onclick,
		children,
		...restProps
	}: ButtonProps = $props();
</script>

{#if href}
	<a
		{href}
		class={cn(buttonVariants({ variant, size, className }))}
		{...restProps}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		{type}
		class={cn(buttonVariants({ variant, size, className }))}
		{disabled}
		{onclick}
		{...restProps}
	>
		{@render children?.()}
	</button>
{/if}