import express from "express";
import { Client, GatewayIntentBits, Collection, Partials } from "discord.js";
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
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User
  ]
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

const STAFF_DM_CHANNEL_ID = "1267429976509124659";

client.on("messageCreate", async message => {
  // Ignore bots
  if (message.author.bot) return;
  // Only DMs
  if (message.guild) return;

  const embed = {
    title: "📨 New DM Received",
    color: 0xff0000,
    fields: [
      { name: "User", value: `${message.author.tag}` },
      { name: "User ID", value: message.author.id },
      { name: "Message", value: message.content || "*No text content*" }
    ],
    timestamp: new Date()
  };

  try {
    const staffChannel = await client.channels.fetch(STAFF_DM_CHANNEL_ID);
    if (staffChannel) {
      staffChannel.send({ embeds: [embed] });
    }
  } catch (err) {
    console.error("Failed to forward DM:", err);
  }
});

// Login
client.login(process.env.TOKEN);
