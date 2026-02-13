import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ticketpanel")
    .setDescription("Send the ticket panel")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),


  async execute(interaction) {

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle("<:BotTicketing:1471067812322738370> Support Ticket")
      .setDescription(
`**Need help with something? Create a ticket to contact the staff team and they would help you out!**

**•** **<:SupportTicket:1471067818425319474> Support Ticket**
> Create a support ticket if you want to report someone or something. Or if you have any general questions.

**•** **<:ManagementTicket:1471067815870992510> Management Ticket**
> Create a management ticket if you want to report a staff or if you have something important to say to the management.
-----------------`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("support_ticket")
        .setLabel("Support Ticket")
        .setEmoji("1471067818425319474")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("management_ticket")
        .setLabel("Management Ticket")
        .setEmoji("1471067815870992510")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }
};

