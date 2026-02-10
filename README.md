<h1 align="center">Custom Rich Presence for Poland_BOT</h1>

> [!IMPORTANT]
> To get your "App ID" go to the [**Discord Developer Portal**](https://discord.com/developers/applications), press **New Application** and on **General Information** you will see **Application ID**.

> [!IMPORTANT]
> To get an Icon for the application, head over to (on the same application you created) **Rich Presence** -> **Art Assets** -> **Rich Presence Assets** and name it just `icon` ([**can be changed, but requires rebuilding**](https://github.com/devPoland/poland-bot-rpc/blob/92ed131cbe2f82df254dd61c08ea5e7daa4de391/main.js#L229))

> [!WARNING]
> You cannot see the "Check out my Inventory" button (**showInventoryButton setting**), but others can and will (if the feature is enabled)

### What is this?

A small project for [**Poland_BOT**](https://devpoland.xyz/polandbot/), which uses the open API in order to display your stats.

Calls Made:

- https://devpoland.xyz/api/skin-prices

- https://devpoland.xyz/api/profit-stats

- https://devpoland.xyz/api/inventory?username=SETUSERNAME

Directories for `config.json` ([**found here**](https://github.com/devPoland/poland-bot-rpc/blob/92ed131cbe2f82df254dd61c08ea5e7daa4de391/main.js#L9))

**Windows > `\AppData\Roaming\poland_bot_rpc\config.json`**

**Linuxㅤㅤ> `~/.config/poland_bot_rpc/config.json`**

<img align="center"  src="https://devpoland.xyz/polandbot/preview.png">

## Default Config

```json
{
    "showUsername": true,
    "showProfit": true,
    "showBestPull": true,
    "showInventoryValue": true,
    "showCasesOpened": true,
    "showInventoryButton": true,
    "alwaysOnTop": false,
    "username": "",
    "appid": ""
}
```

## Building / Running

    There are 2 things you can do:

1. Directly run
    - Clone the repo `git clone https://github.com/devPoland/poland-bot-rpc`
    - Run `npm install`
    - Run `npm start`
2. Build
    - You can do this by using the already existing workflow, so probably just forking the repo with your changes
    - To build locally you need to clone the repo, run `npm install` and then `npm run build:win` or `npm run build:linux`, for reference you can look into [**the workflow**](https://github.com/devPoland/poland-bot-rpc/blob/main/.github/workflows/build.yml)
