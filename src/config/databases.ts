import mongoose, { Connection } from 'mongoose';

const CONNECTION_PREFIX = 'MONGO_DB_URL_';

export const connections: Record<string, Connection> = {};

const normalize = (name: string): string => name.trim().toLowerCase();

const connectWithRetry = async (uri: string, name: string, maxRetries = 5, delayMs = 1000): Promise<Connection | null> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const connection = await mongoose.createConnection(uri, {
        serverSelectionTimeoutMS: 5000,
      });

      await new Promise<void>((resolve, reject) => {
        connection.once('open', () => resolve());
        connection.on('error', reject);
      });

      console.log(`✅ Connected to DB: ${name}`);

      connection.on('disconnected', async () => {
        console.warn(`⚠️ Disconnected from DB '${name}'`);
        for (let i = 1; i <= 5; i++) {
          try {
            await connection.openUri(uri);
            console.log(`✅ Reconnected to DB '${name}'`);
            break;
          } catch (err) {
            console.error(`⏳ Reconnect attempt ${i} failed for '${name}'`);
            await new Promise((res) => setTimeout(res, 1000 * i));
          }
        }
      });

      return connection;
    } catch (err) {
      console.error(`⛔ Connection attempt ${attempt} failed for DB '${name}':`, (err as Error).message);
      if (attempt < maxRetries) {
        const wait = delayMs * 2 ** (attempt - 1);
        console.log(`↻ Retrying in ${wait}ms...`);
        await new Promise((res) => setTimeout(res, wait));
      } else {
        console.error(`❌ Failed to connect to DB '${name}' after ${maxRetries} attempts.`);
        return null;
      }
    }
  }

  return null;
};

export const loadDatabaseConnections = async (): Promise<void> => {
  const envEntries = Object.entries(process.env).filter(([key]) =>
    key.startsWith(CONNECTION_PREFIX)
  );

  const loadTasks = envEntries.map(async ([key, uri]) => {
    const rawName = key.replace(CONNECTION_PREFIX, '');
    const name = normalize(rawName);

    if (!uri) {
      console.error(`❌ Missing URI for DB '${name}', skipping connection.`);
      return;
    }

    const connection = await connectWithRetry(uri, name);
    if (connection) connections[name] = connection;
  });

  await Promise.all(loadTasks);

  setInterval(async () => {
    for (const [name, conn] of Object.entries(connections)) {
      try {
        await conn.db?.admin().ping();
      } catch {
        console.error(`❌ Lost connection to '${name}', attempting reconnect...`);
        const uri = process.env[`${CONNECTION_PREFIX}${name.toUpperCase()}`];
        if (uri) {
          const newConn = await connectWithRetry(uri, name);
          if (newConn) connections[name] = newConn;
        }
      }
    }
  }, 60_000);
};
