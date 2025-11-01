const { Client, GatewayIntentBits, Events, REST, Routes, SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const TOKEN = process.env.TOKEN;
const PASTEBIN_KEY = process.env.PASTEBIN_API_KEY;

// Register /script command once the bot is ready
client.once(Events.ClientReady, async (c) => {
  console.log(`✅ Logged in as ${c.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(TOKEN);
  const command = new SlashCommandBuilder()
    .setName('script')
    .setDescription('Upload a Lua script to Pastebin');

  try {
    await rest.put(
      Routes.applicationCommands(c.user.id),
      { body: [command.toJSON()] }
    );
    console.log('✅ Slash command registered!');
} catch (err) {
  console.error("Pastebin error:", err.response ? err.response.data : err.message);
  await interaction.followUp(`❌ Error uploading to Pastebin:\n\`\`\`${err.response ? err.response.data : err.message}\`\`\``);
}

});

// Handle /script command
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === 'script') {
    await interaction.reply('🧠 Please send your Lua script as your **next message**. You have 60 seconds.');

    const filter = (m) => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 60000, max: 1 });

    collector.on('collect', async (msg) => {
      const code = msg.content;
      try {
        const response = await axios.post('https://pastebin.com/api/api_post.php', null, {
          params: {
            api_dev_key: PASTEBIN_KEY,
            api_option: 'paste',
            api_paste_code: code,
            api_paste_name: `${interaction.user.username}'s Script`,
            api_paste_private: 1,
            api_paste_format: 'lua'
          }
        });

        await msg.delete().catch(() => {});
        await interaction.followUp(`✅ Your Lua script has been uploaded!\n📎 ${response.data}`);
      } catch (err) {
        await interaction.followUp('❌ Error uploading to Pastebin.');
        console.error(err);
      }
    });

    collector.on('end', (collected) => {
      if (collected.size === 0) {
        interaction.followUp('⌛ You didn’t send a message in time.');
      }
    });
  }
});

client.login(TOKEN);
