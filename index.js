const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const youtubedl = require('youtube-dl-exec')
const ffmpeg = require('fluent-ffmpeg');
const qrcode = require('qrcode-terminal');
const moment = require('moment-timezone');
const colors = require('colors');
const fs = require('fs');
const PImage = require('pureimage');
const wordwrap = require('wordwrapjs');


const client = new Client({
    restartOnAuthFail: true,
    puppeteer: {
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    },
    authStrategy: new LocalAuth({ clientId: "client" })
});

const config = require('./config/config.json');
const template = "./files/template_msg.png";
const filepath = "./files/output.png";
const font = PImage.registerFont("./files/arial_bold.ttf","ArialBlack",);
const menu = fs.readFileSync("./files/menu.txt");

function getTextWidth(text, font) {
    // if given, use cached canvas for better performance
    // else, create new canvas
    var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    var context = canvas.getContext("2d");
    context.font = font;
    var metrics = context.measureText(text);
    return metrics.width;
};

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

    let quotedMsg;

    let Chat;

    try {
        
        if (message.hasQuotedMsg) {
            if (message.body.includes(".s") || message.body.includes(".quote") || message.body.includes(".reveal")) {
                quotedMsg = await message.getQuotedMessage();
                if (quotedMsg.timestamp == undefined) {
                    throw new Error("Couldn't retrieve message due to it being too old");
                }
            }
            
        } else {
            
        }
        
    } catch (Error) {
        console.log(Error);
        message.body = "0"
        message.react("🚫");
    }
    
    Chat = await message.getChat();

    if (message.body == ".s" && Chat.isGroup) {
        if (message.type == "image" | message.type == "video") {
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
        } else if (message.hasQuotedMsg) {
            const quotedMsg = await message.getQuotedMessage();
            if (quotedMsg.type == "image" | quotedMsg.type == "video") {
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
    } else if (message.body.substring(0,6) == ".quote" && Chat.isGroup && message.hasQuotedMsg) {
        const quotedMsg = await message.getQuotedMessage(); 
        if (quotedMsg.type == "chat" && message.body == ".quote") {
            try {
                Chat.sendStateTyping();
                const authorID = await quotedMsg.getContact();
                const msgTime = message.timestamp * 1000;
                var d = new Date(msgTime);
                const hours = d.getHours();
                const minutes = d.getMinutes();
                const time = hours + ":" + String(minutes).padStart(2, "0");
                let msgAuthor;
                msgAuthor = authorID.pushname;
                if (msgAuthor == undefined) {
                    message.react("❌");
                    Chat.clearState();
                    return
                }
                const msgBody = quotedMsg.body;
                const maxLength = 21;
                let partOne = " ";
                let partTwo = " ";
                let partThree = " ";



                const warpedText = wordwrap.wrap(msgBody, { width: maxLength });
                const splitText = warpedText.split("\n");

                if (splitText[0] != undefined) {
                    partOne = splitText[0];

                    if (splitText[1] != undefined) {
                        partTwo = splitText[1];

                        if (splitText[2] != undefined) {
                            partThree = splitText[2];

                        }
                    }
                }

                font.load(() => {
                    PImage.decodePNGFromStream(fs.createReadStream(template)).then((img) => {
                        const ctx = img.getContext("2d");
                        ctx.fillStyle = "#9a9af1";
                        ctx.font = "36pt ArialBlack";
                        ctx.fillText(msgAuthor, 50, 210);
                        ctx.fillStyle = "#ffffff";
                        ctx.font = "36pt Arial";
                        ctx.fillText(partOne, 50, 260, 440);
                        ctx.fillText(partTwo, 50, 295, 440);     
                        ctx.fillText(partThree, 50, 330, 440);
                        ctx.fillStyle = "#95B7B9";
                        ctx.font = "24pt Arial";
                        ctx.fillText(time, 420, 340);
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
            } catch {
                Chat.clearState();
                message.react("❌");
            }
        } else if (quotedMsg.type == "chat" && message.body != ".quote") {

            try {
                let msgAuthor;
                Chat.sendStateTyping();

                if (message.body.substring(7,8) == "-") {
                    msgAuthor = " ";
                } else {
                    msgAuthor = message.body.substring(7);
                }

                const msgBody = quotedMsg.body;
                const maxLength = 21;
                let partOne = " ";
                let partTwo = " ";
                let partThree = " ";

                

                const warpedText = wordwrap.wrap(msgBody, { width: maxLength });
                const splitText = warpedText.split("\n");

                if (splitText[0] != undefined) {
                    partOne = splitText[0];

                    if (splitText[1] != undefined) {
                        partTwo = splitText[1];

                        if (splitText[2] != undefined) {
                            partThree = splitText[2];

                        }
                    }
                }

                font.load(() => {
                    PImage.decodePNGFromStream(fs.createReadStream(template)).then((img) => {
                        const ctx = img.getContext("2d");
                        ctx.fillStyle = "#9a9af1";
                        ctx.font = "36pt ArialBlack";
                        ctx.fillText(msgAuthor, 50, 210);
                        ctx.fillStyle = "#ffffff";
                        ctx.fillText(partOne, 50, 260, 440);
                        ctx.fillText(partTwo, 50, 295, 440);     
                        ctx.fillText(partThree, 50, 330, 440);
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
            } catch {
                Chat.clearState();
                message.react("❌");
            }
        } else {
            message.react("❌");
        }
    } else if (message.body.substring(0,9) == ".download" && Chat.isGroup) {
        const url = message.body.substring(10);
        try{
            await youtubedl(url, {output: "vid.%(ext)s", paths: "./files/", writeInfoJson: true, noCheckCertificates: true, noWarnings: true, maxFilesize: "60M"});
            jsonFile = fs.readFileSync("./files/vid.info.json");
            jsonData = JSON.parse(jsonFile)
            await client.sendMessage(message.from, MessageMedia.fromFilePath("./files/vid." + jsonData.ext), { sendMediaAsDocument: false });
            fs.unlinkSync("./files/vid." + jsonData.ext);
            fs.unlinkSync("./files/vid.info.json");
        } catch (err) {
            try {
                await client.sendMessage(message.from, MessageMedia.fromFilePath("./files/vid." + jsonData.ext), { sendMediaAsDocument: true });
                fs.unlinkSync("./files/vid." + jsonData.ext);
                fs.unlinkSync("./files/vid.info.json");
            } catch (err) {
                console.log(err)
            message.react("❌");
            }
            console.log(err)
            message.react("❌");
        }
        
        
    } else if (message.body == ".menu" && Chat.isGroup) {
        client.sendMessage(message.from, menu.toString());
        
    } else {
        client.getChatById(message.id.remote).then(async (chat) => {
            await chat.sendSeen();
        });
    }
});

client.initialize();
