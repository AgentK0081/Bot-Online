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
  const user = interaction.user;

  await interaction.reply({ content: "Closing ticket and generating transcript...", ephemeral: true });

  // FETCH ALL MESSAGES
  let messages = [];
  let lastId;

  while (true) {
    const fetched = await channel.messages.fetch({
      limit: 100,
      before: lastId
    });

    if (fetched.size === 0) break;

    messages.push(...fetched.values());
    lastId = fetched.last().id;
  }

  // Sort oldest first
  messages = messages.reverse();

  // CREATE TRANSCRIPT TEXT
  const transcript = messages.map(msg => {
    return `[${msg.createdAt.toLocaleString()}] ${msg.author.tag}: ${msg.content}`;
  }).join("\n");

  const buffer = Buffer.from(transcript, "utf-8");

  // SEND TO STAFF LOG CHANNEL
  try {
    const staffChannel = await client.channels.fetch(STAFF_CHANNEL_ID);

    await staffChannel.send({
      content: `📜 Transcript for ${channel.name}`,
      files: [{
        attachment: buffer,
        name: `${channel.name}-transcript.txt`
      }]
    });
  } catch (err) {
    console.error("Failed to send transcript to staff:", err);
  }

  // DM USER
  try {
    await user.send({
      content: `📜 Here is the transcript for your ticket: ${channel.name}`,
      files: [{
        attachment: buffer,
        name: `${channel.name}-transcript.txt`
      }]
    });
  } catch (err) {
    console.error("Could not DM user transcript.");
  }

  // MOVE TO CLOSED CATEGORY
  await channel.setParent(CLOSED_CATEGORY_ID);

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

  // 🚫 Prevent Duplicate Tickets
  const existing = openTickets.get(`${interaction.user.id}-${type}`);
  if (existing) {
    return interaction.reply({
      content: `❌ You already have an open ${type} ticket: <#${existing}>`,
      ephemeral: true
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


  });
          }
        
