import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("help-setup")
    .setDescription("Setup the help panel"),

  async execute(interaction) {

    // MAIN PANEL EMBED
    const panelEmbed = new EmbedBuilder()
      .setColor(0xffffff)
      .setTitle("Help Panel")
      .setDescription(
        `Hey 👋, how can we help you?\n\n` +
        `> **This help panel can provide you with basic information about the community and how things work here.**`
      )
      .setImage("https://cdn.discordapp.com/attachments/1375355821688492103/1472480419365519508/0F663E29-23D8-44D7-B9F3-F57C501B4BCB.jpg?ex=6994b401&is=69936281&hm=d4743381fe6ca891a47f594cf4e7b2afadcbcfc1a836b00ac17e9f765fff3e51&") // <-- replace
      .setTimestamp();

    // BUTTONS
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("help_new")
        .setLabel("I am New Here")
        .setStyle(ButtonStyle.Secondary), // White

      new ButtonBuilder()
        .setCustomId("help_verify")
        .setLabel("How to Join and get Verified")
        .setStyle(ButtonStyle.Success), // Green

      new ButtonBuilder()
        .setCustomId("help_promote")
        .setLabel("How to get Promoted")
        .setStyle(ButtonStyle.Danger), // Red

      new ButtonBuilder()
        .setCustomId("help_staff")
        .setLabel("How to be Staff")
        .setStyle(ButtonStyle.Primary) // Dark Blue
    );

    await interaction.reply({
      embeds: [panelEmbed],
      components: [row]
    });
  }
};

