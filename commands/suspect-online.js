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

// Cache to reduce API calls
const universeCache = new Map();
const userIdCache = new Map();

export default {
  data: new SlashCommandBuilder()
    .setName("suspect-online")
    .setDescription("Check which suspects are currently online in Roblox"),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      let onlineUsers = [];

      // 1️⃣ Get User IDs (with caching)
      console.log('Step 1: Fetching user IDs...');
      
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

      // Fetch uncached users in batches of 100
      if (uncachedUsernames.length > 0) {
        const batchSize = 100;
        for (let i = 0; i < uncachedUsernames.length; i += batchSize) {
          const batch = uncachedUsernames.slice(i, i + batchSize);

          try {
            const userRes = await fetch("https://users.roblox.com/v1/usernames/users", {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
              },
              body: JSON.stringify({
                usernames: batch,
                excludeBannedUsers: false
              })
            });

            if (!userRes.ok) {
              console.error(`❌ User API error: ${userRes.status}`);
              continue;
            }

            const userData = await userRes.json();
            
            if (userData.data && userData.data.length > 0) {
              for (const user of userData.data) {
                userIdCache.set(user.name, user.id);
                userIds.push(user.id);
              }
            }

            // Delay between batches
            if (i + batchSize < uncachedUsernames.length) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          } catch (err) {
            console.error("Error fetching user batch:", err.message);
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
      console.log(`✓ Found ${userIds.length} valid user IDs`);

      // 2️⃣ Check presence in smaller batches (50 at a time to avoid 400 error)
      console.log('Step 2: Checking presence...');
      
      const presenceBatchSize = 50;
      let allPresences = [];

      for (let i = 0; i < userIds.length; i += presenceBatchSize) {
        const batch = userIds.slice(i, i + presenceBatchSize);

        try {
          console.log(`Checking batch ${Math.floor(i/presenceBatchSize) + 1}/${Math.ceil(userIds.length/presenceBatchSize)}`);
          
          const presenceRes = await fetch("https://presence.roblox.com/v1/presence/users", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify({ userIds: batch })
          });

          console.log(`Presence API response: ${presenceRes.status}`);

          // Handle rate limiting
          if (presenceRes.status === 429) {
            console.log("⏳ Rate limited, waiting 5 seconds...");
            await new Promise(resolve => setTimeout(resolve, 5000));
            i -= presenceBatchSize; // Retry this batch
            continue;
          }

          // Handle bad request
          if (presenceRes.status === 400) {
            const errorText = await presenceRes.text();
            console.error(`❌ 400 Error: ${errorText}`);
            
            // Try with smaller batch (10 at a time)
            console.log("Retrying with batch size of 10...");
            for (let j = 0; j < batch.length; j += 10) {
              const smallBatch = batch.slice(j, j + 10);
              try {
                const retryRes = await fetch("https://presence.roblox.com/v1/presence/users", {
                  method: "POST",
                  headers: { 
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                  },
                  body: JSON.stringify({ userIds: smallBatch })
                });

                if (retryRes.ok) {
                  const retryData = await retryRes.json();
                  if (retryData.userPresences) {
                    allPresences = allPresences.concat(retryData.userPresences);
                  }
                }

                await new Promise(resolve => setTimeout(resolve, 300));
              } catch (err) {
                console.error("Small batch retry failed:", err.message);
              }
            }
            continue;
          }

          if (!presenceRes.ok) {
            console.error(`❌ Presence API error: ${presenceRes.status}`);
            continue;
          }

          const presenceData = await presenceRes.json();
          
          if (presenceData.userPresences && presenceData.userPresences.length > 0) {
            allPresences = allPresences.concat(presenceData.userPresences);
            console.log(`✓ Got ${presenceData.userPresences.length} presences`);
          }

          // Delay between batches
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (err) {
          console.error("Error fetching presence batch:", err.message);
        }
      }

      if (allPresences.length === 0) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xffa500)
              .setTitle("⚠️ API Issue")
              .setDescription("Unable to fetch presence data from Roblox. The API may be temporarily unavailable.")
              .setTimestamp()
          ]
        });
      }

      console.log(`✓ Total presences collected: ${allPresences.length}`);

      // 3️⃣ Process online users
      console.log('Step 3: Processing online users...');
      
      for (const presence of allPresences) {
        // userPresenceType: 0 = Offline, 1 = Online (website), 2 = In Game, 3 = In Studio
        if (presence.userPresenceType !== 2 && presence.userPresenceType !== 3) {
          continue;
        }

        // Find username from cache
        const username = [...userIdCache.entries()]
          .find(([name, id]) => id === presence.userId)?.[0];

        if (!username) continue;

        let gameName = "Unknown Game";
        let gameLink = null;
        let status = "🎮 In Game";

        // Handle Studio
        if (presence.userPresenceType === 3) {
          gameName = "Roblox Studio";
          status = "🔧 In Studio";
        } 
        // Handle In-Game
        else if (presence.userPresenceType === 2 && presence.placeId) {
          gameLink = `https://www.roblox.com/games/${presence.placeId}`;

          if (universeCache.has(presence.placeId)) {
            gameName = universeCache.get(presence.placeId);
          } else {
            try {
              const universeRes = await Promise.race([
                fetch(`https://apis.roblox.com/universes/v1/places/${presence.placeId}/universe`, {
                  headers: { "Accept": "application/json" }
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
              ]);

              if (universeRes.ok) {
                const universeData = await universeRes.json();

                if (universeData.universeId) {
                  const gameRes = await Promise.race([
                    fetch(`https://games.roblox.com/v1/games?universeIds=${universeData.universeId}`, {
                      headers: { "Accept": "application/json" }
                    }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
                  ]);

                  if (gameRes.ok) {
                    const gameData = await gameRes.json();

                    if (gameData.data && gameData.data[0]) {
                      gameName = gameData.data[0].name;
                      universeCache.set(presence.placeId, gameName);
                    }
                  }
                }
              }
            } catch (err) {
              console.log(`Game fetch failed for ${username}: ${err.message}`);
            }
          }
        }

        onlineUsers.push({
          username: username,
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
              .setDescription(`No suspects are currently online.\n\n**Total suspects monitored:** ${SUSPECT_USERNAMES.length}`)
              .setTimestamp()
              .setFooter({ text: "FBI TEAM ROBLOX" })
          ]
        });
      }

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

      console.log(`✓ Command completed successfully. Found ${onlineUsers.length} online suspects.`);

    } catch (err) {
      console.error("❌ Fatal error:", err);
      
      try {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xff0000)
              .setTitle("❌ Error")
              .setDescription(`An error occurred:\n\`\`\`${err.message}\`\`\``)
              .setTimestamp()
          ]
        });
      } catch (replyErr) {
        console.error("Failed to send error message:", replyErr);
      }
    }
  }
};
