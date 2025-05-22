const config = {
    database: {
        uri: process.env.DATABASE_URI,
        dbName: 'marble_odds_feed',
    }
}

export default () => config;
