const config = {
    database: {
        uri: process.env.DATABASE_URI,
        dbName: 'marble_odds_feed_copy_paste',
    }
}

export default () => config;
