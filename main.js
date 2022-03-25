import DiscordJS, { Intents, MessageAttachment } from 'discord.js'
import images from 'images'
import fs from 'fs'
import * as c from 'https'
import FormData from 'form-data';
import fetch from 'node-fetch';
import path from 'path'
import sharp from 'sharp'
import sizeOf from 'image-size'
import Jimp from 'jimp';
import dotenv from 'dotenv';

dotenv.config();

function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        c.get(url, (res) => {
            if (res.statusCode === 200) {
                res.pipe(fs.createWriteStream(filepath))
                    .on('error', reject)
                    .once('close', () => resolve(filepath));
            } else {
                // Consume response data to free up memory
                res.resume();
                reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));

            }
        });
    });
}

const client = new DiscordJS.Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGES,
    ]
})

client.on('ready', () => {
    console.log('Ready')
})

async function crop(message) {
    if (sizeOf('test.png').height == 32) {
        let watermark = await Jimp.read("test.png");
        const image = await Jimp.read('blank.png');

        image.composite(watermark, 0, 0, {
            mode: Jimp.BLEND_SOURCE_OVER
        })
        await image.writeAsync('test.png');
    }

    let watermark = await Jimp.read("1.png");

    const image = await Jimp.read('test.png');

    image.composite(watermark, 0, 0, {
        mode: Jimp.BLEND_SOURCE_OVER
    })
    await image.writeAsync('output.png');
    message.reply({ files: ['./output.png'] });
}

client.on('messageCreate', (message) => {

    if (message.author.id != "956883002728783945" && (message.channelId == "794516327887929357" || message.channelId == "956130485711564820")) {
        if (message.attachments.first() != undefined) {
            try { fs.unlinkSync('test.png') } catch (err) {}
            downloadImage(message.attachments.first().url, 'test.png').then(() => {
                crop(message);
            })

        }
    }
})

client.login(process.env.DISCORD_TOKEN);