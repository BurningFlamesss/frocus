import { RULES_KEY, type Rule } from "./types";

export async function loadRules(): Promise<Array<Rule> | null> {
    const data = await chrome.storage.local.get(RULES_KEY)

    return (data[RULES_KEY] as Array<Rule> | undefined) ?? null
}

export async function saveRules(rules: Array<Rule>): Promise<void> {
    await chrome.storage.local.set({ [RULES_KEY]: rules })
}

