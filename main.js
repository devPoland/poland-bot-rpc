const {
    app,
    BrowserWindow,
    ipcMain,
    Tray,
    Menu,
    Notification,
} = require("electron");
const DiscordRPC = require("discord-rpc");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

let CLIENT_ID = "";

const CONFIG_PATH = path.join(app.getPath("userData"), "config.json");
// C:\Users\YOURUSER\AppData\Roaming\poland_bot_rpc\config.json

let mainWindow;
let rpc;
let updateInterval;
let currentUsername = "";
let settings = {
    showUsername: true,
    showProfit: true,
    showBestPull: true,
    showInventoryValue: true,
    showCasesOpened: true,
    showInventoryButton: true,
    alwaysOnTop: false,
    username: "",
    appid: "",
};

let priceData = null;
let priceIndex = null;
let lastApiCall = 0;
const API_COOLDOWN = 5000;
const RPC_COOLDOWN = 15000;

async function fetchSkinPrices() {
    try {
        const response = await axios.get(
            "https://devpoland.xyz/api/skin-prices"
        );
        priceData = response.data.data;
        priceIndex = buildPriceIndex();
    } catch (error) {
        console.error("failed to fetch skin prices:", error.message);
    }
}

function buildPriceIndex() {
    if (!priceData) return null;

    const index = new Map();

    if (priceData.skins) {
        for (const skin of priceData.skins) {
            const key = `${skin.name}|${skin.wear}|${skin.stattrak}`;
            index.set(key, skin.price);
        }
    }

    if (priceData.knives) {
        for (const knife of priceData.knives) {
            const key = `${knife.name}|${knife.wear}|${knife.stattrak}`;
            index.set(key, knife.price);
        }
    }

    if (priceData.gloves) {
        for (const glove of priceData.gloves) {
            const key = `${glove.name}|${glove.wear}`;
            index.set(key, glove.price);
        }
    }

    if (priceData.doppler_variants) {
        for (const doppler of priceData.doppler_variants) {
            const key = `${doppler.name}|${doppler.wear}|${doppler.stattrak}|${doppler.variant.toLowerCase()}`;
            index.set(key, doppler.price);
        }
    }

    return index;
}

function getPrice({ name, wear, stattrak = false, variant = null }) {
    if (!priceIndex) {
        return null;
    }

    if (variant) {
        const key = `${name}|${wear}|${stattrak}|${variant.toLowerCase()}`;
        return priceIndex.get(key) || null;
    }

    let key = `${name}|${wear}|${stattrak}`;
    if (priceIndex.has(key)) {
        return priceIndex.get(key);
    }

    key = `${name}|${wear}`;
    return priceIndex.get(key) || null;
}

function findBestItem(inventory) {
    let bestItem = null;
    let bestPrice = 0;

    for (const item of inventory) {
        const name =
            item.knife && item.knife !== false
                ? `${item.knife} | ${item.item}`
                : item.glove && item.glove !== false
                  ? `${item.glove} | ${item.item}`
                  : item.item;

        const wear = item.float.replace(/\s*\(.*?\)/, "");
        const stattrak = item.stattrak || false;
        const variant = item.variant || null;

        const price = getPrice({ name, wear, stattrak, variant });

        if (price && price > bestPrice) {
            bestPrice = price;
            bestItem = { ...item, name, wear, stattrak, variant, price };
        }
    }

    return bestItem;
}

function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const data = fs.readFileSync(CONFIG_PATH, "utf8");
            settings = { ...settings, ...JSON.parse(data) };
        }
    } catch (e) {
        console.log("no config found, using defaults");
    }
}

function saveConfig() {
    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(settings, null, 2));
    } catch (e) {
        console.error("failed to save config:", e);
    }
}

function createWindow() {
    loadConfig();

    mainWindow = new BrowserWindow({
        width: 450,
        height: 650,
        minWidth: 400,
        minHeight: 500,
        icon: path.join(__dirname, "icon.png"),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        frame: false,
        backgroundColor: "#121212",
        alwaysOnTop: settings.alwaysOnTop,
    });

    mainWindow.loadFile("./interface/index.html");

    mainWindow.on("close", (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();

            new Notification({
                title: "Poland_BOT RPC",
                body: "App closed to tray",
                icon: path.join(__dirname, "icon.png"),
            }).show();
        }
    });
}

function createTray() {
    tray = new Tray(path.join(__dirname, "icon.png"));

    const contextMenu = Menu.buildFromTemplate([
        {
            label: "Show App",
            click: () => {
                mainWindow.show();
            },
        },
        {
            label: "Quit",
            click: () => {
                app.isQuitting = true;
                app.quit();
            },
        },
    ]);

    tray.setToolTip("Poland_BOT RPC");
    tray.setContextMenu(contextMenu);
    tray.on("double-click", () => {
        mainWindow.show();
    });
}

async function initDiscordRPC() {
    rpc = new DiscordRPC.Client({ transport: "ipc" });
    await rpc.login({ clientId: CLIENT_ID });
}

async function updatePresence() {
    if (!rpc || !currentUsername) return;

    const now = Date.now();
    if (now - lastApiCall < API_COOLDOWN) return;
    lastApiCall = now;

    try {
        const [profitRes, inventoryRes] = await Promise.all([
            axios.get("https://devpoland.xyz/api/profit-stats"),
            axios.get(
                `https://devpoland.xyz/api/inventory?username=${currentUsername}`
            ),
        ]);

        const userData = profitRes.data.sortedProfits[currentUsername];
        if (!userData) throw new Error("user not found");

        const bestItem = findBestItem(inventoryRes.data.full_inventory);

        let details = "";
        let state = "";

        if (settings.showProfit) {
            const tofixedprofit = userData.profit.toFixed(2);
            details += `Profit: ${userData.profit >= 0 ? `+$${tofixedprofit}` : `$${tofixedprofit}`.replace("$-", "-$")}`;
        }

        if (settings.showProfit && settings.showInventoryValue)
            details += " | ";

        if (settings.showInventoryValue)
            details += `Inv: $${userData.inventoryValue.toFixed(2)}`;

        if (settings.showCasesOpened) state = `${userData.totalCases} cases`;

        if (settings.showCasesOpened && settings.showBestPull && bestItem)
            state += " | ";

        if (settings.showBestPull && bestItem) {
            if (bestItem.rarity === "🟡") {
                const whattolookfor = bestItem.knife
                    ? bestItem.knife
                    : bestItem.glove;

                state += `${bestItem.rarity} ${whattolookfor} | ${bestItem.item} ($${bestItem.price})`;
            } else {
                state += `${bestItem.rarity} ${bestItem.item} ($${bestItem.price})`;
            }
        }

        await rpc.request("SET_ACTIVITY", {
            pid: process.pid,
            activity: {
                details: details || "ㅤㅤ",
                state: state || "ㅤㅤ",
                assets: {
                    large_image: "icon",
                    large_text: settings.showUsername
                        ? currentUsername
                        : "Gambler",
                },
                ...(settings.showInventoryButton && {
                    buttons: [
                        {
                            label: "Check out my Inventory",
                            url: `https://devpoland.xyz/inventory/?u=${currentUsername}`,
                        },
                    ],
                }),
            },
        });

        mainWindow.webContents.send("update", {
            normaldata: userData,
            bestitem: bestItem,
        });
    } catch (error) {
        mainWindow.webContents.send("error", error.message);
    }
}

ipcMain.on("start", async (event, username, appid) => {
    currentUsername = username;
    CLIENT_ID = appid;
    settings.username = username;
    settings.appid = appid;
    saveConfig();
    await initDiscordRPC();
    updatePresence();
    updateInterval = setInterval(updatePresence, RPC_COOLDOWN);
});

ipcMain.on("stop", () => {
    clearInterval(updateInterval);
    if (rpc) rpc.clearActivity();
});

ipcMain.on("settings", (event, newSettings) => {
    settings = { ...settings, ...newSettings };
    saveConfig();
    updatePresence();
});

ipcMain.on("toggle-always-on-top", (event, value) => {
    settings.alwaysOnTop = value;
    saveConfig();
    mainWindow.setAlwaysOnTop(value);
});

ipcMain.on("get-config", (event) => {
    event.reply("config-loaded", settings);
});

ipcMain.on("window-minimize", () => {
    mainWindow.minimize();
});

ipcMain.on("window-close", () => {
    app.quit();
});

app.whenReady().then(async () => {
    await fetchSkinPrices();
    createWindow();
    createTray();
});
app.on("window-all-closed", () => app.quit());
