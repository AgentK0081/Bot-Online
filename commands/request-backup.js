import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} from "discord.js";

const ALLOWED_ROLE_ID = "1154426882117349436";
const BACKUP_CHANNEL_ID = "1471752564361003118";
const PING_ROLE_ID = "1471752101557305516";

const cooldowns = new Map();
const COOLDOWN_TIME = 10 * 60 * 1000; // 10 minutes

export default {
  data: new SlashCommandBuilder()
    .setName("request-backup")
    .setDescription("Request backup in ER:LC")
    .addStringOption(option =>
      option
        .setName("tier")
        .setDescription("Select backup tier")
        .setRequired(true)
        .addChoices(
          { name: "Tier 1", value: "1" },
          { name: "Tier 2", value: "2" },
          { name: "Tier 3", value: "3" }
        )
    )
    .addIntegerOption(option =>
      option
        .setName("server")
        .setDescription("Server number")
        .setRequired(true)
    ),

  async execute(interaction) {

    // 🔒 Role Restriction
    if (!interaction.member.roles.cache.has(ALLOWED_ROLE_ID)) {
      return interaction.reply({
        content: "❌ You are not allowed to use this command.",
        ephemeral: true
      });
    }

    const now = Date.now();
    const userCooldown = cooldowns.get(interaction.user.id);

    // ⏳ Cooldown Check
    if (userCooldown && now < userCooldown) {
      const remaining = Math.ceil((userCooldown - now) / 60000);
      return interaction.reply({
        content: `⏳ You must wait ${remaining} more minute(s) before requesting backup again.`,
        ephemeral: true
      });
    }

    cooldowns.set(interaction.user.id, now + COOLDOWN_TIME);

    const tier = interaction.options.getString("tier");
    const server = interaction.options.getInteger("server");

    const backupChannel = await interaction.guild.channels.fetch(BACKUP_CHANNEL_ID);

    const embed = new EmbedBuilder()
      .setColor(0xffffff)
      .setTitle("⚠️ | Backup Request")
      .setDescription(
`Agent ${interaction.user} has requested backup in ER:LC, Tier ${tier} Server ${server}. Join up and help him out!`
      )
      .setTimestamp();

    // Send ping message + embed
    const message = await backupChannel.send({
      content: `<@&${PING_ROLE_ID}>`,
      embeds: [embed]
    });

    // React with ✅
    await message.react("✅");

    await interaction.reply({
      content: "✅ Backup request sent successfully.",
      ephemeral: true
    });
  }
};

