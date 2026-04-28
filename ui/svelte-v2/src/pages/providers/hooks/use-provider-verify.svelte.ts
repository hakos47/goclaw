import { useHttp } from "../../../lib/state/ws.svelte";
import type { ProviderVerifyResponse } from "../../../../../web/src/types/provider";

export function useProviderVerify() {
  const http = useHttp();

  let verifying = $state(false);
  let verifyingEmb = $state(false);
  let result = $state<ProviderVerifyResponse | null>(null);
  let resultEmb = $state<ProviderVerifyResponse | null>(null);
  let error = $state<string | null>(null);
  let errorEmb = $state<string | null>(null);

  async function verify(providerId: string, payload: Record<string, any>) {
    verifying = true;
    error = null;
    result = null;
    try {
      const res = await http.post<ProviderVerifyResponse>(`/v1/providers/${providerId}/verify`, payload);
      result = res;
      return res;
    } catch (e: any) {
      console.error("Verification failed", e);
      error = e.message;
      throw e;
    } finally {
      verifying = false;
    }
  }

  async function verifyEmbeddings(providerId: string, payload: Record<string, any>) {
    verifyingEmb = true;
    errorEmb = null;
    resultEmb = null;
    try {
      const res = await http.post<ProviderVerifyResponse>(`/v1/providers/${providerId}/embeddings/verify`, payload);
      resultEmb = res;
      return res;
    } catch (e: any) {
      console.error("Embedding verification failed", e);
      errorEmb = e.message;
      throw e;
    } finally {
      verifyingEmb = false;
    }
  }

  return {
    get verifying() { return verifying; },
    get verifyingEmb() { return verifyingEmb; },
    get result() { return result; },
    get resultEmb() { return resultEmb; },
    get error() { return error; },
    get errorEmb() { return errorEmb; },
    verify,
    verifyEmbeddings
  };
}
