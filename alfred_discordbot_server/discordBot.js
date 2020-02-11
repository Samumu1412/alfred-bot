const Discord = require('discord.js');
const { prefix } = require('./config.json');
let schedule = require('node-schedule');
require('dotenv').config();
let userDatabase = require('./database/user');
let userCommandDB = require('./database/userCommand');
//let auctionDB = require('./database/auction');

//change buzzer status every 1 minutes
let buzzerStatus = require('./buzzerStatus');

const updateBuzzerStatusScheduleTime = '00 * * * * *';
let updateBuzzerStatusSchedule = new schedule.scheduleJob(updateBuzzerStatusScheduleTime,
    async function () {
        var sendWarningToSlackOrNotString = await getBuzzersendWarningToSlackOrNot();
        if (sendWarningToSlackOrNotString == "false") {
            updateBotBuzzerStringToTrue()
        }
    }
);

//discord bot
const DiscordBot = new Discord.Client();

DiscordBot.on('ready', () => {
    console.log(`Logged in as ALFRED-DiscordBot-0.1.0!`);

});

DiscordBot.once('ready', () => {
    console.log('Ready!');
    UpdateAliveOrNotToTrue();
});



//============================================================================================================================
//bot command
let commandContent;
let _;
let commandText;
const slotPointConsume = -100;
const checkinPoints = 200;
const commandPoints = 10;

const rulesText = '命令列表 ALFRED-DiscordBot-0.1.0'
    + '\n$checkin：每日登入領取 ' + checkinPoints + ' 點'
    + '\n$info：查看個人資訊'
    + '\n$card：查看卡片資訊'
    + '\n$slot：花費 ' + slotPointConsume + ' 點數抽獎'
    + '\n$rank：查看點數排行榜'
    + '\n使用指令獲得點數，請多多使用指令活絡氣氛！';

const errorText = '輸入指令格式錯誤，請輸入 $help 查看指令列表';

//$help
DiscordBot.on('message', async (message) => {
    _, commandContent = message.content.split(' ', 2);
    commandText = (commandContent[0]).toLowerCase();
    let userStatus = await isNewUserorNot(message.author.id);
    let userLength = await getUserLength();

    if (commandText == `${prefix}help` && commandContent[1] == undefined) {
        if (message.author.bot == false && userStatus == undefined) {
            createNewUser(message.author.username, message.author.id, userLength);
            console.log("create new user");
        }


        let userCommandAmount = await getUserCommandAmount(message.author.id);
        userCommandAmount += 1;
        updateUserCommandAmount(message.author.id, userCommandAmount);

        let userPoints = await getUserPointsByID(message.author.id);
        userPoints += commandPoints;
        updateUserPoints(message.author.id, userPoints);

        createNewUserCommand(message.author.username, message.author.id, commandText, message.date);

        message.channel.send(rulesText);
    } else if (message.content.startsWith(`${prefix}help`)) {
        message.channel.send(errorText);
    }
})

//$checkin
//checkin reset at 9 am everyday
const checkinScheduleTime = '00 01 * * * *';
let checkinResetSchedule = new schedule.scheduleJob(checkinScheduleTime,
    function () { checkinReset() });

DiscordBot.on('message', async (message) => {

    _, commandContent = message.content.split(' ', 2);
    commandText = (commandContent[0]).toLowerCase();
    let userStatus = await isNewUserorNot(message.author.id);
    let userLength = await getUserLength();

    if (commandText == `${prefix}checkin` && commandContent[1] == undefined) {
        if (message.author.bot == false && userStatus == undefined) {
            createNewUser(message.author.username, message.author.id, userLength);
            console.log("create new user");
        }

        let userCheckinStatus = await getUserCheckinStatus(message.author.id);

        if (userCheckinStatus == "off") {
            updateUserCheckinStatus(message.author.id, "on");

            let userPoints = await getUserPointsByID(message.author.id);
            userPoints += checkinPoints;
            userPoints += commandPoints;
            updateUserPoints(message.author.id, userPoints);

            message.channel.send('恭喜 '
                + message.author.username
                + '獲得 '
                + checkinPoints
                + ' 點數！\n目前共有：'
                + userPoints
                + '點數');
        } else if (userCheckinStatus == "on") {
            message.channel.send(message.author.username
                + " 今天已經完成 Checkin！\n每早 9 點重置");
        }

        let userCommandAmount = await getUserCommandAmount(message.author.id);
        userCommandAmount += 1;
        updateUserCommandAmount(message.author.id, userCommandAmount);

        createNewUserCommand(message.author.username, message.author.id, commandText, message.date);
    } else if (message.content.startsWith(`${prefix}checkin`)) {
        message.channel.send(errorText)
    }
});

//$info
DiscordBot.on('message', async (message) => {
    _, commandContent = message.content.split(' ', 2);
    commandText = (commandContent[0]).toLowerCase();
    let userStatus = await isNewUserorNot(message.author.id);
    let userLength = await getUserLength();

    if (commandText == `${prefix}info` && commandContent[1] == undefined) {
        if (message.author.bot == false && userStatus == undefined) {
            await createNewUser(message.author.username, message.author.id, userLength);
        }

        let userCommandAmount = await getUserCommandAmount(message.author.id);
        userCommandAmount += 1;
        updateUserCommandAmount(message.author.id, userCommandAmount);

        let userPoints = await getUserPointsByID(message.author.id);
        userPoints += commandPoints;
        updateUserPoints(message.author.id, userPoints);


        message.channel.send('用戶 ' + message.author.username + ' 的資訊\n'
            + 'ID：' + message.author.id
            + '\n點數：' + userPoints + ' 點');

        createNewUserCommand(message.author.username, message.author.id, commandText, message.date);
    } else if (message.content.startsWith(`${prefix}info`)) {
        message.channel.send(errorText)
    }
})

//>card
DiscordBot.on('message', async (message) => {

    _, commandContent = message.content.split(' ', 2);
    commandText = (commandContent[0]).toLowerCase();
    let userStatus = await isNewUserorNot(message.author.id);
    let userLength = await getUserLength();

    if (commandText == `${prefix}card` && commandContent[1] == undefined) {
        if (message.author.bot == false && userStatus == undefined) {
            createNewUser(message.author.username, message.author.id, userLength);
            console.log("create new user");
        }
        let userPoints = await getUserPointsByID(message.author.id);
        userPoints += commandPoints;
        updateUserPoints(message.author.id, userPoints);

        let userCommandAmount = await getUserCommandAmount(message.author.id);
        userCommandAmount += 1;
        updateUserCommandAmount(message.author.id, userCommandAmount);

        let userCardArray = await getUserCardArray(message.author.id);

        let cardInfoArray = [];
        let noCardInfoArray = [];

        for (let i = 0; i < userCardArray.length; i++) {
            if (userCardArray[i].status == "on") {
                cardInfoArray.push('【' + userCardArray[i].name + '】\n卡片效果：' + userCardArray[i].ability
                    + '\n卡片張數：' + userCardArray[i].amount + ' 張\n');
            } else if (userCardArray[i].status == "off") {
                noCardInfoArray.push('【' + userCardArray[i].name + '】\n卡片效果：' + userCardArray[i].ability + '\n');
                console.log(noCardInfoArray);
            }
        }

        if (cardInfoArray.length == 0) {
            cardInfoArray.push('\n暫時無卡片，請參加抽獎活動抽取！\n');
        }
        cardInfoArray = cardInfoArray.join('');

        if (noCardInfoArray.length == 0) {
            noCardInfoArray.push('\n你已獲得所有卡片，嘗試累積卡片，獲得特殊卡片！\n');
        }
        noCardInfoArray = noCardInfoArray.join('');

        createNewUserCommand(message.author.username, message.author.id, commandText, message.date);

        message.channel.send(message.author.username + ' 的卡片資訊\n'
            + '擁有卡片：\n' + cardInfoArray
            + '\n尚未擁有卡片：\n' + noCardInfoArray);
    } else if (message.content.startsWith(`${prefix}card`)) {
        message.channel.send(errorText);
    }
})

//>slot
DiscordBot.on('message', async (message) => {
    _, commandContent = message.content.split(' ', 2);
    commandText = (commandContent[0]).toLowerCase();
    const userStatus = await isNewUserorNot(message.author.id);
    let userLength = await getUserLength();

    if (commandText == `${prefix}slot` && commandContent[1] == undefined) {
        if (message.author.bot == false && userStatus == undefined) {
            createNewUser(message.author.username, message.author.id, userLength);
            console.log("create new user");
        }

        let userCommandAmount = await getUserCommandAmount(message.author.id);
        userCommandAmount += 1;
        updateUserCommandAmount(message.author.id, userCommandAmount);

        let userPoints = await getUserPointsByID(message.author.id);
        userPoints += commandPoints;
        updateUserPoints(message.author.id, userPoints);

        message.channel.send(message.author.username + ' 開始抽獎！');

        let slotPrizeText;

        if (userPoints + slotPointConsume < 0) {
            message.channel.send(message.author.username + ' 點數不足無法抽獎！')
        } else {
            let slotGetPoints = GetRandomNum(1, 200);
            let slotCardIndex = GetRandomNum(0, 9);
            let random = GetRandomNum(0, 1);
            if (random == 0) {
                let userPoints = await getUserPointsByID(message.author.id);
                userPoints += slotGetPoints;
                userPoints += slotPointConsume;
                updateUserPoints(message.author.id, userPoints);

                slotPrizeText = '獲得' + slotGetPoints + ' 點！';
            } else if (random == 1) {
                let userPoints = await getUserPointsByID(message.author.id);
                userPoints += slotPointConsume;
                updateUserPoints(message.author.id, userPoints);

                let userCardArray = await getUserCardArray(message.author.id);
                if (userCardArray[slotCardIndex].amount == 0) {
                    updateUserCardStatus(message.author.id, slotCardIndex);
                    updateUserCardAmount(message.author.id, userCardArray[slotCardIndex].amount, slotCardIndex);
                } else {
                    updateUserCardAmount(message.author.id, userCardArray[slotCardIndex].amount, slotCardIndex);
                }
                userCardArray = await getUserCardArray(message.author.id);
                slotPrizeText = '獲得【' + userCardArray[slotCardIndex].name + '】!';
            }
            userPoints = await getUserPointsByID(message.author.id);

            message.channel.send(message.author.username + ' 消耗 ' + (-slotPointConsume) + ' 點...\n'
                + slotPrizeText
                + ' \n剩餘點數 ' + userPoints + ' 點');
        }

        createNewUserCommand(message.author.username, message.author.id, commandText, message.date);

    } else if (message.content.startsWith(`${prefix}slot`)) {
        message.channel.send(errorText);
    }
})

//>rank
DiscordBot.on('message', async (message) => {
    _, commandContent = message.content.split(' ', 2);
    commandText = (commandContent[0]).toLowerCase();
    let userStatus = await isNewUserorNot(message.author.id);
    let userLength = await getUserLength();

    if (commandText == `${prefix}rank` && commandContent[1] == undefined) {
        if (message.author.bot == false && userStatus == undefined) {
            createNewUser(message.author.username, message.author.id, userLength);
            console.log("create new user");
        }

        let userCommandAmount = await getUserCommandAmount(message.author.id);
        userCommandAmount += 1;
        updateUserCommandAmount(message.author.id, userCommandAmount);

        let userPoints = await getUserPointsByID(message.author.id);
        userPoints += commandPoints;
        updateUserPoints(message.author.id, userPoints);

        userLength = await getUserLength();

        let rankArray = [];
        let rankDisplay = ['點數排行榜\n'];
        let pointsArray = [];
        let topPointsArray = [];
        let topNameArray = [];

        for (i = 0; i < userLength; i++) {
            let userPoints = await getUserPointsByIndex(i);
            pointsArray.push(userPoints);
        }
        //sort points array
        pointsArray = bubbleSort(pointsArray);

        //only display Top10
        if (pointsArray.length < 10) {
            for (let i = 1; i <= pointsArray.length; i++) {
                topPointsArray.push(pointsArray[pointsArray.length - i]);
            }
        } else if (pointsArray.length >= 10) {
            for (let i = 1; i <= 10; i++) {
                topPointsArray.push(pointsArray[pointsArray.length - i]);
            }
        }

        //infer name array
        for (let i = 0; i < topPointsArray.length; i++) {
            let username = await getUsernameByPoints(topPointsArray[i])
            topNameArray.push(username);
        }

        for (let i = 0; i < 2; i++) {
            rankArray[i] = [];
            for (let j = 0; j < topPointsArray.length; j++) {
                if (i == 0) {
                    rankArray[i][j] = topPointsArray[j];
                } else if (i == 1) {
                    rankArray[i][j] = topNameArray[j];
                }
            }
        }
        for (let i = 0; i < rankArray[1].length; i++) {
            if (rankArray[1][i] != rankArray[1][i + 1]) {
                rankDisplay.push('【第 ' + (i + 1) + ' 名】： ' + rankArray[1][i] +
                    ' ，共 ' + rankArray[0][i] + ' 分\n');
            } else {
                for (let j = 0; j < (rankArray[0].length - i); j++) {
                    if (rankArray[0][i] == rankArray[0][i + j] && rankArray[0][i] != undefined) {
                        rankDisplay.push('第 ' + (i + 1) + ' 名： ' + rankArray[1][i + j] +
                            ' 共 ' + rankArray[0][i + j] + ' 分\n');
                    }
                }
            }
        }
        rankDisplay = rankDisplay.join('');

        createNewUserCommand(
            message.author.username,
            message.author.id,
            commandText,
            message.date);

        message.channel.send(rankDisplay);
    } else if (message.content.startsWith(`${prefix}rank`)) {
        message.channel.send(errorText)
    }
})

//============================================================================================================================
//create database info
function writeDataIntoDB(database) {
    database.save(function (err) {
        if (err) throw err;
        console.log('Write in DB successfully');
    })
}

async function createNewUser(username, userID, index) {
    let newUser = new userDatabase({
        username: username,
        userID: userID,
        index: index,
        points: 0,
        commandAmount: 0,
        checkinStatus: "off",
        card: [
            {
                name: "妙蛙種子",
                amount: 0,
                status: "off",
                ability: "藤蔓",
                index: 0
            },
            {
                name: "小火龍",
                amount: 0,
                status: "off",
                ability: "火苗",
                index: 1
            },
            {
                name: "傑尼龜",
                amount: 0,
                status: "off",
                ability: "水花",
                index: 2
            },
            {
                name: "皮卡丘",
                amount: 0,
                status: "off",
                ability: "雷電",
                index: 3
            },
            {
                name: "波波",
                amount: 0,
                status: "off",
                ability: "爪擊",
                index: 4
            },
            {
                name: "喵喵",
                amount: 0,
                status: "off",
                ability: "投錢幣",
                index: 5
            },
            {
                name: "腕力",
                amount: 0,
                status: "off",
                ability: "拳",
                index: 6
            },
            {
                name: "卡拉卡拉",
                amount: 0,
                status: "off",
                ability: "抓抓",
                index: 7
            },
            {
                status: "小拳石",
                cardAmount: 0,
                selling: "拳擊",
                index: 8
            },
            {
                name: "伊步",
                amount: 0,
                status: "off",
                ability: "撞擊",
                index: 9
            }]
    })
    await writeDataIntoDB(newUser);
    console.log("new user!!");
}

function createNewUserCommand(username, userID, commandText, date) {
    let userCommandInfo = new userCommandDB({
        userID: userID,
        username: username,
        commandText: commandText,
        timeStamp: date
    })
    writeDataIntoDB(userCommandInfo);
}

//get database info
async function isNewUserorNot(id) {
    try {
        var userStatus = await userDatabase.findOne({ userID: id }).exec();
        return userStatus;
    } catch (err) {
        console.error(err);
    }
}

async function getUserLength() {
    try {
        let count = await userDatabase.count({}).exec()
        return count;
    } catch (err) {
        console.error(err);
    }
}

async function getUserPointsByID(userID) {
    try {
        var userStatus = await userDatabase.findOne({ userID: userID }).exec();
        var userPoints = userStatus._doc.points;
        return userPoints;
    } catch (err) {
        console.error(err);
    }
}

async function getUserPointsByIndex(index) {
    try {
        var userStatus = await userDatabase.findOne({ index: index }).exec();
        var userPoints = userStatus._doc.points;
        return userPoints;
    } catch (err) {
        console.error(err);
    }
}

async function getUserCommandAmount(userID) {
    try {
        var userStatus = await userDatabase.findOne({ userID: userID }).exec();
        var userCommandAmount = userStatus._doc.commandAmount;
        return userCommandAmount;
    } catch (err) {
        console.error(err);
    }
}

async function getUserCheckinStatus(userID) {
    try {
        var userStatus = await userDatabase.findOne({ userID: userID }).exec();
        var userCheckinStatus = userStatus._doc.checkinStatus;
        return userCheckinStatus;
    } catch (err) {
        console.error(err);
    }
}

async function getUserCardArray(userID) {
    try {
        var userStatus = await userDatabase.findOne({ userID: userID }).exec();
        var userCardArray = userStatus._doc.card;
        return userCardArray;
    } catch (err) {
        console.error(err);
    }
}

async function getUsernameByPoints(points) {
    try {
        var userStatus = await userDatabase.findOne({ points: points }).exec();
        var username = userStatus._doc.username;
        return username;
    } catch (err) {
        console.error(err);
    }
}

async function getBuzzersendWarningToSlackOrNot() {
    try {
        var buzzer = await buzzerStatus.findOne({ name: "DiscordBuzzer" }).exec();
        var sendWarningToSlackOrNotString = buzzer._doc.sendWarningToSlackOrNot;
        return sendWarningToSlackOrNotString;
    } catch (err) {
        console.error(err);
    }
}

//update database info
function updateUserPoints(userID, points) {
    userDatabase.updateOne({ userID: userID },
        { points: points }).then(result => {
            console.log(result);
        })
}

function updateUserCommandAmount(userID, commandAmount) {
    userDatabase.updateOne({ userID: userID },
        { commandAmount: commandAmount }).then(result => {
            console.log(result);
        })
}

function updateUserCheckinStatus(userID, checkinStatus) {
    userDatabase.updateOne({ userID: userID },
        { checkinStatus: checkinStatus }).then(result => {
            console.log(result);
        })
}

function updateUserCardStatus(userID, cardIndex) {
    userDatabase.updateOne({ userID: userID, "card.index": cardIndex },
        { $set: { "card.$.status": "on" } }).then(result => {
            console.log(result);
        })
}

function updateUserCardAmount(userID, amount, cardIndex) {
    userDatabase.updateOne({ userID: userID, "card.index": cardIndex },
        { $set: { "card.$.amount": amount + 1 } }).then(result => {
            console.log(result);
        })
}

function checkinReset() {
    userDatabase.updateMany({ checkinStatus: "on" },
        { checkinStatus: "off" }).then(result => {
            console.log(result);
        })
}

function updateBotBuzzerStringToTrue() {
    buzzerStatus.updateOne({ name: "DiscordBuzzer" },
        { sendWarningToSlackOrNot: "true" }).then()
    console.log("Tell buzzer discord bot is alive");

}

function UpdateAliveOrNotToTrue() {
    buzzerStatus.updateOne({ name: "DiscordBuzzer" },
        { awakeOrNot: true }).then()
    console.log("tell morning call discord bot start working");
}

/*
============================================================================================================================
additional Function
*/
function GetRandomNum(Min, Max) {
    let Range = Max - Min;
    let Rand = Math.random();
    return (Min + Math.round(Rand * Range));
}

function bubbleSort(array) {

    for (let i = 0; i < array.length; i++) {
        for (let j = 0; j < array.length - (i + 1); j++) {
            if (array[j] > array[j + 1]) {
                [array[j], array[j + 1]] = [array[j + 1], array[j]];
            }
        }
    }
    return array;
}


DiscordBot.login(process.env.DISCORD_BOT_TOKEN);
