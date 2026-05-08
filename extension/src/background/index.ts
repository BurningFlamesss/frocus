import { Storage } from "@plasmohq/storage"
import { compileRules } from "~lib/compiler";
import { DEFAULT_RULES } from "~lib/rules";
import { loadPersistedSession, loadRules, persistSession, saveRules, type PersistedSession } from "~lib/store";
import { FLUSH_ALARM, FLUSH_PERIOD_MIN, RULES_KEY, SWITCH_DEBOUNCE_MS, type LiveRule, type PageMeta, type RequestMetaMessage, type Rule, type Session } from "~lib/types";

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
        this.attachListeners()
        this.init()
    }

    private async init() {
        const stored = await loadRules()
        if (!stored) await saveRules(DEFAULT_RULES)
        this.rules = compileRules(stored ?? DEFAULT_RULES)

        const orphan = await loadPersistedSession()
        if (orphan) this.recoverOrphanedSession(orphan)

        // const existing = await chrome.alarms.get(FLUSH_ALARM)
        // if (!existing) {
        //     chrome.alarms.create(FLUSH_ALARM, { periodInMinutes: FLUSH_PERIOD_MIN })
        // }

        this.storage.watch({
            [RULES_KEY]: ({ newValue }) => {
                this.rules = compileRules((newValue as Array<Rule>) ?? DEFAULT_RULES)
                console.log("Rules reloaded: ", this.rules.length)
            }
        })

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
            // if (tab?.id) this.scheduleSwitch(tab.id) // TODO: add scheduleSwitch
        } catch (error) {

        }

        console.log("Frocus Tracker is ready. Rules: ", this.rules)
    }

    private attachListeners(): void {

    }

    private async handleFocusChange(windowId: number): Promise<void> {
        if (windowId === chrome.windows.WINDOW_ID_NONE) {
            this.isFocused = false
            // TODO: endSession()

            // TODO: send notification to desktop app (focus_lost)
            // TODO: detect idle state

            return
        }

        this.isFocused = true

        // TODO: send notification to desktop app (focus_gained)

        try {
            const [tab] = await chrome.tabs.query({
                active: true,
                windowId
            })

            if (tab.id) this.scheduleSwitch(tab.id)

        } catch (error) {

        }

    }

    private scheduleSwitch(tabId: number): void {
        if (this.switchDebounce) clearTimeout(this.switchDebounce)

        this.switchDebounce = setTimeout(() => {
            this.switchSession(tabId)
        }, SWITCH_DEBOUNCE_MS);
    }

    private async switchSession(tabId: number): Promise<void> {

    }

    private endSession(): void {
        if (!this.session) return

        const duration = Date.now() - this.session.startedAt

        if (duration > 0) {
            for (const id of this.session.ruleIds) {
                this.timeAcc[id] = (this.timeAcc[id] ?? 0) + duration
            }

            if (this.session.meta) {
                const id = this.session.primaryRuleId;
                (this.metaAcc[id] ??= []).push(this.session.meta)
            }
        }

        console.log(`Session end: ${duration}ms > [${this.session.ruleIds.join(", ")}]`)

        // TODO: send notification to desktop app (session_end)

        persistSession(null)

        this.session = null
    }


    private async resolveSessionMeta(tabId: number, rule: LiveRule): Promise<PageMeta | null> {
        const cached = this.metaCache.get(tabId)

        if (cached) return cached

        try {
            const message: RequestMetaMessage = {
                type: "REQUEST_META",
                metaFields: rule.metaFields,
                includeTerms: rule.include
            }
            const meta = await chrome.tabs.sendMessage(tabId, message) as PageMeta | undefined

            if (meta) {
                this.metaCache.set(tabId, meta)
                return meta
            }

        } catch (error) {
            
        }

        return null
    }


    receivePageMeta(tabId: number, meta: PageMeta, url: string): void {
        this.metaCache.set(tabId, meta)

        if (this.session.tabId === tabId && this.session.primaryRuleId && !this.session.meta) {
            chrome.tabs.get(tabId).then(tab => {
                if (tab.url === url && this.session.tabId === tabId) {
                    const rule = this.rules.find(rule => rule.id === this.session.primaryRuleId)

                    if (rule.needsMeta) this.session.meta = meta
                }
            }).catch(() => {})
        }

        // console.log("TabId: ", tabId, " Meta: ", meta, " Url: ", url)
    }

    private recoverOrphanedSession(orphan: PersistedSession): void {
        const duration = Date.now() - orphan.startedAt

        if (duration <= 0) return

        console.log(`Recovering orphaned session: ${orphan.ruleIds} - ${duration}ms`)

        for (const id of orphan.ruleIds) {
            this.timeAcc[id] = (this.timeAcc[id] ?? 0) + duration
        }

        persistSession(null)
    }

    getSession() {
        return this.session
    }

    getRules() {
        return this.rules
    }

    getTimeAccumulator() {
        return {
            ...this.timeAcc
        }
    }

    updateRules(rules: Array<Rule>): void {
        saveRules(rules)
        // console.log("RULES: ", rules)
    }


}

export const tracker = new FrocusTracker()