const mongoose = require('mongoose');
require('dotenv').config();

//database configure
let db = mongoose.connection;
//連線失敗
db.on('error', console.error.bind(console, 'connection error:'));
//連線成功
db.once('open', function () {
    console.log("userDatabase connection success...");
});
//建立連線
mongoose.connect(process.env.BOT_MONGODB_URL, { useNewUrlParser: true }).then(() => console.log('DB Connected!'))
    .catch(err => {
        console.log(err);
    });

let schema = mongoose.Schema;
//user schema model
let userSchema = new schema({
    userID: String,
    username: String,
    index: Number,
    points: Number,
    commandAmount: Number,
    checkinStatus: String,
    card: [
        {
            name: String,
            amount: Number,
            status: String,
            ability: String,
            index: Number
        },
        {
            name: String,
            amount: Number,
            status: String,
            ability: String,
            index: Number
        },
        {
            name: String,
            amount: Number,
            status: String,
            ability: String,
            index: Number
        },
        {
            name: String,
            amount: Number,
            status: String,
            ability: String,
            index: Number
        },
        {
            name: String,
            amount: Number,
            status: String,
            ability: String,
            index: Number
        },
        {
            name: String,
            amount: Number,
            status: String,
            ability: String,
            index: Number
        },
        {
            name: String,
            amount: Number,
            status: String,
            ability: String,
            index: Number
        },
        {
            name: String,
            amount: Number,
            status: String,
            ability: String,
            index: Number
        },
        {
            name: String,
            amount: Number,
            status: String,
            ability: String,
            index: Number
        },
        {
            name: String,
            amount: Number,
            status: String,
            ability: String,
            index: Number
        },
    ]
});


let user = mongoose.model('user', userSchema);

// make this available to our users in our Node applications
module.exports = user;