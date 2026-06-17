import { GoogleAuth } from "google-auth-library";
const auth = new GoogleAuth({
    credentials: process.env.GCP_PUBSUB_SA_KEY
        ? JSON.parse(process.env.GCP_PUBSUB_SA_KEY)
        : undefined,
    scopes: ["https://www.googleapis.com/auth/pubsub"],
});
export const getPubSubAccessToken = async () => {
    const client = await auth.getClient();
    const { token } = await client.getAccessToken();
    if (!token)
        throw new Error("Failed to obtain Pub/Sub access token");
    return token;
};
//# sourceMappingURL=pubsub.client.js.map