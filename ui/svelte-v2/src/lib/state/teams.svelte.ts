import { useWs } from "./ws.svelte";
import type { TeamData } from "../types/team";

export const teamsState = $state({
    teams: [] as TeamData[],
    loading: false,
    error: null as string | null
});

export async function loadTeams() {
    teamsState.loading = true;
    try {
        const ws = useWs();
        const res = await ws.call<{ teams: TeamData[] }>("teams.list", {});
        teamsState.teams = (res.teams || []).sort(
            (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
        teamsState.error = null;
    } catch (e: any) {
        console.error("Failed to load teams", e);
        teamsState.error = e.message;
    } finally {
        teamsState.loading = false;
    }
}

export async function createTeam(data: Partial<TeamData>) {
    try {
        const ws = useWs();
        await ws.call("teams.create", data);
        await loadTeams();
    } catch (e: any) {
        console.error("Failed to create team", e);
        throw e;
    }
}

export async function deleteTeam(id: string) {
    try {
        const ws = useWs();
        await ws.call("teams.delete", { id });
        await loadTeams();
    } catch (e: any) {
        console.error("Failed to delete team", e);
        throw e;
    }
}
