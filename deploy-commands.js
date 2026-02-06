// deploy-commands.js
import { REST, Routes } from "discord.js";
import { readdirSync } from "fs";

const commands = [];

const commandFiles = readdirSync("./commands").filter(file => file.endsWith(".js"));
for (const file of commandFiles) {
  const { default: command } = await import(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

try {
  console.log("Uploading slash commands…");
  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );
  console.log("Slash commands updated!");
} catch (err) {
  console.error(err);
}
