document.addEventListener('DOMContentLoaded',()=>{
    const allowText=document.getElementById('allowList');
    const blockText=document.getElementById('blockList');
    const saveBtn=document.getElementById('save');

    chrome.storage.sync.get(['allowList','blockList'],result=>{
        allowText.value=(result.allowList||[]).join('\n');
        blockText.value=(result.blockList||[]).join('\n');
    });

    saveBtn.addEventListener('click',()=>{
        const allowList=allowText.value.split('\n').map(s=>s.trim()).filter(Boolean);
        const blockList=blockText.value.split('\n').map(s=>s.trim()).filter(Boolean);
        chrome.storage.sync.set({allowList,blockList},()=>{alert('Liste güncellendi!');});
    });
});
