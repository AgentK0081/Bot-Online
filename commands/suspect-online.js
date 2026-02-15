import {
  SlashCommandBuilder,
  EmbedBuilder
} from "discord.js";

const SUSPECT_USERNAMES = [
  "Builderman", "ItsWillian", "ExploitBan", "Akori4e", "LUKE_R2D2",
  "UhOkayz", "001vvs", "Ikhebeenhond10", "darkvader_47", "Flo010709",
  "Hamim234", "Oaudyi", "Visttula", "ShaneBarf", "LCCDeveloper",
  "hamim234", "De3pr", "ddhied", "Aadrit456", "Earleeue",
  "ninjayush934", "alessandrotto02", "LifeHackeriscool", "SUPTUENES",
  "BILLYBUTCHER_EXE", "sa1nteus", "matula2000", "cxnnor_bsbl217",
  "20Colian10", "LucyTheSleepy", "Valdek33", "Trungdeptryy06",
  "tinsell99", "Doggie3337", "WhoaThatsDak", "Nichthias",
  "IVAN091006", "4EVfaf", "Dinopod1234", "AwesomEngineer01",
  "gew117123", "TheMiner127", "Eric2active", "xmaxy830",
  "rxeul", "xzcqnv", "ma3qiii", "IIIIIIIIIIIIIIII",
  "OfficerJamesWithTase", "TupolevTu4", "whippypiee",
  "JitteryRet", "NinjaWolf249", "Vindhaevn",
  "EliteERLCRoleplayer", "S1rAvia", "H4nn4h_IsBetter"
];

export default {
  data: new SlashCommandBuilder()
    .setName("suspect-online")
    .setDescription("Check which suspects are currently online in Roblox"),

  async execute(interaction) {

    await interaction.deferReply();

    try {
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

      function chunkArray(array, size) {
        const result = [];
        for (let i = 0; i < array.length; i += size) {
          result.push(array.slice(i, i + size));
        }
        return result;
      }

      const chunks = chunkArray(userIds, 100);
      let onlineUsers = [];

      for (const chunk of chunks) {

        const presenceRes = await fetch("https://presence.roblox.com/v1/presence/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds: chunk })
        });

        const presenceData = await presenceRes.json();

        if (!presenceData.userPresences) continue;

        const onlineChunk = presenceData.userPresences.filter(u =>
          u.userPresenceType === 2 || u.userPresenceType === 3
        );

        onlineUsers.push(...onlineChunk);
      }

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
      console.error("Roblox Presence Error:", err);
      await interaction.editReply("❌ Failed to check Roblox presence.");
    }
  }
};
