export const Config = {
    isDev: process.env.NODE_ENV === 'development',
    hostURL: process.env.HOST_URL,
    logRetention: process.env.LOG_RETENTION,
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
    },
    cloudflare: {
        token:      process.env.CLOUDFLARE_TOKEN
    }
};
export default Config;