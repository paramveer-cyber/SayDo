import dotenv from "dotenv";
dotenv.config();
const OPENAPI_KEY = process.env.OPENAPI_KEY;
const OPENAI_URL = process.env.OPEANAI_URL;
const PORT = process.env.PORT || 3000;
export const apiChecker = () => {
    if (!OPENAPI_KEY || !OPENAI_URL) {
        console.error("OPENAPI_KEY and OPEANAI_URL must be set in the .env file");
        process.exit(1);
    }
    console.log("API Key and URL are set correctly.");
};
export const checkOpenAI = async () => {
    const openai = (await import("openai")).default;
    const client = new openai.OpenAI({
        apiKey: OPENAPI_KEY,
        baseURL: OPENAI_URL,
    });
    if (!client) {
        console.error("Failed to create OpenAI client.");
        process.exit(1);
    }
    console.log("OpenAI client created successfully.");
    return client;
};
//# sourceMappingURL=openAI.js.map