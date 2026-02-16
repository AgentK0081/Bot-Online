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

      let onlineUsers = [];
      const universeCache = new Map();

      // 1️⃣ Convert ALL usernames at once
      const userRes = await fetch("https://users.roblox.com/v1/usernames/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usernames: SUSPECT_USERNAMES,
          excludeBannedUsers: false
        })
      });

      const userData = await userRes.json();
      if (!userData.data || userData.data.length === 0)
        return interaction.editReply("❌ No valid Roblox users found.");

      const userIds = [...new Set(userData.data.map(u => u.id))];


      // 2️⃣ Check presence for ALL users at once
      const presenceRes = await fetch("https://presence.roblox.com/v1/presence/users", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ userIds })
});

if (presenceRes.status === 429) {
  return interaction.editReply("⏳ Roblox is rate limiting. Try again in a few seconds.");
}

if (!presenceRes.ok) {
  console.log("Presence status:", presenceRes.status);
  return interaction.editReply("⚠ Roblox API temporarily blocked the request.");
}

      

      const presenceData = await presenceRes.json();
      if (!presenceData.userPresences)
        return interaction.editReply("⚠ Roblox API blocked the request. Try again.");

      for (const presence of presenceData.userPresences) {

        if (presence.userPresenceType !== 2 && presence.userPresenceType !== 3)
          continue;

        const userMatch = userData.data.find(u => u.id === presence.userId);
        if (!userMatch) continue;

        let gameName = "Unknown Game";
        let gameLink = null;

        if (presence.placeId) {

          gameLink = `https://www.roblox.com/games/${presence.placeId}`;

          if (universeCache.has(presence.placeId)) {
            gameName = universeCache.get(presence.placeId);
          } else {
            try {
              const universeRes = await fetch(
                `https://apis.roblox.com/universes/v1/places/${presence.placeId}/universe`
              );
              const universeData = await universeRes.json();

              if (universeData.universeId) {
                const gameRes = await fetch(
                  `https://games.roblox.com/v1/games?universeIds=${universeData.universeId}`
                );
                const gameData = await gameRes.json();

                if (gameData.data && gameData.data[0]) {
                  gameName = gameData.data[0].name;
                  universeCache.set(presence.placeId, gameName);
                }
              }
            } catch (err) {
              console.log("Game fetch failed:", err);
            }
          }
        }

        onlineUsers.push({
          username: userMatch.username,
          game: gameName,
          link: gameLink
        });
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

      const embed = new EmbedBuilder()
        .setColor(0xffffff)
        .setTitle("🚨 Suspects Currently Online")
        .setDescription(
          onlineUsers.map(user =>
            user.link
              ? `• **${user.username}**\n  🎮 Playing: [${user.game}](${user.link})`
              : `• **${user.username}**\n  🎮 Playing: ${user.game}`
          ).join("\n\n")
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.error(err);
      await interaction.editReply("❌ Failed to check Roblox presence.");
    }
  }
};
          
