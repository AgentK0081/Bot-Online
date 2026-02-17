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
      .setImage("https://cdn.discordapp.com/attachments/1375355821688492103/1472480419365519508/0F663E29-23D8-44D7-B9F3-F57C501B4BCB.jpg?ex=6994b401&is=69936281&hm=d4743381fe6ca891a47f594cf4e7b2afadcbcfc1a836b00ac17e9f765fff3e51&") // replace
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
