import { Storage } from "@plasmohq/storage"
import { saveRules } from "~lib/store";
import type { LiveRule, PageMeta, Rule, Session } from "~lib/types";

class FrocusTracker {
    private rules: Array<LiveRule> = []

    private session: Session | null = null

    private metaCache = new Map<number, PageMeta>()

    private timeAcc: Record<string, number> = {}
    private metaAcc: Record<string, Array<PageMeta>> = {}

    private isFocused = true
    private switchDebounce: ReturnType<typeof setTimeout> | null = null

    private readonly storage = new Storage({ area: "local" })

    constructor() {
        // attach the chrome listners, and init
    }


    receivePageMeta(tabId: number, meta: PageMeta, url: string): void {
        console.log("TabId: ", tabId, " Meta: ", meta, " Url: ", url)
    }

    updateRules(rules: Array<Rule>): void {
        saveRules(rules)
    }


}

export const tracker = new FrocusTracker()