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
