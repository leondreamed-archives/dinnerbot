require('dotenv').config();

const Discord = require("discord.js");
const { Intents } = Discord;
const client = new Discord.Client();
const axios = require("axios");
const { loadImage, createCanvas } = require("canvas");
const sharp = require('sharp');
const FormData = require('form-data');

/*
TODO: Instead of the user's ID, retrieve them by name
const intents = new Intents(Intents.NON_PRIVILEGED);
intents.add("GUILD_MEMBERS");
 */

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", async (message) => {
  if (message.content.startsWith("!dinner")) {
    const userId = message.content.slice(7);

    const server = await client.guilds.fetch(process.env.DISCORD_SERVER_ID);
    console.log(userId);
    const member = await server.members.fetch(userId);

    if (member == null) return;
    const avatarUrl = member.user.displayAvatarURL();
    const response = await axios.get(avatarUrl, {
      responseType: "arraybuffer",
    });

    const avatarBuffer = Buffer.from(response.data, "binary");
    const pngAvatarBuffer = await sharp(avatarBuffer).toFormat('png').toBuffer()
    const avatarBase64 = pngAvatarBuffer.toString('base64');

    const avatarImage = await loadImage(`data:image/png;base64,${avatarBase64}`);
    const dinnerImage = await loadImage('dinner.png');

    const scale = 0.2;
    const avatarScale = 3;

    const dinnerWidth = dinnerImage.width * scale;
    const dinnerHeight = dinnerImage.height * scale;
    const avatarWidth = avatarImage.width * scale * avatarScale;
    const avatarHeight = avatarImage.height * scale * avatarScale;

    const canvas = createCanvas(dinnerWidth, dinnerHeight);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(dinnerImage, 0, 0, dinnerWidth, dinnerHeight);
    ctx.drawImage(avatarImage, dinnerWidth / 2 - avatarWidth / 2, dinnerHeight / 2 - avatarHeight / 2, avatarWidth, avatarHeight);

    const mergedBase64 = canvas.toDataURL().replace('data:image/png;base64,', '');

    const form = new FormData();
    form.append('image', mergedBase64);

    const apiKey = process.env.IMG_BB_API_KEY;
    try {
      const avatarResponse = await axios.post(`https://api.imgbb.com/1/upload?key=${apiKey}`, form, {
        headers: form.getHeaders()
      });
      const imageUrl = avatarResponse.data.data.url;
      await message.channel.send("Dinner's ready!", {files: [imageUrl]});
    } catch (e) {
      console.error(e);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
