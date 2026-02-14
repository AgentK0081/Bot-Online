import {
  SlashCommandBuilder,
  EmbedBuilder
} from "discord.js";

import fetch from "node-fetch";

// 🔴 PUT YOUR ROBLOX USERNAMES HERE
const SUSPECT_USERNAMES = [
  "Username1",
  "Username2",
  "Username3"
];

export default {
  data: new SlashCommandBuilder()
    .setName("suspect-online")
    .setDescription("Check which suspects are currently online in Roblox"),

  async execute(interaction) {

    await interaction.deferReply();

    try {
      // 1️⃣ Convert usernames to user IDs
      const userIdRes = await fetch("https://users.roblox.com/v1/usernames/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usernames: SUSPECT_USERNAMES,
          excludeBannedUsers: false
        })
      });

      const userIdData = await userIdRes.json();

      if (!userIdData.data || userIdData.data.length === 0) {
        return interaction.editReply("❌ No valid Roblox users found.");
      }

      const userIds = userIdData.data.map(u => u.id);

      // 2️⃣ Check presence
      const presenceRes = await fetch("https://presence.roblox.com/v1/presence/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds })
      });

      const presenceData = await presenceRes.json();

      // 3️⃣ Filter online users
      const onlineUsers = presenceData.userPresences.filter(u =>
        u.userPresenceType === 2 // 2 = In Game
      );

      if (onlineUsers.length === 0) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xff0000)
              .setTitle("🔎 Suspect Status")
              .setDescription("No suspects are currently in-game.")
              .setTimestamp()
          ]
        });
      }

      // Match back to usernames
      const onlineNames = onlineUsers.map(u => {
        const match = userIdData.data.find(d => d.id === u.userId);
        return match ? match.username : `UserID: ${u.userId}`;
      });

      const embed = new EmbedBuilder()
        .setColor(0xffffff)
        .setTitle("🚨 Suspects Currently Online")
        .setDescription(onlineNames.map(name => `• ${name}`).join("\n"))
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.error(err);
      await interaction.editReply("❌ Failed to check Roblox presence.");
    }
  }
};
                                                                  
