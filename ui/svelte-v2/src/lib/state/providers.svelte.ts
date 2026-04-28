import { useHttp } from "./ws.svelte";

export interface ModelInfo {
    id: string;
    name: string;
    description?: string;
    capabilities?: string[];
}

export interface ProviderData {
    id: string;
    name: string;
    display_name?: string;
    enabled: boolean;
    provider_type: string;
    settings?: any;
}

export const providersState = $state({
    providers: [] as ProviderData[],
    loading: false,
    error: null as Error | null
});

export async function loadProviders() {
    providersState.loading = true;
    try {
        const http = useHttp();
        const res = await http.get<{ providers: ProviderData[] }>("/v1/providers");
        providersState.providers = res.providers || [];
        providersState.error = null;
    } catch (e: any) {
        console.error("Failed to load providers", e);
        providersState.error = e;
    } finally {
        providersState.loading = false;
    }
}

export function useProviderModels(getProviderName: () => string | undefined) {
    let models = $state<ModelInfo[]>([]);
    let loading = $state(false);
    let error = $state<Error | null>(null);

    async function load() {
        const providerName = getProviderName();
        
        // Always clear models when provider changes or load is called
        models = [];
        
        if (!providerName) {
            return;
        }
        
        const provider = providersState.providers.find(p => p.name === providerName);
        if (!provider) {
            return;
        }

        loading = true;
        try {
            const http = useHttp();
            const res = await http.get<{ models: ModelInfo[] }>(`/v1/providers/${provider.id}/models`);
            models = res.models || [];
            error = null;
        } catch (e: any) {
            console.error(`Failed to load models for ${providerName}`, e);
            error = e;
            models = [];
        } finally {
            loading = false;
        }
    }

    // Reactively watch the provider name getter
    $effect(() => {
        load();
    });

    return {
        get models() { return models; },
        get loading() { return loading; },
        get error() { return error; },
        load
    };
}
