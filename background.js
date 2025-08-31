// background.js
chrome.runtime.onInstalled.addListener(()=>{
    chrome.storage.sync.get(['allowList','blockList'], result=>{
        if(!result.allowList) chrome.storage.sync.set({allowList:["chat.openai.com","openai.com","youtube.com","youtu.be","discord.com"]});
        if(!result.blockList) chrome.storage.sync.set({blockList:["recaptcha","google.com/recaptcha","doubleclick.net","googlesyndication"]});
    });
});

// content script talep ederse inject.js (page context) çalıştır
chrome.runtime.onMessage.addListener((msg, sender) => {
    if (msg && msg.action === 'inject' && sender.tab && sender.tab.id) {
        chrome.scripting.executeScript({
            target: { tabId: sender.tab.id },
            files: ['inject_page.js'],
            world: 'MAIN'
        }).catch(err => {
            // hata logla (örn. devtools ile görebilirsin)
            console.warn("inject error:", err);
        });
    }
});
