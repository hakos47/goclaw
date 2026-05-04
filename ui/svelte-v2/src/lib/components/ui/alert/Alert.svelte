<script lang="ts">
  import { cn } from "$lib/utils";
  import { cva, type VariantProps } from "class-variance-authority";

  const alertVariants = cva(
    "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
    {
      variants: {
        variant: {
          default: "bg-white/5 text-white border-white/10 backdrop-blur-md",
          destructive:
            "border-destructive/50 text-destructive dark:border-destructive bg-destructive/10 backdrop-blur-md",
          warning: "border-amber-500/50 text-amber-500 bg-amber-500/10 backdrop-blur-md",
          info: "border-blue-500/50 text-blue-500 bg-blue-500/10 backdrop-blur-md",
          success: "border-emerald-500/50 text-emerald-500 bg-emerald-500/10 backdrop-blur-md",
        },
      },
      defaultVariants: {
        variant: "default",
      },
    }
  );

  type Props = {
    class?: string;
    variant?: VariantProps<typeof alertVariants>["variant"];
    children?: import("svelte").Snippet;
  };

  let { class: className, variant = "default", children }: Props = $props();
</script>

<div
  role="alert"
  class={cn(alertVariants({ variant }), className)}
>
  {@render children?.()}
</div>
