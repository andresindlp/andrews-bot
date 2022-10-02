const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const ffmpeg = require('fluent-ffmpeg');
const qrcode = require('qrcode-terminal');
const moment = require('moment-timezone');
const colors = require('colors');
const fs = require('fs');
const PImage = require('pureimage');


const client = new Client({
    restartOnAuthFail: true,
    puppeteer: {
        headless: true,
        args: [ '--no-sandbox', '--disable-setuid-sandbox' ]
    },
    authStrategy: new LocalAuth({ clientId: "client" })
});

const config = require('./config/config.json');
const template = "./files/template_msg.png";
const filepath = "./files/output.png";
const font = PImage.registerFont("./files/arial_bold.ttf","ArialBlack");

client.on('qr', (qr) => {
    console.log(`[${moment().tz(config.timezone).format('HH:mm:ss')}] Scan the QR below : `);
    qrcode.generate(qr, { small: true });
});
 
client.on('ready', () => {
    console.clear();
    const consoleText = './config/console.txt';
    fs.readFile(consoleText, 'utf-8', (err, data) => {
        if (err) {
            console.log(`[${moment().tz(config.timezone).format('HH:mm:ss')}] Console Text not found!`.yellow);
            console.log(`[${moment().tz(config.timezone).format('HH:mm:ss')}] ${config.name} Bot's ready!`.green);
        } else {
            console.log(data.green);
            console.log(`[${moment().tz(config.timezone).format('HH:mm:ss')}] ${config.name} Bot's ready!`.green);
        }
    })
});

client.on('message', async (message) => {
    const Chat = await message.getChat();
    if (message.body == ".s" && Chat.isGroup) {
        if (message.type == "image") {
            try {
                Chat.sendStateTyping();
                const media = await message.downloadMedia();
                client.sendMessage(message.from, media, {
                    sendMediaAsSticker: true,
                    stickerName: config.name, // Sticker Name = Edit in 'config/config.json'
                    stickerAuthor: `made with andrew's bot` // Sticker Author = Your Whatsapp BOT Number
                }).then(() => {
                    Chat.clearState();
                    message.react("✅");
                });
            } catch {
                Chat.clearState();
                message.react("❌");
            }
        }
        else if (message.hasQuotedMsg) {
            const quotedMsg = await message.getQuotedMessage();
            if (quotedMsg.type == "image") {
                try {
                    Chat.sendStateTyping()
                    const media = await quotedMsg.downloadMedia();
                    client.sendMessage(message.from, media, {
                        sendMediaAsSticker: true,
                        stickerName: config.name, // Sticker Name = Edit in 'config/config.json'
                        stickerAuthor: `made with andrew's bot` // Sticker Author = Your Whatsapp BOT Number
                    }).then(() => {
                        Chat.clearState();
                        quotedMsg.react("✅");
                        message.react("✅");
                    });
                } catch {
                    Chat.clearState();
                    message.react("❌");
                }
            } else if (quotedMsg.type == "sticker") {
                try {
                    Chat.sendStateTyping()
                    const media = await quotedMsg.downloadMedia();
                    client.sendMessage(message.from, media).then(() => {
                        Chat.clearState();
                        quotedMsg.react("✅");
                        message.react("✅");
                    });
                } catch {
                    Chat.clearState();
                    message.react("❌");
                }
            } else {
                message.react("❌");
            }
        }
        else {
            message.react("❌");
        }
    } else if (message.body == ".reveal" && Chat.isGroup && message.hasQuotedMsg)  {
        const quotedMsg = await message.getQuotedMessage();
        if (quotedMsg.type == "image") {
            try {
                Chat.sendStateTyping();
                const media = await quotedMsg.downloadMedia();
                client.sendMessage(message.from, media).then(() => {
                    Chat.clearState();
                    quotedMsg.react("✅");
                    message.react("✅");
                });
            } catch {
                Chat.clearState();
                message.react("❌");
            }
        }
    } else if (message.body == ".quote" && Chat.isGroup && message.hasQuotedMsg) {
        const quotedMsg = await message.getQuotedMessage();
        if (true) {
            /* try { */
                Chat.sendStateTyping();
                const authorID = await quotedMsg.getContact();
                const msgAuthor = authorID.pushname;
                const msgBody = quotedMsg.body;
                const maxLength = 20;
                let partOne = " ";
                let partTwo = " ";
                let partThree = " ";

                if (msgBody.length >= maxLength) {
                    partOne = msgBody.substring(0,maxLength);
                    partTwo = msgBody.substring(maxLength, maxLength*2);
                    
                    if (msgBody.length >= maxLength*2) {
                        partThree = msgBody.substring(maxLength*2, maxLength*3);
                    }
                    
                } else {
                    partOne = msgBody
                }

                font.load(() => {
                    PImage.decodePNGFromStream(fs.createReadStream(template)).then((img) => {
                        const ctx = img.getContext("2d");
                        ctx.fillStyle = "#9a9af1";
                        ctx.font = "36pt ArialBlack";
                        ctx.fillText(msgAuthor, 50, 210);
                        ctx.fillStyle = "#ffffff";
                        ctx.fillText(partOne, 50, 260);
                        ctx.fillText(partTwo, 50, 295);     
                        ctx.fillText(partThree, 50, 330);
                        PImage.encodePNGToStream(img, fs.createWriteStream(filepath)).then(()=>{
                            const media = MessageMedia.fromFilePath(filepath);
                            client.sendMessage(message.from, media, {
                                sendMediaAsSticker: true,
                                stickerName: config.name, // Sticker Name = Edit in 'config/config.json'
                                stickerAuthor: `made with andrew's bot` // Sticker Author = Your Whatsapp BOT Number
                            }).then(() => {
                                Chat.clearState();
                                quotedMsg.react("✅");
                                message.react("✅");
                            });
                        });
                    });
                });
            /* } catch {
                Chat.clearState();
                message.react("❌");
            } */
        } else {
            message.react("❌");
        }
    } else {
        client.getChatById(message.id.remote).then(async (chat) => {
            await chat.sendSeen();
        });
    }
});

client.initialize();
