export {}

let currentTabId: number | null = null

chrome.runtime.onInstalled.addListener(() => {
    console.log("Frocus is installed and running!")
})

chrome.tabs.onActivated.addListener(async ({ tabId, windowId }) => {
    currentTabId = tabId

    const tab = await chrome.tabs.get(currentTabId)

    if (tab.title) {
        console.log(`Frocus: ${tab.title}`)
    }
    if (tab.url) {
        console.log(`Frocus: ${tab.url}`)
    }
})

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (currentTabId === tabId && changeInfo.status === "complete") {
        if (tab.title) {
            console.log(`Updated Frocus: ${tab.title}`)
        }
        if (tab.url) {
            console.log(`Updated Frocus: ${tab.url}`)
        }
    }

})