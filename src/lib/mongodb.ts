import { MongoClient } from "mongodb";

// Ensure .env variables are loaded
const uri = process.env.MONGODB_URI || "";
const options = {};

console.log("MongoDB URI:", uri); // Check if URI is loaded correctly

if (!uri) {
    throw new Error("Please add your MongoDB URI to .env.local");
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

console.log("Environment:", process.env.NODE_ENV); // Check environment

if (process.env.NODE_ENV === "development") {
    // Use global variable to avoid multiple connections in dev
    if (!(global as any)._mongoClientPromise) {
        client = new MongoClient(uri, options);
        (global as any)._mongoClientPromise = client
            .connect()
            .then((client) => {
                console.log("Connected to the database in development mode");
                return client;
            })
            .catch((error) => {
                console.error("Database connection failed in development:", error.message);
                throw error;
            });
    }
    clientPromise = (global as any)._mongoClientPromise;
} else {
    // For production, don't use a global variable
    client = new MongoClient(uri, options);
    clientPromise = client
        .connect()
        .then((client) => {
            console.log("Connected to the database in production mode");
            return client;
        })
        .catch((error) => {
            console.error("Database connection failed in production:", error.message);
            throw error;
        });
}

export default clientPromise;
