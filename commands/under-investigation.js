import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} from "discord.js";

const STAFF_LOG_CHANNEL_ID = "1267429976509124659";
const INVESTIGATION_ROLE_ID = "1278339908012085289";

export default {
  data: new SlashCommandBuilder()
    .setName("under-investigation")
    .setDescription("Mark a user as under investigation and DM them")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("User to mark under investigation")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("alt-main")
        .setDescription("Roblox alt/main username")
        .setRequired(true)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser("user");
    const robloxUsername = interaction.options.getString("alt-main");

    const member = await interaction.guild.members.fetch(targetUser.id);

    // ---- ROLE ADD ----
    try {
      await member.roles.add(INVESTIGATION_ROLE_ID);
    } catch (err) {
      return interaction.reply({
        content: "❌ I couldn't add the role. Check role hierarchy.",
        ephemeral: true
      });
    }

    // ---- DM EMBED ----
    const dmEmbed = new EmbedBuilder()
      .setTitle("🚫 | Blocked / Under Investigation")
      .setDescription(
        `You are put under investigation due to you are suspected to be a alt account / you are wanted by the FBI by the username of **${robloxUsername}**.\n\n` +

        `**• This is not a ban, kick, or timeout:**\n` +
        `Your current situation does not involve being banned, kicked, or timed out from the server.\n\n` +

        `**• You can request to get unblocked:**\n` +
        `If you believe there has been an issue, contact moderators or admins.\n\n` +

        `**• <:Apps:1356291029707522188> Appeal for unban or review a kick:**\n` +
        `[Kick/Ban Form](https://dyno.gg/form/5da6eee3)\n\n` +

        `**Disclaimer**\n` +
        `-# This message is not from real-life FBI. It is from ` +
        `[FBI TEAM ROBLOX](https://www.roblox.com/communities/14942189/FBI-TEAM-ROBLOX#!/about)`
      )
      .setColor(0xff0000)
      .setFooter({
        text: "If this is a mistake please DM AgentK_0081 or reply to this message."
      });

    try {
      await targetUser.send({ embeds: [dmEmbed] });
    } catch {
      // DM closed — still continue
    }

    // ---- STAFF LOG ----
    const logEmbed = new EmbedBuilder()
      .setTitle("🚨 User Placed Under Investigation")
      .setColor(0xff0000)
      .addFields(
        { name: "Staff", value: interaction.user.tag, inline: true },
        { name: "User", value: targetUser.tag, inline: true },
        { name: "Roblox Username", value: robloxUsername }
      )
      .setTimestamp();

    try {
      const logChannel = await interaction.client.channels.fetch(
        STAFF_LOG_CHANNEL_ID
      );
      if (logChannel) {
        logChannel.send({ embeds: [logEmbed] });
      }
    } catch (err) {
      console.error("Failed to log investigation:", err);
    }

    return interaction.reply({
      content: `✅ **${targetUser.tag}** is now under investigation.`,
      ephemeral: true
    });
  }
};
