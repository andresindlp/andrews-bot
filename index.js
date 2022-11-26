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
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    },
    authStrategy: new LocalAuth({ clientId: "client" })
});

const config = require('./config/config.json');
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

    const Chat = await message.getChat();
    const req = message.body.split(" ");

    console.log(req[0])

    if (Chat.isGroup == false) {
        return undefined;
    }

    switch (req[0]) {
        case ".s":
        case ".sticker":
            
            // if it's quoting a message, use that message
            if (message.hasQuotedMsg) {msg = await message.getQuotedMessage()} else {msg = message}
            
            // create the sticker or image
            switch (msg.type) {
                case "video":
                case "image":
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
                case "sticker":
                    try {
                        Chat.sendStateTyping()
                        const media = await msg.downloadMedia();
                        client.sendMessage(message.from, media).then(() => {
                            Chat.clearState();
                            message.react("✅");
                        });
                    } catch {
                        Chat.clearState();
                        message.react("❌");
                        msg.react("❌");
                    }
                default:
                    message.react("❌");

            }
        case ".reveal":
        case ".r":
            
            // try to get the quoted msg, else exit case
            if (message.hasQuotedMsg) {msg = await message.getQuotedMessage()} else {message.react("❌"); break;}

            // main function
            switch (msg.type) {
                case "image":
                    try {
                        Chat.sendStateTyping();
                        const media = await msg.downloadMedia();
                        client.sendMessage(message.from, media).then(() => {
                            Chat.clearState();
                            msg.react("✅");
                            message.react("✅");
                        });
                    } catch {
                        Chat.clearState();
                        message.react("❌");
                    }
                default:
                    message.react("❌");
            }
            
        case ".q":
        case ".quote":

            // try to get the quoted msg, else exit case
            if (message.hasQuotedMsg) {msg = await message.getQuotedMessage()} else {message.react("❌"); break;}

            // if quoted message is not type=chat, exit
            if (msg.type != "chat") {message.react("❌"); break;}

            switch (req[1]) {
                default:
                    try {
                        Chat.sendStateTyping();
                        const authorID = await msg.getContact();
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
                        const msgBody = msg.body;
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
                                        msg.react("✅");
                                        message.react("✅");
                                    });
                                });
                            });
                        });
                    } catch {
                        Chat.clearState();
                        message.react("❌");
                    }
                case "-":
                case "":
                
            }


            if (msg.type == "chat") {
                
            } else if (msg.type == "chat" && message.body != ".quote") {
    
                try {
                    let msgAuthor;
                    Chat.sendStateTyping();
    
                    if (message.body.substring(7,8) == "-") {
                        msgAuthor = " ";
                    } else {
                        msgAuthor = message.body.substring(7);
                    }
    
                    const msgBody = msg.body;
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
                                    msg.react("✅");
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
        case ".d" | ".download":
        case ".tts" | ".texttospeech":
        case ".menu":
    }
    if (Chat.isGroup) {
        if (message.body.substring(0,2) == ".s") {


            
        } else if (message.body.substring(0,7) == ".reveal" && message.hasQuotedMsg)  {
            const msg = await message.getQuotedMessage();
            if (msg.type == "image") {
                
            }
        } else if (message.body.substring(0,6) == ".quote" && message.hasQuotedMsg) {
            
        } else if (message.body.substring(0,9) == ".download") {
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
    }
    
});

client.initialize();
