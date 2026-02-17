import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openTickets = new Map();

import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField
} from "discord.js";

// 🔁 REPLACE THESE WITH YOUR REAL IDs
const SUPPORT_CATEGORY_ID = "1285863342669565974";
const MANAGEMENT_CATEGORY_ID = "1285864538691862579";
const CLOSED_CATEGORY_ID = "1285863191351656511";
const STAFF_CHANNEL_ID = "1225748207963734098";

export default function interactionHandler(client) {

  client.on("interactionCreate", async interaction => {

    // ==============================
    // SLASH COMMANDS
    // ==============================
    if (interaction.isChatInputCommand()) {

      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: "There was an error running this command!",
          ephemeral: true
        });
      }
    }

    // ==============================
    // BUTTON HANDLING
    // ==============================
    if (interaction.isButton()) {

      // OPEN TICKET
      if (interaction.customId === "support_ticket" || interaction.customId === "management_ticket") {

        const modal = new ModalBuilder()
          .setCustomId(`ticket_modal_${interaction.customId}`)
          .setTitle("Create Ticket");

        const reasonInput = new TextInputBuilder()
          .setCustomId("ticket_reason")
          .setLabel("Why are you creating this ticket?")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true);

        modal.addComponents(
          new ActionRowBuilder().addComponents(reasonInput)
        );

        return interaction.showModal(modal);
      }

      // CLOSE TICKET
if (interaction.customId === "close_ticket") {

  const channel = interaction.channel;

  await interaction.reply({ content: "Generating transcript...", ephemeral: true });

  let messages = [];
  let lastId;

  while (true) {
    const fetched = await channel.messages.fetch({ limit: 100, before: lastId });
    if (fetched.size === 0) break;
    messages.push(...fetched.values());
    lastId = fetched.last().id;
  }

  messages = messages.reverse();

  // Build message HTML FIRST
const messageHtml = messages.map(msg => {
  return `
  <div class="msg">
    <div class="author">${msg.author.tag}</div>
    <div class="time">${msg.createdAt.toLocaleString()}</div>
    <div>${msg.content || ""}</div>
  </div>
  `;
}).join("");

// Then build full HTML
const htmlContent = `
<html>
<head>
<title>${channel.name} Transcript</title>
<style>
body { font-family: Arial; background:#111; color:#fff; padding:20px; }
.msg { margin-bottom:10px; padding:8px; background:#222; border-radius:6px; }
.author { font-weight:bold; color:#4ea1ff; }
.time { font-size:12px; color:#aaa; }
</style>
</head>
<body>
<h2>Transcript: ${channel.name}</h2>
${messageHtml}
</body>
</html>
`;

const fileName = `${channel.name}.html`;

const transcriptsDir = path.join(process.cwd(), "transcripts");

// ✅ Create transcripts folder if missing
if (!fs.existsSync(transcriptsDir)) {
  fs.mkdirSync(transcriptsDir, { recursive: true });
}

const filePath = path.join(transcriptsDir, fileName);

fs.writeFileSync(filePath, htmlContent);
  

  const transcriptURL = `https://fbi-team-roblox.onrender.com/transcripts/${fileName}`;

  // Remove open ticket record
  for (const [key, value] of openTickets.entries()) {
    if (value === channel.id) openTickets.delete(key);
  }

  await channel.setParent(CLOSED_CATEGORY_ID);

  const staffChannel = await client.channels.fetch(STAFF_CHANNEL_ID);

  await staffChannel.send(`📜 Ticket closed: ${transcriptURL}`);

  const ticketOwner = channel.permissionOverwrites.cache
    .filter(p => p.allow.has("ViewChannel") && p.id !== interaction.guild.roles.everyone.id)
    .first();

  if (ticketOwner) {
    try {
      const user = await client.users.fetch(ticketOwner.id);
      await user.send(`📜 Your ticket transcript: ${transcriptURL}`);
    } catch {}
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("reopen_ticket")
      .setLabel("Reopen")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("delete_ticket")
      .setLabel("Delete")
      .setStyle(ButtonStyle.Danger)
  );

  await channel.send({
    content: "Staff: Reopen or delete this ticket?",
    components: [row]
  });
}
      

      // REOPEN
      if (interaction.customId === "reopen_ticket") {
        await interaction.channel.setParent(SUPPORT_CATEGORY_ID);
        await interaction.reply({ content: "Ticket reopened.", ephemeral: true });
      }

      // DELETE
      if (interaction.customId === "delete_ticket") {
        await interaction.reply({ content: "Deleting ticket...", ephemeral: true });
        setTimeout(() => interaction.channel.delete(), 3000);
      }
    }

    // ==============================
    // MODAL SUBMISSION
    // ==============================
    if (interaction.isModalSubmit()) {

  const reason = interaction.fields.getTextInputValue("ticket_reason");
  const isSupport = interaction.customId.includes("support");

  const type = isSupport ? "support" : "management";
  const category = isSupport ? SUPPORT_CATEGORY_ID : MANAGEMENT_CATEGORY_ID;
  const color = isSupport ? 0xffffff : 0x3498db;

  const STAFF_ROLE_ID = "1148217586513891399";   // 🔁 replace
  const ADMIN_ROLE_ID = "1147821682405417041";   // 🔁 replace
      
  // 🚫 Prevent Duplicate Tickets
  const existing = openTickets.get(`${interaction.user.id}-${type}`);
  if (existing) {
    return interaction.reply({
      content: `❌ You already have an open ${type} ticket: <#${existing}>`,
      ephemeral: true
    });
  }
  // 🔐 Permission Setup
  const permissionOverwrites = [
    {
      id: interaction.guild.roles.everyone,
      deny: ["ViewChannel"]
    },
    {
      id: interaction.user.id,
      allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"]
    },
    {
      id: interaction.client.user.id,
      allow: ["ViewChannel", "SendMessages", "ManageChannels", "ReadMessageHistory"]
    },
    {
      id: ADMIN_ROLE_ID,
      allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"]
    }
  ];
      
  // Support ticket → Staff can see
  if (isSupport) {
    permissionOverwrites.push({
      id: STAFF_ROLE_ID,
      allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"]
    });
  }
      
  const channel = await interaction.guild.channels.create({
    name: `${type}-${interaction.user.username}`,
    parent: category,
    permissionOverwrites: [
      {
        id: interaction.guild.roles.everyone,
        deny: ["ViewChannel"]
      },
      {
        id: interaction.user.id,
        allow: ["ViewChannel", "SendMessages"]
      }
    ]
  });

  openTickets.set(`${interaction.user.id}-${type}`, channel.id);

      //---------- help setup-------
  const mainEmbed = new EmbedBuilder()
    .setColor(color)
    .setDescription(
`Staff will be with you shortly.

**Please also describe the help you need right now, so that it will be easy and quick for our Team to respond to your ticket.**

To close this ticket click on the button with 🔒`
    );

  const reasonEmbed = new EmbedBuilder()
    .setColor(0x000000)
    .setTitle("Ticket Reason")
    .setDescription(reason);

  const closeRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("close_ticket")
      .setLabel("Close")
      .setEmoji("🔒")
      .setStyle(ButtonStyle.Danger)
  );

  await channel.send({
    content: `<@${interaction.user.id}>`,
    embeds: [mainEmbed, reasonEmbed],
    components: [closeRow]
  });

  await interaction.reply({
    content: `✅ Ticket created: ${channel}`,
    ephemeral: true
  });
}

    client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId === "help_new") {

    const embed = new EmbedBuilder()
      .setColor(0xffffff)
      .setTitle("New Here?")
      .setDescription(
`New members need to understand that this is **NOT** a private server roleplay community. Our community roleplays in Tier 2 or 3 servers. But occasionally we do training in private servers for old and new members, as if you do good in those training you will be one step closer to promotion.

# Public Information

> **•** You can get some information on the suspects through our website below.
> **Link :** [Wanted Reports](https://agentk0081.github.io/FBI-TEAM-ROBLOX2/)

> **•** Information about members and Divisions:
> **Link :** [FBI TEAM ROBLOX](https://agentk0081.github.io/FBI_TEAM_ROBLOX/)

> **•** ERLC criminal database:
> **Link :** [Database affiliated to Mafias](https://himfbi.github.io/ERLC-Criminal-Database)

> **•** Organized Crime Rings:
> **Link :** [Organized Crime Rings](https://himfbi.github.io/Organized-Crime-Ring/)`
      )
      .setImage("https://cdn.discordapp.com/attachments/1375355821688492103/1472230526453547170/Untitled.png?ex=69951cc6&is=6993cb46&hm=776648655c5e1d5ef8e9bc39e38e46afe908ffbe2932da0311e195ebd56bf3de&") // replace
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  if (interaction.customId === "help_verify") {

    const embed = new EmbedBuilder()
      .setColor(0x57f287) // Green
      .setTitle("How to Join and verify?")
      .setDescription(
`To join is very simple. Click below to join our Roblox group:

***Link :*** [Click here](https://www.roblox.com/communities/14942189/FBI-TEAM-ROBLOX#!/about)

**But for promotion you need to be active in Tier 3 servers.**

**How to verify?**

[Click here](https://discord.com/channels/1147660361303072789/1163480516054503424/1163765339465732116)`
      )
      .setImage("https://cdn.discordapp.com/attachments/1375355821688492103/1473189519967653918/FBINeedYou.png?ex=69954e28&is=6993fca8&hm=344d039b4c248f40f9da2c11ddae52840af09df8eb65a46c43045192169648de&")
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  if (interaction.customId === "help_promote") {

    const embed = new EmbedBuilder()
      .setColor(0xed4245) // Red
      .setTitle("How to get promoted?")
      .setDescription(
`To get promoted you need to be active and be on-duty with other agents or do shifts by using Trident bot using \`/shift manage\`.

You can increase promotion chance by joining trainings.

**How does training work?**
Trainings are hosted in private ERLC servers. It involves driving, chasing, PIT maneuvering, shooting and more.

After training, agents can leave or go on shift together in Tier 3 server.`
      )
      .setImage("https://cdn.discordapp.com/attachments/1375355821688492103/1473151331047837738/1055751841_2534724415_1717252334504.png?ex=69952a97&is=6993d917&hm=57a8b2a4a2be476b555eacf5d1cdadadaa2beb27e7617f3725ca181edcb029ef&")
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  if (interaction.customId === "help_staff") {

    const embed = new EmbedBuilder()
      .setColor(0x5865f2) // Dark Blue
      .setTitle("How to be Staff?")
      .setDescription(
`You can only be staff after completing an application and being accepted.

Applications open only when needed and will be announced.

**Requirements**
• Be 16+  
• Good English  
• Active for 3+ months  
• Humble and friendly`
      )
      .setImage("https://cdn.discordapp.com/attachments/1375355821688492103/1472480419365519508/0F663E29-23D8-44D7-B9F3-F57C501B4BCB.jpg?ex=6994b401&is=69936281&hm=d4743381fe6ca891a47f594cf4e7b2afadcbcfc1a836b00ac17e9f765fff3e51&")
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
});
    

  });
          }
        
