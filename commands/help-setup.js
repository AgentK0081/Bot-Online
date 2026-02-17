import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  PermissionFlagsBits
} from "discord.js";

const ALLOWED_ROLE_ID = "1147821682405417041"; // 🔁 replace this

export default {
  data: new SlashCommandBuilder()
    .setName("help-setup")
    .setDescription("Setup the help panel")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // hides from normal users

  async execute(interaction) {

    // 🔐 Extra Role Check (stronger protection)
    if (!interaction.member.roles.cache.has(ALLOWED_ROLE_ID)) {
      return interaction.reply({
        content: "❌ You are not allowed to use this command.",
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0xffffff)
      .setTitle("Help Panel")
      .setDescription(
        `Hey 👋, how can we help you?\n\n` +
        `> **This help panel can provide you with basic information about the community and how things work here.**`
      )
      .setImage("IMAGE_LINK_MAIN") // replace
      .setTimestamp();

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("help_menu")
      .setPlaceholder("Select a help topic...")
      .addOptions([
        {
          label: "I am New Here",
          value: "new",
          description: "Information for new members",
          emoji: "👋"
        },
        {
          label: "How to Join and get Verified",
          value: "verify",
          description: "Join and verification process",
          emoji: "✅"
        },
        {
          label: "How to get Promoted",
          value: "promote",
          description: "Promotion system explained",
          emoji: "📈"
        },
        {
          label: "How to be Staff",
          value: "staff",
          description: "Staff requirements",
          emoji: "🛡️"
        }
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }
};
