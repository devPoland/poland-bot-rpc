const { ipcRenderer } = require("electron");

ipcRenderer.send("get-config");
ipcRenderer.on("config-loaded", (event, config) => {
    document.getElementById("username").value = config.username || "";
    document.getElementById("appid").value = config.appid || "";
    document.getElementById("showUsername").checked = config.showUsername;
    document.getElementById("showProfit").checked = config.showProfit;
    document.getElementById("showBestPull").checked = config.showBestPull;
    document.getElementById("showInventoryValue").checked =
        config.showInventoryValue;
    document.getElementById("showCasesOpened").checked = config.showCasesOpened;
    document.getElementById("showInventoryButton").checked =
        config.showInventoryButton;
    document.getElementById("alwaysOnTop").checked = config.alwaysOnTop;
});

function start() {
    const username = document.getElementById("username").value.trim();
    const appid = document.getElementById("appid").value.trim();
    if (!username || !appid) return;

    ipcRenderer.send("start", username, appid);
    document.getElementById("startBtn").style.display = "none";
    document.getElementById("stopBtn").style.display = "block";
    document.getElementById("dataBox").style.display = "block";
    setStatus("connected", "Running");
}

function stop() {
    ipcRenderer.send("stop");
    document.getElementById("startBtn").style.display = "block";
    document.getElementById("stopBtn").style.display = "none";
    document.getElementById("dataBox").style.display = "none";
    setStatus("", "Not running");
}

function updateSettings() {
    ipcRenderer.send("settings", {
        showUsername: document.getElementById("showUsername").checked,
        showProfit: document.getElementById("showProfit").checked,
        showBestPull: document.getElementById("showBestPull").checked,
        showInventoryValue:
            document.getElementById("showInventoryValue").checked,
        showCasesOpened: document.getElementById("showCasesOpened").checked,
        showInventoryButton: document.getElementById("showInventoryButton")
            .checked,
    });
}

function toggleAlwaysOnTop() {
    const value = document.getElementById("alwaysOnTop").checked;
    ipcRenderer.send("toggle-always-on-top", value);
}

function setStatus(type, text) {
    const indicator = document.getElementById("statusIndicator");
    const statusText = document.getElementById("statusText");

    indicator.className = "status-indicator " + type;
    statusText.textContent = text;
}

function minimizeWindow() {
    ipcRenderer.send("window-minimize");
}

function closeWindow() {
    ipcRenderer.send("window-close");
}

ipcRenderer.on("update", (event, data) => {
    const normaldata = data.normaldata;
    const bestitem = data.bestitem;

    const tofixedprofit = normaldata.profit.toFixed(2);
    document.getElementById("profitValue").textContent =
        `${normaldata.profit >= 0 ? `+$${tofixedprofit}` : `$${tofixedprofit}`.replace("$-", "-$")}`;
    document.getElementById("profitValue").className =
        normaldata.profit >= 0 ? "data-value positive" : "data-value negative";
    document.getElementById("casesValue").textContent =
        normaldata.totalCases.toLocaleString();
    document.getElementById("inventoryValue").textContent =
        `$${normaldata.inventoryValue.toFixed(2)}`;

    if (bestitem) {
        if (bestitem.rarity === "🟡") {
            const whattolookfor = bestitem.knife
                ? bestitem.knife
                : bestitem.glove;

            document.getElementById("bestItemValue").textContent =
                `${bestitem.rarity} ${whattolookfor} | ${bestitem.item} ($${bestitem.price})`;
        } else {
            document.getElementById("bestItemValue").textContent =
                `${bestitem.rarity} ${bestitem.item} ($${bestitem.price})`;
        }
    }
    setStatus("connected", "Running");
});

ipcRenderer.on("error", (event, msg) => {
    setStatus("error", `error: ${msg}`);
});

document.getElementById("username").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        document.getElementById("appid").focus();
    }
});

document.getElementById("appid").addEventListener("keypress", (e) => {
    if (e.key === "Enter") start();
});

document.getElementById("startBtn").addEventListener("click", start);
document.getElementById("stopBtn").addEventListener("click", stop);

document
    .getElementById("showUsername")
    .addEventListener("change", updateSettings);

document
    .getElementById("showProfit")
    .addEventListener("change", updateSettings);

document
    .getElementById("showBestPull")
    .addEventListener("change", updateSettings);

document
    .getElementById("showInventoryValue")
    .addEventListener("change", updateSettings);

document
    .getElementById("showCasesOpened")
    .addEventListener("change", updateSettings);

document
    .getElementById("showInventoryButton")
    .addEventListener("change", updateSettings);

document
    .getElementById("alwaysOnTop")
    .addEventListener("change", toggleAlwaysOnTop);

document
    .querySelector(".titlebar-btn.minimize")
    .addEventListener("click", minimizeWindow);

document
    .querySelector(".titlebar-btn.close")
    .addEventListener("click", closeWindow);
