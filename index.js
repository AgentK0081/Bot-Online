import express from "express";
import { Client, GatewayIntentBits, Collection } from "discord.js";
import { readdirSync } from "fs";
import "dotenv/config";
import interactionHandler from "./interactionHandler.js";

// --- Express server for Render (to stay online) ---
const app = express();
app.get("/", (req, res) => res.send("Bot is running!"));
app.listen(process.env.PORT || 3000, () =>
  console.log("Listening for Render keep-alive")
);

//--- something to get the roblox user status ---
import fetch from "node-fetch";

const ROBLOX_USERS = [
  "ItsWillian",
  "ExploitBan",
  "Akori4e",
  "LUKE_R2D2",
  "UhOkayz",
  "001vvs"
  // add ALL usernames here (same as website list)
];

app.get("/live-users", async (req, res) => {
  try {
    // 1. Convert usernames → userIds
    const userIdRes = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usernames: ROBLOX_USERS,
        excludeBannedUsers: false
      })
    });

    const userIdData = await userIdRes.json();
    const userIds = userIdData.data.map(u => u.id);

    // 2. Check presence
    const presenceRes = await fetch("https://presence.roblox.com/v1/presence/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds })
    });

    const presenceData = await presenceRes.json();

    // 3. Filter only in-game users
    const liveUsers = presenceData.userPresences
      .filter(u => u.userPresenceType === 2) // 2 = In Game
      .map(u => ({
        userId: u.userId,
        lastLocation: u.lastLocation
      }));

    res.json(liveUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch live users" });
  }
});

// --- Discord Bot ---
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Load commands into client.commands
client.commands = new Collection();
const commandFiles = readdirSync("./commands").filter(file =>
  file.endsWith(".js")
);

for (const file of commandFiles) {
  const { default: command } = await import(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

console.log("Commands loaded:", [...client.commands.keys()]);

// Load interaction handler
interactionHandler(client);

// Bot online
client.once("ready", () => {
  console.log(`Bot is online as ${client.user.tag}`);
});

// Login
client.login(process.env.TOKEN);
