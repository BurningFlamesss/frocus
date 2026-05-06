import type { PlasmoCSConfig } from "plasmo";
import type { MetaField } from "~types";


export const config: PlasmoCSConfig = {
    matches: ["<all_urls>"],
    run_at: "document_idle"
}

let currentFields: Array<MetaField> = ["title", "description", "keywords"]
let currentTerms: Array<string> = []