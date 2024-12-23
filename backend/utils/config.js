export const Config = {
    isDev: process.env.NODE_ENV === 'development',
    db: {
        host:       process.env.DB_HOST,
        user:       process.env.DB_USER,
        password:   process.env.DB_PASSWORD,
        database:   process.env.DB_DATABASE
    },
    uploadthing: {
        apiToken:   process.env.UPLOADTHING_TOKEN,
        apiKey:     process.env.UPLOADTHING_KEY
    },
    google: {
        apiKey:     process.env.GOOGLE_KEY
    }
};
export default Config;