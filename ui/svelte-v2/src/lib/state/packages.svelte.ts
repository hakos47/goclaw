import { useHttp } from "./ws.svelte";

export interface PackageInfo {
  name: string;
  version: string;
}

export interface PackagesData {
  system: PackageInfo[];
  pip: PackageInfo[];
  npm: PackageInfo[];
  github: PackageInfo[];
}

export interface RuntimeInfo {
  name: string;
  available: boolean;
  version: string;
}

export interface RuntimesData {
  runtimes: RuntimeInfo[];
}

export const packagesStore = $state({
  packages: null as PackagesData | null,
  runtimes: null as RuntimesData | null,
  loadingPackages: false,
  loadingRuntimes: false,
  errorPackages: null as string | null,
  errorRuntimes: null as string | null,
});

export async function fetchPackages() {
  packagesStore.loadingPackages = true;
  packagesStore.errorPackages = null;
  const http = useHttp();
  try {
    const res = await http.get<PackagesData>("/v1/packages");
    packagesStore.packages = res || null;
  } catch (err: any) {
    packagesStore.errorPackages = err.message;
  } finally {
    packagesStore.loadingPackages = false;
  }
}

export async function fetchRuntimes() {
  packagesStore.loadingRuntimes = true;
  packagesStore.errorRuntimes = null;
  const http = useHttp();
  try {
    const res = await http.get<RuntimesData>("/v1/packages/runtimes");
    packagesStore.runtimes = res || null;
  } catch (err: any) {
    packagesStore.errorRuntimes = err.message;
  } finally {
    packagesStore.loadingRuntimes = false;
  }
}

export async function installPackage(pkgName: string) {
  const http = useHttp();
  await http.post("/v1/packages/install", { package: pkgName });
  await fetchPackages();
}

export async function uninstallPackage(pkgName: string) {
  const http = useHttp();
  await http.post("/v1/packages/uninstall", { package: pkgName });
  await fetchPackages();
}

export async function installGithubBinary(repo: string, binaryName: string) {
  const http = useHttp();
  // Github binary install actually passes through standard install with github: prefix
  // Wait, let's look at the react code: it calls onInstall(`github:${spec}`) which maps to /v1/packages/install with {package: `github:${spec}`}
  await http.post("/v1/packages/install", { package: `github:${repo}` });
  await fetchPackages();
}
