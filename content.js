// Kill Idle Workers & Iframes (Light Edition)
(() => {
    'use strict';

    const allowList = [
        "chat.openai.com", "openai.com",
        "youtube.com", "youtu.be",
        "discord.com"
    ];

    const blockList = [
        "recaptcha", "google.com/recaptcha",
        "doubleclick.net", "googlesyndication"
    ];

    const hostname = location.hostname;
    if (allowList.some(a => hostname.includes(a))) {
        console.log("⚪ Bypass: allowList domain:", hostname);
        return; // Bu sitede hiçbir şey yapma
    }

    // --- Worker Engelleyici ---
    const OldWorker = window.Worker;
    const allWorkers = [];

    window.Worker = function(scriptURL, ...args) {
        if (typeof scriptURL === "string" &&
            blockList.some(b => scriptURL.includes(b))) {
            console.warn("❌ Worker engellendi:", scriptURL);
            return { postMessage(){}, terminate(){}, addEventListener(){}, removeEventListener(){} };
        }
        const w = new OldWorker(scriptURL, ...args);
        allWorkers.push(w);
        return w;
    };

    // Var olan Worker’ları uzun aralıklarla temizle
    setInterval(() => {
        for (let i = allWorkers.length - 1; i >= 0; i--) {
            try { allWorkers[i].terminate(); } catch(e) {}
            allWorkers.splice(i, 1);
        }
    }, 60000); // 1 dakika

    // --- iframe Engelleyici ---
    const origCreateElement = Document.prototype.createElement;
    Document.prototype.createElement = function(tagName, options) {
        const el = origCreateElement.call(this, tagName, options);

        if (tagName.toLowerCase() === "iframe") {
            const origSetAttr = el.setAttribute;
            el.setAttribute = function(name, value) {
                if (name === "src" && typeof value === "string" &&
                    blockList.some(b => value.includes(b))) {
                    console.warn("❌ Alt çerçeve engellendi:", value);
                    return;
                }
                return origSetAttr.apply(this, arguments);
            };
        }
        return el;
    };

    // Var olan iframe’leri uzun aralıklarla temizle
    function cleanupIframes() {
        document.querySelectorAll("iframe").forEach(ifr => {
            const src = ifr.src || "";
            if (blockList.some(b => src.includes(b))) {
                console.warn("🗑️ Alt çerçeve kaldırıldı:", src);
                ifr.remove();
            }
        });
    }
    setInterval(cleanupIframes, 60000); // 1 dakika

})();
