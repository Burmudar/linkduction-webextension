var tabId = -1;
console.log("Extension started")
const HOST = "localhost";
const PORT = "3000";
const PATH = "/api/v1/websocket/";
console.log(`Connecting to websocket at: ${HOST}:${PORT}${PATH}`);
let ws = new WebSocket(`ws://${HOST}:${PORT}${PATH}`);
let tabTracker = new Map();

ws.binaryType = 'arraybuffer';
let obj = {
    type: "test",
    message: "This is a test"
}

let encoder = new TextEncoder();

let replyJSON = (obj) => {
    let data = encoder.encode(JSON.stringify(obj));
    return ws.send(data)
};

let handleData = (d) => {
    let dec = new TextDecoder();
    let result = dec.decode(d);
    msg = JSON.parse(result);

    handleMsg(msg);
};

let handleMsg = (msg) => {
    switch(msg.Type) {
        case "link": {
            handleLinkMsg(msg);
        }
        break;
        default:
            console.log(msg);
    }
};

function formatKey(k) {
    let lastProtoPos = k.search("://") + 3; // search will return pos of ':' so plus 3 to get first char after //
    if (lastProtoPos>= 0) {
        return k.slice(lastProtoPos);
    }

    return k;
}

function onTabCreated(url, tab) {
    let key = formatKey(url);
    console.log(`k:${key} v: ${tab}`)
    //we just have to store the tab id - the tab object is immutable so won't get updated on tab state changes
    
    tabTracker = tabTracker.set(key, tab);
}

function onError(err) {
    console.error(err)
}

function createTab(url) {
    var creating = browser.tabs.create({url: url});

    creating.then((tab) => onTabCreated(url, tab), onError);
}

async function activateTab(tab) {

    console.info(`Activate tab: ${tab.id}`);
    let updating = await browser.tabs.update(tab.id, {active: true});
    return updating;

}

async function findTab(tab) {
    let result = await browser.tabs.query({index: tab.index, windowId: tab.windowId});
    if (!result.length === 0) {
        throw new Error(`Tab not found -> id ${tab.id} index: ${tab.index} url: ${tab.url} title: ${tab.title}`);
    }
    console.info(`Found Tab: ${result[0].id}`);
    return result[0];
}

let handleLinkMsg = (linkMsg) => {
    // Have to use the promise tabs api
    console.log(`Opening link: ${linkMsg.URL}`);
    let key = formatKey(linkMsg.URL);
    console.log(`Tab key: ${key}`);
    if (tabTracker.has(key)) {
        let storedTab = tabTracker.get(key);
        findTab(storedTab).then((tab) => {
            console.log(tab);
             if (tab.highlighted) {
                createTab(linkMsg.URL);
            } else {
                activateTab(tab).then((t) => {console.log(`Tab ${t.id} activated`)}, onError);
            }
        }, onError)
    } else {
        createTab(linkMsg.URL);
    }
}

ws.onopen = (e) => {
    console.log("Connection open!");
    replyJSON(obj)
}

ws.onmessage = (e) => {
    console.log(e);
    console.log(e.data);
    handleData(e.data)
}

ws.onclose = (e) => console.log("connection closed!");