export const globalState = $state({
    session: null,
    theme: 'dark', 
    sidebarOpen: true,
    activeModel: 'gemini-3.1-pro'
});

export function toggleSidebar() {
    globalState.sidebarOpen = !globalState.sidebarOpen;
}