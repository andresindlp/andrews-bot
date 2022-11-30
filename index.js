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
const editJsonFile = require("edit-json-file");

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
const secrets = require("./config/secrets.json");
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

    console.log(req.join(" "))

    // TO BE EXECUTED IN PRIVATE CHATS

    switch (req[0]) {
        case ".join":
            var contact = await Chat.getContact()
            if (contact.number == secrets.admin) {
                try {
                    console.log("1")
                    var link = req[1].split("/").slice(-1);
                    await client.acceptInvite(String(link));
                    message.react("✅");
                } catch (e) {
                    console.log(e)
                    message.react("❌");
                }
            }
    }

    // TO BE EXECUTED ONLY IN GROUPS

    if (Chat.isGroup == false) {
        return undefined;
    }

    var raw = fs.readFileSync("./config/banned.json")
    var db = JSON.parse(raw);
    var chatifcamefrom = message.from
    var bodyy = message.body
    var mediaa = message.mediaKey
    try {
        if (db[chatifcamefrom].includes(bodyy) || db[chatifcamefrom].includes(mediaa)) {
            await message.delete(true)
        }
    } catch (e) {
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
                    break;
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
                    break;
                default:
                    message.react("❌");
                    break;

            }
            break;
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
            break;
        case ".q":
        case ".quote":

            // try to get the quoted msg, else exit case
            if (message.hasQuotedMsg) {msg = await message.getQuotedMessage()} else {message.react("❌"); break;}

            // if quoted message is not type=chat, exit
            if (msg.type != "chat") {message.react("❌"); break;}



            switch (req[1]) {
                case undefined:
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
                        break;
                    } catch {
                        Chat.clearState();
                        message.react("❌");
                    }
                case "-":
                    try {
                        var msgAuthor = " ";
                        Chat.sendStateTyping();
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
                        break;
                    } catch {
                        Chat.clearState();
                        message.react("❌");
                    }
                default:
                    try {
                        var msgAuthor = req.slice(1).join(" ");
                        Chat.sendStateTyping();
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
                        break;
                    } catch {
                        Chat.clearState();
                        message.react("❌");
                    };
                
            };
            break;
        case ".tts":
        case ".texttospeech":
            switch (req[1]) {
                default:
                    var textToSpeech = req.slice(1).join(" ")
                    break;
                case undefined:
                    // try to get the quoted msg, else exit case
                    if (message.hasQuotedMsg) {msg = await message.getQuotedMessage()} else {message.react("❌"); break;}
                    // if quoted message is not type=chat, exit
                    if (msg.type != "chat") {message.react("❌"); break;}
                    
                    var textToSpeech = msg.body
                    break;
            }
            
            if (textToSpeech == undefined) {break}

            Chat.sendStateRecording()
            try {
                await tts.get({
                    text: String(textToSpeech),
                    lang: "es"
                }).then(data => {
                    fs.writeFileSync("./files/audio.mp3", data)
                })
        
                await client.sendMessage(message.from, MessageMedia.fromFilePath("./files/audio.mp3"));
                message.react("✅");
                Chat.clearState();
                fs.unlinkSync("./files/audio.mp3")
            } catch (err) {
                Chat.clearState();
                console.log(err);
                message.react("❌");
            }
            break;
        case ".menu":
            try {
                client.sendMessage(message.from, menu.toString());
                message.react("✅");
            } catch (e) {
                console.log(e);
                message.react("❌");
            }
            break;
        case ".ban":
            
            var group = message.from
            try {
                var msg = await message.getQuotedMessage()
                if (msg.type == "chat") {
                    var toBan = msg.body
                } else {
                    var toBan = msg.mediaKey
                }
            } catch (e) {
                console.log(e)
                message.react("❌");
            }
            try {
                if (toBan.charAt() == ".") {
                    message.react("❌");
                    break;
                }
            } catch (e) {}
            

            if (db[group] == undefined) {
                file = editJsonFile("./config/banned.json", {
                    autosave: true
                });
                file.append(group.replace(".", "\\."), " ")
            }
            try {
                db[group].push(toBan)
                var jsonData = JSON.stringify(db);
                fs.writeFileSync("./config/banned.json", jsonData);
                message.react("✅");
            } catch (e) {
                message.react("❌");
            }
            break;


        default:
            client.getChatById(message.id.remote).then(async (chat) => {
                await chat.sendSeen();
            });
        break;
    }


});

client.initialize();
