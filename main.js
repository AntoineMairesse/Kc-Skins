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

async function mask() {

    const image = await Jimp.read('test.png');
    const watermark = await Jimp.read('mask.png');

    image.composite(watermark, 0, 0, {
        mode: Jimp.BLEND_SOURCE_OVER
    })
    await image.writeAsync('masked.png');

    await Jimp.read('masked.png').then(image => {
        const targetColor = { r: 0, g: 255, b: 0, a: 255 }; // Color you want to replace
        const replaceColor = { r: 0, g: 0, b: 0, a: 0 }; // Color you want to replace with
        const colorDistance = (c1, c2) => Math.sqrt(Math.pow(c1.r - c2.r, 2) + Math.pow(c1.g - c2.g, 2) + Math.pow(c1.b - c2.b, 2) + Math.pow(c1.a - c2.a, 2)); // Distance between two colors
        const threshold = 32; // Replace colors under this threshold. The smaller the number, the more specific it is.
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
            const thisColor = {
                r: image.bitmap.data[idx + 0],
                g: image.bitmap.data[idx + 1],
                b: image.bitmap.data[idx + 2],
                a: image.bitmap.data[idx + 3]
            };
            if (colorDistance(targetColor, thisColor) <= threshold) {
                image.bitmap.data[idx + 0] = replaceColor.r;
                image.bitmap.data[idx + 1] = replaceColor.g;
                image.bitmap.data[idx + 2] = replaceColor.b;
                image.bitmap.data[idx + 3] = replaceColor.a;
            }
        });
        image.write('test.png');
    });
}

async function crop(message) {
    if (sizeOf('test.png').height == 32) {
        let watermark = await Jimp.read("test.png");
        const image = await Jimp.read('blank.png');

        image.composite(watermark, 0, 0, {
            mode: Jimp.BLEND_SOURCE_OVER
        })
        await image.writeAsync('test.png');
    }

    await mask()

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