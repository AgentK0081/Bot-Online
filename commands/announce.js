import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} from "discord.js";

const COLORS = {
  red: 0xff0000,
  blue: 0x3498db,
  green: 0x2ecc71,
  yellow: 0xf1c40f,
  white: 0xffffff
};

export default {
  data: new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Send an announcement (plain or embed)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // 🔒 Admin only
    .addStringOption(option =>
      option
        .setName("type")
        .setDescription("Announcement type")
        .setRequired(true)
        .addChoices(
          { name: "Plain", value: "plain" },
          { name: "Embed", value: "embed" }
        )
    )
    .addStringOption(option =>
      option.setName("text").setDescription("Message text")
    )
    .addStringOption(option =>
      option.setName("title").setDescription("Embed title")
    )
    .addStringOption(option =>
      option.setName("author").setDescription("Embed author")
    )
    .addStringOption(option =>
      option.setName("thumbnail-url").setDescription("Embed thumbnail URL")
    )
    .addStringOption(option =>
      option.setName("image-url").setDescription("Embed image URL")
    )
    .addStringOption(option =>
      option.setName("footer").setDescription("Embed footer text")
    )
    .addStringOption(option =>
      option.setName("embed-url").setDescription("Embed clickable URL")
    )
    .addStringOption(option =>
      option
        .setName("color")
        .setDescription("Embed color")
        .addChoices(
          { name: "Red", value: "red" },
          { name: "Blue", value: "blue" },
          { name: "Green", value: "green" },
          { name: "Yellow", value: "yellow" },
          { name: "White", value: "white" }
        )
    ),

  async execute(interaction) {
    const type = interaction.options.getString("type");
    const text = interaction.options.getString("text");

    // --- PLAIN ---
    if (type === "plain") {
      if (!text) {
        return interaction.reply({
          content: "❌ Text is required for a plain announcement.",
          ephemeral: true
        });
      }

      return interaction.reply({ content: text });
    }

    // --- EMBED ---
    const embed = new EmbedBuilder();

    const title = interaction.options.getString("title");
    const author = interaction.options.getString("author");
    const thumbnail = interaction.options.getString("thumbnail-url");
    const image = interaction.options.getString("image-url");
    const footer = interaction.options.getString("footer");
    const url = interaction.options.getString("embed-url");
    const colorKey = interaction.options.getString("color");

    if (title) embed.setTitle(title);
    if (text) embed.setDescription(text);
    if (author) embed.setAuthor({ name: author });
    if (thumbnail) embed.setThumbnail(thumbnail);
    if (image) embed.setImage(image);
    if (footer) embed.setFooter({ text: footer });
    if (url) embed.setURL(url);

    embed.setColor(COLORS[colorKey] ?? 0x2b2d31);

    return interaction.reply({ embeds: [embed] });
  }
};
      
