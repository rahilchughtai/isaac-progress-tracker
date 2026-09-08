import { parseSaveFile } from "./save-parser";
import { SaveParseError } from "./save-parser/types";
import { saveProgress, clearProgress, updateMyProgress } from "./progress";

// Bootstrap is loaded globally via CDN <script> tag in index.html, not as an npm module.
declare const bootstrap: {
	Modal: {
		getInstance(element: Element): { hide(): void } | null;
	};
};

function showError(message: string): void {
	const errorEl = document.getElementById("save-file-error");

	if (!errorEl) {
		return;
	}

	errorEl.textContent = message;
	errorEl.classList.remove("d-none");
}

function hideError(): void {
	document.getElementById("save-file-error")?.classList.add("d-none");
}

export function initSaveFileModal(): void {
	const modal = document.getElementById("save-file-modal");
	const form = modal?.querySelector("form");
	const fileInput = document.getElementById("save-file-input") as HTMLInputElement | null;
	const resetButton = document.getElementById("save-file-reset");

	if (!modal || !form || !fileInput) {
		return;
	}

	modal.addEventListener("show.bs.modal", hideError);

	form.addEventListener("submit", (event) => {
		event.preventDefault();

		hideError();

		const file = fileInput.files?.[0];

		if (!file) {
			showError("Please choose a save file to upload.");
			return;
		}

		parseSaveFile(file)
			.then((parsed) => {
				saveProgress(parsed.achievementIds);
				updateMyProgress();

				fileInput.value = "";

				const modalInstance = bootstrap.Modal.getInstance(modal);
				modalInstance?.hide();
			})
			.catch((error: unknown) => {
				console.error(error);

				if (error instanceof SaveParseError) {
					showError(error.message);
				} else {
					showError("Failed to read this save file. Please try again.");
				}
			});
	});

	resetButton?.addEventListener("click", () => {
		fileInput.value = "";
		hideError();
		clearProgress();
	});
}
