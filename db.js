const mongoose = require("mongoose");
let MONGODB_URI='mongodb://127.0.0.1:27017/Bus-AGENCY'

class Database {
    constructor() {
        this.db_connect();
    }
    async db_connect() {
        try {
            this.database = await mongoose.connect(MONGODB_URI, {
                useNewUrlParser: true,
            });
            console.log("Database connection successful");
            mongoose.set('debug', true);
        } catch (err) {
            console.error(err);
        }
    }
}

module.exports = new Database();
