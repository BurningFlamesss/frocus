import type { Rule } from "./types";

export const DEFAULT_RULES: Array<Rule> = [
    {
        id: "youtube",
        match: { hostname: "youtube.com" },
        behaviour: { emit: "never" }
    },
    {
        id: "instagram",
        match: { hostname: "instagram.com" },
        behaviour: { emit: "never" }
    },
    {
        id: "dopamine_intox",
        match: [
            { ref: "youtube" },
            { ref: "instagram" }
        ],
        behaviour: { priority: 100 }
    },
    {
        id: "youtube_shorts",
        match: {
            hostname: "youtube.com",
            pathname: "/shorts"
        },
        behaviour: {
            category: "youtube",
            priority: 200,
            supress: ["dopamine_intox"]
        }
    },
    {
        id: "deep_work",
        match: { hostname: "linear.app" },
        behaviour: { exclusive: true }
    },
    {
        id: "other",
        match: { hostname: "/.*/" },
        behaviour: { emit: "fallback" }
    }
]