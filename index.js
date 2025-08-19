const { Client, GatewayIntentBits } = require("discord.js");
const keepAlive = require("./keep_alive");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// When the bot is ready
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}!`);
});

// Simple ping command
client.on("messageCreate", (message) => {
  if (message.content === "!ping") {
    message.reply("🏓 Pong!");
  }
});

// Keep Replit server alive
keepAlive();

// Login with token (stored in Secrets)
client.login(process.env.TOKEN);
