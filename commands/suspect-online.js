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

// Cache to store placeId -> game name mappings
const universeCache = new Map();

export default {
  data: new SlashCommandBuilder()
    .setName("suspect-online")
    .setDescription("Check which suspects are currently online in Roblox"),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      let onlineUsers = [];

      // 1️⃣ Convert usernames to user IDs
      console.log('Fetching user IDs...');
      const userRes = await fetch("https://users.roblox.com/v1/usernames/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usernames: SUSPECT_USERNAMES,
          excludeBannedUsers: false
        })
      });

      if (!userRes.ok) {
        console.error('User fetch failed:', userRes.status);
        return interaction.editReply("❌ Failed to fetch user data from Roblox.");
      }

      const userData = await userRes.json();
      if (!userData.data || userData.data.length === 0) {
        return interaction.editReply("❌ No valid Roblox users found.");
      }

      const userIds = [...new Set(userData.data.map(u => u.id))];
      console.log(`Found ${userIds.length} valid users`);

      // 2️⃣ Check presence for all users
      console.log('Checking presence...');
      const presenceRes = await fetch("https://presence.roblox.com/v1/presence/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds })
      });

      if (presenceRes.status === 429) {
        return interaction.editReply("⏳ Roblox is rate limiting. Try again in a few seconds.");
      }

      if (!presenceRes.ok) {
        console.error('Presence fetch failed:', presenceRes.status);
        return interaction.editReply("⚠️ Roblox API temporarily blocked the request.");
      }

      const presenceData = await presenceRes.json();
      if (!presenceData.userPresences) {
        return interaction.editReply("⚠️ Failed to get presence data. Try again.");
      }

      console.log(`Got presence data for ${presenceData.userPresences.length} users`);

      // 3️⃣ Process each online user
      for (const presence of presenceData.userPresences) {
        // userPresenceType: 0 = Offline, 1 = Online (website), 2 = In Game, 3 = In Studio
        if (presence.userPresenceType !== 2 && presence.userPresenceType !== 3) {
          continue;
        }

        const userMatch = userData.data.find(u => u.id === presence.userId);
        if (!userMatch) continue;

        let gameName = "Unknown Game";
        let gameLink = null;
        let status = "🎮 In Game";

        // Handle Studio users separately
        if (presence.userPresenceType === 3) {
          gameName = "Roblox Studio";
          status = "🔧 In Studio";
          gameLink = null;
        } 
        // Handle In-Game users
        else if (presence.userPresenceType === 2 && presence.placeId) {
          gameLink = `https://www.roblox.com/games/${presence.placeId}`;

          // Check cache first
          if (universeCache.has(presence.placeId)) {
            gameName = universeCache.get(presence.placeId);
            console.log(`Using cached name for placeId ${presence.placeId}: ${gameName}`);
          } else {
            // Fetch game name
            try {
              console.log(`Fetching game name for placeId: ${presence.placeId}`);
              
              // Step 1: Get universeId from placeId
              const universeRes = await fetch(
                `https://apis.roblox.com/universes/v1/places/${presence.placeId}/universe`,
                { headers: { "Accept": "application/json" } }
              );

              if (!universeRes.ok) {
                console.error(`Universe API failed for placeId ${presence.placeId}:`, universeRes.status);
                throw new Error(`Universe API returned ${universeRes.status}`);
              }

              const universeData = await universeRes.json();
              console.log(`Universe data:`, universeData);

              if (universeData && universeData.universeId) {
                // Step 2: Get game name from universeId
                const gameRes = await fetch(
                  `https://games.roblox.com/v1/games?universeIds=${universeData.universeId}`,
                  { headers: { "Accept": "application/json" } }
                );

                if (!gameRes.ok) {
                  console.error(`Games API failed for universeId ${universeData.universeId}:`, gameRes.status);
                  throw new Error(`Games API returned ${gameRes.status}`);
                }

                const gameData = await gameRes.json();
                console.log(`Game data:`, gameData);

                if (gameData && gameData.data && gameData.data[0] && gameData.data[0].name) {
                  gameName = gameData.data[0].name;
                  universeCache.set(presence.placeId, gameName);
                  console.log(`✓ Found game name: ${gameName}`);
                } else {
                  console.warn(`No game name in response for placeId ${presence.placeId}`);
                }
              } else {
                console.warn(`No universeId for placeId ${presence.placeId}`);
              }

              // Small delay to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 100));

            } catch (err) {
              console.error(`Game fetch failed for ${userMatch.username}:`, err.message);
              // Keep gameName as "Unknown Game"
            }
          }
        }

        onlineUsers.push({
          username: userMatch.username,
          game: gameName,
          link: gameLink,
          status: status
        });
      }

      // 4️⃣ Send results
      if (onlineUsers.length === 0) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(0x22c55e)
              .setTitle("✅ All Clear")
              .setDescription(`No suspects are currently online.\n\n**Monitored:** ${SUSPECT_USERNAMES.length} suspects`)
              .setTimestamp()
              .setFooter({ text: "FBI TEAM ROBLOX" })
          ]
        });
      }

      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("🚨 Suspects Currently Online")
        .setDescription(
          onlineUsers.map(user => {
            if (user.link) {
              return `• **${user.username}**\n  ${user.status}: [${user.game}](${user.link})`;
            } else {
              return `• **${user.username}**\n  ${user.status}: ${user.game}`;
            }
          }).join("\n\n")
        )
        .setFooter({ 
          text: `${onlineUsers.length} suspect(s) online • FBI TEAM ROBLOX` 
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      console.log(`✓ Command completed. Found ${onlineUsers.length} online suspects.`);

    } catch (err) {
      console.error('Fatal error:', err);
      
      try {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xff0000)
              .setTitle("❌ Error")
              .setDescription(`Failed to check Roblox presence.\n\`\`\`${err.message}\`\`\``)
              .setTimestamp()
          ]
        });
      } catch (replyErr) {
        console.error("Failed to send error message:", replyErr);
      }
    }
  }
};
