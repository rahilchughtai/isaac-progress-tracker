const STORAGE_KEY_HIBA_MODE = "hiba-mode";

function applyHibaMode(enabled: boolean): void {
	document.documentElement.toggleAttribute("data-hiba-mode", enabled);

	const themeColorMeta = document.querySelector('meta[name="theme-color"]');
	themeColorMeta?.setAttribute("content", enabled ? "#fff0f7" : "#0d0817");
}

export function initHibaMode(): void {
	const checkbox = document.getElementById("hiba-mode-toggle") as HTMLInputElement | null;

	if (!checkbox) {
		return;
	}

	const stored = localStorage.getItem(STORAGE_KEY_HIBA_MODE) === "true";
	checkbox.checked = stored;
	applyHibaMode(stored);

	checkbox.addEventListener("change", () => {
		localStorage.setItem(STORAGE_KEY_HIBA_MODE, String(checkbox.checked));
		applyHibaMode(checkbox.checked);
	});
}
