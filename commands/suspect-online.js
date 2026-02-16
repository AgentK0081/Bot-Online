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

// Cache for user IDs (prevents repeated API calls)
const userIdCache = new Map();

export default {
  data: new SlashCommandBuilder()
    .setName("suspect-online")
    .setDescription("Check which suspects are currently online in Roblox"),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const onlineUsers = [];
      const universeCache = new Map();

      // 1️⃣ Get User IDs (with caching to reduce API calls)
      let userIds = [];
      const uncachedUsernames = [];

      // Check cache first
      for (const username of SUSPECT_USERNAMES) {
        if (userIdCache.has(username)) {
          userIds.push(userIdCache.get(username));
        } else {
          uncachedUsernames.push(username);
        }
      }

      // Fetch uncached users in batches of 100 (Roblox API limit)
      if (uncachedUsernames.length > 0) {
        const batchSize = 100;
        for (let i = 0; i < uncachedUsernames.length; i += batchSize) {
          const batch = uncachedUsernames.slice(i, i + batchSize);

          try {
            const userRes = await fetch("https://users.roblox.com/v1/usernames/users", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                usernames: batch,
                excludeBannedUsers: false
              })
            });

            if (!userRes.ok) {
              console.error(`User API error: ${userRes.status}`);
              continue;
            }

            const userData = await userRes.json();
            
            if (userData.data && userData.data.length > 0) {
              for (const user of userData.data) {
                userIdCache.set(user.name, user.id); // Cache the result
                userIds.push(user.id);
              }
            }

            // Small delay between batches to avoid rate limiting
            if (i + batchSize < uncachedUsernames.length) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          } catch (err) {
            console.error("Error fetching user batch:", err);
          }
        }
      }

      if (userIds.length === 0) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xff0000)
              .setTitle("❌ Error")
              .setDescription("No valid Roblox users found.")
              .setTimestamp()
          ]
        });
      }

      // Remove duplicates
      userIds = [...new Set(userIds)];

      // 2️⃣ Check presence for users in batches of 100 (API limit)
      const presenceBatchSize = 100;
      let allPresences = [];

      for (let i = 0; i < userIds.length; i += presenceBatchSize) {
        const batch = userIds.slice(i, i + presenceBatchSize);

        try {
          const presenceRes = await fetch("https://presence.roblox.com/v1/presence/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userIds: batch })
          });

          // Handle rate limiting
          if (presenceRes.status === 429) {
            return interaction.editReply({
              embeds: [
                new EmbedBuilder()
                  .setColor(0xffa500)
                  .setTitle("⏳ Rate Limited")
                  .setDescription("Roblox is rate limiting requests. Please try again in a few seconds.")
                  .setTimestamp()
              ]
            });
          }

          if (!presenceRes.ok) {
            console.error(`Presence API error: ${presenceRes.status}`);
            continue;
          }

          const presenceData = await presenceRes.json();
          
          if (presenceData.userPresences && presenceData.userPresences.length > 0) {
            allPresences = allPresences.concat(presenceData.userPresences);
          }

          // Small delay between batches
          if (i + presenceBatchSize < userIds.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (err) {
          console.error("Error fetching presence batch:", err);
        }
      }

      if (allPresences.length === 0) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xff0000)
              .setTitle("⚠ API Error")
              .setDescription("Unable to fetch presence data from Roblox. Please try again later.")
              .setTimestamp()
          ]
        });
      }

      // 3️⃣ Process online users
      for (const presence of allPresences) {
        // userPresenceType: 0 = Offline, 1 = Online (website), 2 = In Game, 3 = In Studio
        if (presence.userPresenceType !== 2 && presence.userPresenceType !== 3) {
          continue;
        }

        // Find username from cache
        const username = [...userIdCache.entries()]
          .find(([name, id]) => id === presence.userId)?.[0];

        if (!username) continue;

        let gameName = presence.userPresenceType === 3 ? "Roblox Studio" : "Unknown Game";
        let gameLink = null;

        // Only fetch game details if they're in-game (not studio)
        if (presence.userPresenceType === 2 && presence.placeId) {
          gameLink = `https://www.roblox.com/games/${presence.placeId}`;

          if (universeCache.has(presence.placeId)) {
            gameName = universeCache.get(presence.placeId);
          } else {
            try {
              // Fetch game name with timeout
              const universeRes = await Promise.race([
                fetch(`https://apis.roblox.com/universes/v1/places/${presence.placeId}/universe`),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
              ]);

              const universeData = await universeRes.json();

              if (universeData.universeId) {
                const gameRes = await Promise.race([
                  fetch(`https://games.roblox.com/v1/games?universeIds=${universeData.universeId}`),
                  new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
                ]);

                const gameData = await gameRes.json();

                if (gameData.data && gameData.data[0]) {
                  gameName = gameData.data[0].name;
                  universeCache.set(presence.placeId, gameName);
                }
              }
            } catch (err) {
              console.log(`Game fetch failed for ${presence.placeId}:`, err.message);
              // Keep gameName as "Unknown Game"
            }
          }
        }

        onlineUsers.push({
          username: username,
          game: gameName,
          link: gameLink,
          status: presence.userPresenceType === 3 ? "🔧 In Studio" : "🎮 In Game"
        });
      }

      // 4️⃣ Send results
      if (onlineUsers.length === 0) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(0x22c55e)
              .setTitle("✅ All Clear")
              .setDescription(`No suspects are currently online.\n\n**Total suspects monitored:** ${SUSPECT_USERNAMES.length}`)
              .setTimestamp()
              .setFooter({ text: "FBI TEAM ROBLOX" })
          ]
        });
      }

      // Create embed with online users
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("🚨 Suspects Currently Online")
        .setDescription(
          onlineUsers
            .map(user => {
              if (user.link) {
                return `• **${user.username}**\n  ${user.status}: [${user.game}](${user.link})`;
              } else {
                return `• **${user.username}**\n  ${user.status}: ${user.game}`;
              }
            })
            .join("\n\n")
        )
        .setFooter({ 
          text: `${onlineUsers.length} suspect(s) online • FBI TEAM ROBLOX` 
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.error("Fatal error in suspect-online command:", err);
      
      // Try to send error message
      try {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xff0000)
              .setTitle("❌ Error")
              .setDescription("An unexpected error occurred while checking Roblox presence. Please try again later.")
              .setTimestamp()
          ]
        });
      } catch (replyErr) {
        console.error("Failed to send error message:", replyErr);
      }
    }
  }
};
