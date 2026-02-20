export interface RedisConnectionOptions {
    host: string;
    port: number;
    username?: string;
    password?: string;
}

export function parseRedisConnection(redisUrl: string): RedisConnectionOptions {
    const parsed = new URL(redisUrl);
    return {
        host: parsed.hostname,
        port: Number(parsed.port || "6379"),
        username: parsed.username || undefined,
        password: parsed.password || undefined
    };
}
