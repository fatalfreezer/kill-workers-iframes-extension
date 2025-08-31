// inject_page.js  (sayfa context)
(function(){
    // allow/block listeler content script tarafından kontrol edildi, ama burada conservative checks konuluyor.
    // 1) Timer throttling: aşırı kısa intervalleri engelle (örnek: <30ms)
    (function(){
        const OldSetInterval = window.setInterval;
        const OldSetTimeout = window.setTimeout;

        window.setInterval = function(fn, delay, ...args) {
            try {
                // eğer çok sık interval isteniyorsa reddet (sitesel risk)
                if (typeof delay === 'number' && delay < 30) {
                    // kısmi tolerans: 10ms altındakileri 30ms a yükselt
                    delay = 30;
                    console.warn('⛔ Çok sık setInterval throttled -> 30ms');
                }
            } catch(e){}
            return OldSetInterval(fn, delay, ...args);
        };

        window.setTimeout = function(fn, delay, ...args) {
            try {
                // çok kısa timeoute karşı hafif müdahale (örnek <5ms)
                if (typeof delay === 'number' && delay < 5) {
                    delay = 5;
                }
            } catch(e){}
            return OldSetTimeout(fn, delay, ...args);
        };
    })();

    // 2) WebSocket / EventSource kısıtlaması (conservative: block only suspicious urls containing keywords)
    (function(){
        const OldWS = window.WebSocket;
        window.WebSocket = function(url, ...args) {
            try {
                const s = String(url || '');
                if (/track|analytics|collect|ads|advert/i.test(s)) {
                    console.warn('❌ WebSocket create blocked (suspected tracking):', s);
                    // fake WebSocket minimal stub
                    return {
                        send(){},
                        close(){},
                        addEventListener(){},
                        removeEventListener(){},
                        readyState: 3 // CLOSED
                    };
                }
            } catch(e){}
            return new OldWS(url, ...args);
        };

        const OldES = window.EventSource;
        if (OldES) {
            window.EventSource = function(url, ...args) {
                try {
                    const s = String(url || '');
                    if (/track|analytics|collect|ads|advert/i.test(s)) {
                        console.warn('❌ EventSource create blocked (suspected tracking):', s);
                        // minimal stub
                        return {
                            close(){},
                            addEventListener(){},
                            removeEventListener(){},
                            readyState: 2
                        };
                    }
                } catch(e){}
                return new OldES(url, ...args);
            };
        }
    })();

    // 3) Worker override: yeni Worker'lar oluştuğunda terminate etmeye çalış
    (function(){
        try {
            const OldWorker = window.Worker;
            window.Worker = function(scriptURL, ...args) {
                try {
                    // conservative: worker url’leri short-circuit if they look like trackers
                    const url = String(scriptURL || '');
                    if (/recaptcha|doubleclick|googlesyndication|analytics|track|collect/i.test(url)) {
                        console.warn('❌ Worker creation blocked (suspected):', url);
                        return { postMessage(){}, terminate(){}, addEventListener(){}, removeEventListener(){} };
                    }
                    const w = new OldWorker(scriptURL, ...args);
                    // attempt to terminate immediately — best-effort
                    try { w.terminate(); console.log('🔪 Yeni Worker terminate edildi:', scriptURL); } catch(e){}
                    return { postMessage(){}, terminate(){}, addEventListener(){}, removeEventListener(){} };
                } catch(e){
                    return { postMessage(){}, terminate(){}, addEventListener(){}, removeEventListener(){} };
                }
            };
        } catch(e){}
    })();

    // 4) document.createElement override in page context as extra measure
    (function(){
        try {
            const orig = Document.prototype.createElement;
            Document.prototype.createElement = function(tagName, options) {
                const el = orig.call(this, tagName, options);
                if (String(tagName).toLowerCase() === 'iframe') {
                    const setAttr = el.setAttribute;
                    el.setAttribute = function(name, value) {
                        if (name === 'src' && typeof value === 'string') {
                            if (/recaptcha|doubleclick|googlesyndication|ads|advert/i.test(value) &&
                                !location.hostname.includes('youtube') && !location.hostname.includes('openai')) {
                                console.warn('❌ iframe creation blocked (page-context):', value);
                                return;
                            }
                        }
                        return setAttr.apply(this, arguments);
                    };
                }
                return el;
            };
        } catch(e){}
    })();

    // small guard: remove existing obvious tracking webworkers? (best-effort)
    // cannot reliably enumerate cross-origin workers; skip.
})();
