export const uiState = $state({
    timezone: localStorage.getItem("goclaw:timezone") || "auto",
});

export function setTimezone(tz: string) {
    uiState.timezone = tz;
    localStorage.setItem("goclaw:timezone", tz);
}

export function resolveTimezone(tz: string): string {
    if (tz === "auto") return Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz;
}

/** "auto" = browser's local timezone. */
export const TIMEZONE_OPTIONS = [
    { value: "auto", label: "Auto (Local)" },
    { value: "UTC", label: "UTC" },
    { value: "America/New_York", label: "New York (ET)" },
    { value: "America/Chicago", label: "Chicago (CT)" },
    { value: "America/Los_Angeles", label: "Los Angeles (PT)" },
    { value: "Europe/London", label: "London (GMT/BST)" },
    { value: "Europe/Paris", label: "Paris (CET)" },
    { value: "Asia/Tokyo", label: "Tokyo (JST)" },
    { value: "Asia/Shanghai", label: "Shanghai (CST)" },
    { value: "Asia/Ho_Chi_Minh", label: "Ho Chi Minh (ICT)" },
    { value: "Asia/Singapore", label: "Singapore (SGT)" },
    { value: "Australia/Sydney", label: "Sydney (AEST)" },
] as const;
