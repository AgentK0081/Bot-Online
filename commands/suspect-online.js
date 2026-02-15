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

  await interaction.deferReply({ fetchReply: true });

  try {

    let onlineUsers = [];

    for (const username of SUSPECT_USERNAMES) {

      // Convert username → userId
      const userRes = await fetch("https://users.roblox.com/v1/usernames/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usernames: [username],
          excludeBannedUsers: false
        })
      });

      const userData = await userRes.json();

      if (!userData.data || !userData.data[0]) continue;

      const userId = userData.data[0].id;

      // Check presence ONE BY ONE
const presenceRes = await fetch("https://presence.roblox.com/v1/presence/users", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ userIds: [userId] })
});

const presenceData = await presenceRes.json();

if (!presenceData.userPresences) continue;

const presence = presenceData.userPresences[0];

if (presence.userPresenceType === 2 || presence.userPresenceType === 3) {

  let gameName = "Unknown Game";
  let gameLink = null;

  // If universeId exists, fetch real game info
if (presence.universeId) {
  try {
    const gameRes = await fetch(
      `https://games.roblox.com/v1/games?universeIds=${presence.universeId}`
    );

    const gameData = await gameRes.json();

    if (gameData.data && gameData.data[0]) {
      gameName = gameData.data[0].name;
      gameLink = `https://www.roblox.com/games/${presence.placeId}`;
    }

  } catch (err) {
    console.log("Game info fetch failed");
  }
}


  onlineUsers.push({
    username,
    game: gameName,
    link: gameLink
  });
}

// Small delay to avoid rate limit
await new Promise(resolve => setTimeout(resolve, 200));
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
  onlineUsers.map(user => {
    if (user.link) {
      return `• **${user.username}**\n  🎮 Playing: [${user.game}](${user.link})`;
    } else {
      return `• **${user.username}**\n  🎮 Playing: ${user.game}`;
    }
  }).join("\n\n")
)

      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

  } catch (err) {
    console.error("Roblox Error:", err);

    if (!interaction.replied) {
      await interaction.editReply("❌ Failed to check Roblox presence.");
    }
  }
}
};
