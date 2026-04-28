<script lang="ts">
  import { _ } from "svelte-i18n";
  import { Search, Loader2 } from "lucide-svelte";
  import type { FieldDef } from "../channel-schemas";
  import { useWs } from "$lib/state/ws.svelte";
  import { Methods } from "$lib/api/protocol";
  // Assuming a toast store exists or just using console for now if not sure, 
  // but let's try to match the project's feedback mechanism if found.
  // In ChannelDetail.svelte it uses alert/confirm, so I'll stick to that or basic feedback.

  type Props = {
    fields: FieldDef[];
    values: Record<string, any>;
    onChange: (key: string, value: any) => void;
    idPrefix: string;
    instanceId?: string;
    isEdit?: boolean;
    contextValues?: Record<string, any>;
  };

  let { 
    fields, 
    values, 
    onChange, 
    idPrefix, 
    instanceId, 
    isEdit = false, 
    contextValues = {} 
  }: Props = $props();

  let allValues = $derived({ ...contextValues, ...values });

  function isFieldVisible(field: FieldDef) {
    if (!field.showWhen) return true;
    
    const depValue = allValues[field.showWhen.key] ?? fields.find(f => f.key === field.showWhen!.key)?.defaultValue;
    const depStr = depValue !== undefined && depValue !== null ? String(depValue) : "";
    
    if (Array.isArray(field.showWhen.value)) {
      return field.showWhen.value.includes(depStr);
    }
    return depStr === field.showWhen.value;
  }

  function isFieldDisabled(field: FieldDef) {
    if (!field.disabledWhen) return false;
    
    const depValue = allValues[field.disabledWhen.key] ?? fields.find(f => f.key === field.disabledWhen!.key)?.defaultValue;
    return String(depValue) === field.disabledWhen.value;
  }

  // Action handling
  let actionLoading = $state<Record<string, boolean>>({});

  async function handleAction(field: FieldDef, value: string) {
    if (!field.action || !value || !instanceId) return;

    actionLoading[field.key] = true;
    const ws = useWs();

    try {
      if (field.action.type === "whatsapp_resolve_jid") {
        const res = await ws.call(Methods.WHATSAPP_ID_RESOLVE, {
          instance_id: instanceId,
          phone: value
        }) as { jid: string; lid: string };
        
        if (res.jid) {
          onChange(field.key, res.jid);
          alert(`Identity Resolved: ${res.jid}`);
        }
      } else if (field.action.type === "whatsapp_verify_code") {
        await ws.call(Methods.PAIRING_APPROVE, {
          code: value.trim().toUpperCase(),
          approvedBy: "dashboard-owner"
        });
        
        onChange(field.key, "");
        alert("Code Validated successfully.");
      }
    } catch (err: any) {
      alert(`Action Failed: ${err.message || String(err)}`);
    } finally {
      actionLoading[field.key] = false;
    }
  }
</script>

<div class="grid gap-6">
  {#each fields as field (field.key)}
    {#if isFieldVisible(field)}
      {@const disabled = isFieldDisabled(field)}
      {@const id = `${idPrefix}-${field.key}`}
      {@const label = $_(`channels:fieldConfig.${field.key}.label`, { default: field.label })}
      {@const help = field.help ? $_(`channels:fieldConfig.${field.key}.help`, { default: field.help }) : ""}
      {@const disabledHint = field.disabledWhen?.hint ? $_(`channels:${field.disabledWhen.hint}`, { default: field.disabledWhen.hint }) : ""}
      
      <div class={`grid gap-2 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div class="flex items-center justify-between ml-1">
          <label for={id} class="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
            {label}
            {#if field.required && !isEdit}
              <span class="text-red-500/50 ml-0.5">*</span>
            {/if}
            {#if isEdit && field.type === 'password'}
              <span class="text-blue-400/50 normal-case font-medium tracking-normal ml-1">
                ({$_('channels.form.credentialsHint', { default: 'leave blank to keep' })})
              </span>
            {/if}
          </label>
        </div>

        {#if field.type === 'text' || field.type === 'password'}
          <div class="flex gap-2">
            <input 
              {id}
              type={field.type}
              value={values[field.key] ?? ""}
              oninput={(e) => onChange(field.key, e.currentTarget.value)}
              placeholder={field.placeholder}
              class="flex-1 bg-[#030014] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple/30 transition-all outline-none text-white placeholder:text-white/10"
            />
            {#if field.action}
              <button
                type="button"
                onclick={() => handleAction(field, values[field.key] ?? "")}
                disabled={actionLoading[field.key] || !values[field.key]}
                class="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all disabled:opacity-50"
              >
                {#if actionLoading[field.key]}
                  <Loader2 class="w-3.5 h-3.5 animate-spin" />
                {:else}
                  <Search class="w-3.5 h-3.5 text-goclaw-neon-cyan" />
                {/if}
                <span class="hidden sm:inline">{field.action.label}</span>
              </button>
            {/if}
          </div>

        {:else if field.type === 'number'}
          <input 
            {id}
            type="number"
            value={values[field.key] ?? ""}
            oninput={(e) => onChange(field.key, e.currentTarget.value ? Number(e.currentTarget.value) : undefined)}
            placeholder={field.defaultValue !== undefined ? String(field.defaultValue) : undefined}
            class="w-full bg-[#030014] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-goclaw-neon-purple transition-all outline-none text-white"
          />

        {:else if field.type === 'boolean'}
          <div class="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <span class="text-xs font-bold text-white/80">{label}</span>
            <button 
              onclick={() => onChange(field.key, !(values[field.key] ?? field.defaultValue ?? false))}
              class={`relative w-12 h-6 rounded-full transition-all duration-500 border ${(values[field.key] ?? field.defaultValue ?? false) ? 'bg-goclaw-neon-purple/20 border-goclaw-neon-purple/40' : 'bg-white/5 border-white/10'}`}
            >
              <div class={`absolute top-1 w-4 h-4 rounded-full transition-all duration-500 ${(values[field.key] ?? field.defaultValue ?? false) ? 'left-7 bg-goclaw-neon-purple shadow-[0_0_10px_rgba(217,70,239,0.8)]' : 'left-1 bg-white/20'}`}></div>
            </button>
          </div>

        {:else if field.type === 'select'}
          <select 
            {id}
            value={values[field.key] ?? field.defaultValue ?? ""}
            onchange={(e) => onChange(field.key, e.currentTarget.value)}
            class="w-full bg-[#030014] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-goclaw-neon-purple transition-all outline-none text-white appearance-none"
          >
            {#each (field.options || []) as opt}
              <option value={opt.value}>
                {$_(`channels:fieldOptions.${field.key}.${opt.value}`, { default: opt.label })}
              </option>
            {/each}
          </select>

        {:else if field.type === 'textarea'}
          <textarea 
            {id}
            value={values[field.key] ?? ""}
            oninput={(e) => onChange(field.key, e.currentTarget.value || undefined)}
            placeholder={field.placeholder}
            rows="3"
            class="w-full bg-[#030014] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-goclaw-neon-purple transition-all outline-none text-white placeholder:text-white/10"
          ></textarea>

        {:else if field.type === 'tags' || field.type === 'tool-select' || field.type === 'skill-select'}
          {@const tags = Array.isArray(values[field.key]) ? values[field.key] : []}
          <div class="space-y-2">
            <div class="flex flex-wrap gap-2 p-3 bg-[#030014] border border-white/10 rounded-xl min-h-[46px]">
              {#each tags as tag, i}
                <span class="inline-flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white/80">
                  {tag}
                  <button 
                    onclick={() => onChange(field.key, tags.filter((_, index) => index !== i))}
                    class="p-0.5 hover:bg-white/10 rounded-md transition-colors"
                  >
                    <X class="w-3 h-3" />
                  </button>
                </span>
              {/each}
              <input 
                type="text"
                placeholder={tags.length === 0 ? (field.placeholder || "Type and press enter...") : ""}
                class="flex-1 bg-transparent border-none outline-none text-sm text-white min-w-[120px]"
                onkeydown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const val = e.currentTarget.value.trim().replace(/,$/, "");
                    if (val && !tags.includes(val)) {
                      onChange(field.key, [...tags, val]);
                      e.currentTarget.value = "";
                    }
                  } else if (e.key === 'Backspace' && !e.currentTarget.value && tags.length > 0) {
                    onChange(field.key, tags.slice(0, -1));
                  }
                }}
              />
            </div>
          </div>

        {:else if field.type === 'tristate'}
          {@const currentVal = values[field.key]}
          <select 
            {id}
            value={currentVal === undefined ? "__inherit__" : String(currentVal)}
            onchange={(e) => {
              const val = e.currentTarget.value;
              if (val === "__inherit__") onChange(field.key, undefined);
              else if (val === "true") onChange(field.key, true);
              else if (val === "false") onChange(field.key, false);
              else onChange(field.key, val);
            }}
            class="w-full bg-[#030014] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-goclaw-neon-purple transition-all outline-none text-white appearance-none"
          >
            <option value="__inherit__">Inherit from system</option>
            {#if field.options}
              {#each field.options as opt}
                <option value={opt.value}>
                  {$_(`channels:fieldOptions.${field.key}.${opt.value}`, { default: opt.label })}
                </option>
              {/each}
            {:else}
              <option value="true">Yes</option>
              <option value="false">No</option>
            {/if}
          </select>
        
        {:else}
          <div class="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[10px] text-red-400 uppercase font-black tracking-widest">
            Unsupported field type: {field.type}
          </div>
        {/if}

        {#if disabledHint || help}
          <p class="text-[10px] text-white/30 ml-1 leading-relaxed italic">
            {disabled ? (disabledHint || help) : help}
          </p>
        {/if}
      </div>
    {/if}
  {/each}
</div>
