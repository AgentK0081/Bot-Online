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

        await interaction.channel.setParent(CLOSED_CATEGORY_ID);

        await interaction.reply({ content: "Ticket closed.", ephemeral: true });

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

        await interaction.channel.send({
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

      const category = isSupport ? SUPPORT_CATEGORY_ID : MANAGEMENT_CATEGORY_ID;
      const color = isSupport ? 0xffffff : 0x3498db;

      const channel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: category,
        permissionOverwrites: [
          {
            id: interaction.guild.roles.everyone,
            deny: [PermissionsBitField.Flags.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages
            ]
          }
        ]
      });

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
        content: `Your ticket has been created: ${channel}`,
        ephemeral: true
      });
    }

  });
          }
        
