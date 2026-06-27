import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);
// to write data 


const subscriber = new Redis(process.env.REDIS_URL);
// to listen on the events which redis fires.


export async function createSandboxKey(sandBoxId) {
    await redis.set(sandBoxId, 
}
