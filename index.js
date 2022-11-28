const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const youtubedl = require('youtube-dl-exec')
const ffmpeg = require('fluent-ffmpeg');
const colors = require('colors');
const qrcode = require('qrcode-terminal');
const moment = require('moment-timezone');
const fs = require('fs');
const PImage = require('pureimage');
const wordwrap = require('wordwrapjs');
const googleTTS = require("node-google-tts-api");

const tts = new googleTTS();


const client = new Client({
    restartOnAuthFail: true,
    puppeteer: {
        headless: true,
        args: [ '--no-sandbox', '--disable-setuid-sandbox' ]
    },
    authStrategy: new LocalAuth({ clientId: "client" })
});

const config = require('./config/config.json');
const secret = require("./config/secrets.json");
const template = "./files/template_msg.png";
const filepath = "./files/output.png";
const font = PImage.registerFont("./files/arial_bold.ttf","ArialBlack",);
const menu = fs.readFileSync("./files/menu.txt");
var msg;


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

    let Chat;
    
    Chat = await message.getChat();
    if (Chat.isGroup) {
        if (message.body.substring(0,2) == ".s") {

            // if it's quoting a message, use that message
            if (message.hasQuotedMsg) {
                msg = await message.getQuotedMessage()
            } else {
                msg = message
            }
            
            // create the sticker
            if (msg.type == "image" | msg.type == "video") {
                try {
                    Chat.sendStateTyping();
                    const media = await msg.downloadMedia();
                    client.sendMessage(message.from, media, {
                        sendMediaAsSticker: true,
                        stickerName: config.name, // Sticker Name = Edit in 'config/config.json'
                        stickerAuthor: `made with andrew's bot` // Sticker Author = Your Whatsapp BOT Number
                    }).then(() => {
                        Chat.clearState();
                        msg.react("✅");
                    });
                } catch {
                    Chat.clearState();
                    message.react("❌");
                    msg.react("❌");
                }
            } else if (msg.type == "sticker") {
                    try {
                        Chat.sendStateTyping()
                        const media = await msg.downloadMedia();
                        client.sendMessage(message.from, media).then(() => {
                            Chat.clearState();
                            msg.react("✅");
                        });
                    } catch {
                        Chat.clearState();
                        message.react("❌");
                        msg.react("❌");
                    }
            } else {
                message.react("❌");
            }
        } else if (message.body.substring(0,7) == ".reveal" && message.hasQuotedMsg)  {
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
        } else if (message.body.substring(0,6) == ".quote" && message.hasQuotedMsg) {
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
        /* } else if (message.body.substring(0,9) == ".download") {
            Chat.sendStateRecording();
            const url = message.body.substring(10);
            try{
                await youtubedl(url, {output: "vid.%(ext)s", paths: "./files/", writeInfoJson: true, noCheckCertificates: true, noWarnings: true, maxFilesize: "60M"});
                jsonFile = fs.readFileSync("./files/vid.info.json");
                jsonData = JSON.parse(jsonFile)
                await client.sendMessage(message.from, MessageMedia.fromFilePath("./files/vid." + jsonData.ext), { sendMediaAsDocument: false });
                fs.unlinkSync("./files/vid." + jsonData.ext);
                fs.unlinkSync("./files/vid.info.json");
                message.react("✅");
                Chat.clearState();
            } catch (err) {
                try {
                    await client.sendMessage(message.from, MessageMedia.fromFilePath("./files/vid." + jsonData.ext), { sendMediaAsDocument: true });
                    fs.unlinkSync("./files/vid." + jsonData.ext);
                    fs.unlinkSync("./files/vid.info.json");
                    message.react("🟠");
                    Chat.clearState();
                } catch (err) {
                    console.log(err)
                message.react("❌");
                Chat.clearState();
                }
            }
            
          */   
        } else if (message.body.substring(0,4) == ".tts"){
            Chat.sendStateRecording()
            const textToSpeech = message.body.substring(5)
            try {
                await tts.get({
                    text: String(textToSpeech),
                    lang: "es"
                }).then(data => {
                    fs.writeFileSync("./files/audio.mp3", data)
                })
        
                await client.sendMessage(message.from, MessageMedia.fromFilePath("./files/audio.mp3"));
                message.react("✅");
    
                fs.unlinkSync("./files/audio.mp3")
            } catch (err) {
                console.log(err)
                message.react("❌");
            }
            
        } else if (message.body == ".menu") {
            client.sendMessage(message.from, menu.toString());
            
        } else {
            client.getChatById(message.id.remote).then(async (chat) => {
                await chat.sendSeen();
            });
        }
    } else {
        var contact = await Chat.getContact()
        var parametros = message.body.split(" ")
        if (contact.number == secret.admin && parametros[0] == ".join") {
            try {
                var link = parametros[1].split("/")
                await client.acceptInvite(link[3])
                message.react("✅");
            } catch (e) {
                console.log (e)
                message.react("❌");
            }
        }
    }
    
});

client.initialize();