export interface Unlock {
	name: string;
	displayName: string;
	icon: string;
	category: number;
	unlockedBy: string;
	percentage: number;
	link: string;
	description: string;
	unlockMethod: string;
	as: string | false;
	boss: string | false;
	lost?: boolean;
	keeper?: boolean;
}

export interface UnlocksData {
	unlocks: Unlock[];
	character_names: string[];
	boss_names: string[];
	categories: Record<string, string>;
	generated: number;
}
