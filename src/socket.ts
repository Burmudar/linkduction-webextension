const HOST = "localhost";
const PORT = "3000";
const PATH = "/api/v1/websocket/";
const DEST = `ws://${HOST}:${PORT}${PATH}`;


let tabTracker = new Map<string, number>();

enum MsgTypes {
    Link = "link"
}
interface BaseMsg {
    type: string
}

interface LinkMsg extends BaseMsg {
    URL: string
}

function sendObj(obj: Object){
    let encoder = new TextEncoder();
    let data = encoder.encode(JSON.stringify(obj));
    ws.send(data);
}

function decodeData(data:ArrayBuffer):BaseMsg{
    let dec = new TextDecoder();
    let result = dec.decode(data);

    let msg = JSON.parse(result);

    return msg
}

function handleMsg(msg: BaseMsg) {
    switch(msg.type) {
        case MsgTypes.Link: {
            handleLinkMsg(msg as LinkMsg);
        }
        break;
        default:
            console.log(msg)
    }
}

function handleLinkMsg(msg:LinkMsg) {
    console.log(`Opening link: ${msg.URL}`)
    if (tabTracker.has(msg.URL)) {
        let tabId:number = tabTracker.get(msg.URL);

        browser.tabs.get(tabId).then((tab:browser.tabs.Tab) => {
            if (tab.highlighted) {
                //create the tab
            } else {
                browser.tabs.update(tab.id, {active: true}).then((tab:browser.tabs.Tab) => {
                    console.log(`tab updated: ${tab.id}`)
                }, onError)
            }
        })
    }
}

// Tab specific calls
function createTab(url:string) {
    let create = browser.tabs.create({url: url});

    create.then((tab:browser.tabs.Tab) => onTabCreated(url, tab), onError);

}

//Promise Event handlers
function onTabCreated(url:string, tab: browser.tabs.Tab) {
    console.log(`k: ${url} v: ${tab.id}`);

    tabTracker.set(url, tab.id);
}

function onError(err:any) {
    console.error(err)
}

// Websocket handlers

let ws = new WebSocket(DEST);
ws.binaryType = 'arraybuffer';

ws.onopen = (e:MessageEvent) => {
    console.log("Connection open!");
    //we immediately send something just the ball rolling for now
    sendObj({type: "test", message: "this is just a test"});
}

ws.onmessage = (e:MessageEvent) => {
    console.log(e);
    let msg:BaseMsg = decodeData(e.data);
    handleMsg(msg);
}

ws.onclose = (e:CloseEvent) => console.log("Connection closed!")