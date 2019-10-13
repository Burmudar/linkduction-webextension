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
}

let handleData = (d) => {
    let dec = new TextDecoder();
    let result = dec.decode(d);
    msg = JSON.parse(result);

    handleMsg(msg);
}

let handleMsg = (msg) => {
    switch(msg.Type) {
        case "link": {
            handleLinkMsg(msg);
        }
        break;
        default:
            console.log(msg);
    }
}

function onTabCreated(url, tab) {
    console.log(`k:${url} v: ${tab}`)
    //we just have to store the tab id - the tab object is immutable so won't get updated on tab state changes
    tabTracker = tabTracker.set(url, tab);
}

function onError(err) {
    console.error(err)
}

function createTab(url) {
    var creating = browser.tabs.create({url: url});

    creating.then((tab) => onTabCreated(url, tab), onError);
}

let handleLinkMsg = (linkMsg) => {
    // Have to use the promise tabs api
    console.log(`Opening link: ${linkMsg.URL}`);
    if (tabTracker.has(linkMsg.URL)) {
        let tab = tabTracker.get(linkMsg.URL);
        console.table(tab)
        console.info("==========");
        browser.tabs.get(tab.id).then((tab) => {
            console.table(tab)
            if (tab.highlighted) {
                createTab(linkMsg.URL);
            } else {
                browser.tabs.update(tab.id, {active: true}).then(() => {console.log(`Tab ${tab.id} activated`)}, onError);
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