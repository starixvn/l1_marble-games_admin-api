const config = {
    database: {
        uri: process.env.DATABASE_URI,
        dbName: process.env.DATABASE_NAME,
    }
}

export default () => config;
