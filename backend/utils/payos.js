/**
 * PayOS SDK initialization helper
 *
 * The @payos/node SDK's PayOS constructor expects an options object. Prior
 * code attempted to call `new PayOS(clientId, apiKey, checksumKey)` which
 * does not match the SDK. This file initializes the client using the
 * correct shape and exposes wrapper functions used across the project:
 * - createPaymentLink(paymentData)
 * - getPaymentLinkInformation(paymentLinkId)
 * - verifyPaymentWebhookData(webhookBody)
 *
 * Also export `client` for advanced usage.
 */
import { PayOS } from "@payos/node";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load backend/.env explicitly so this file works regardless of cwd.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Lazy init so missing env doesn't crash the server at import time.
let client = null;

const getEnv = () => ({
  PAYOS_CLIENT_ID: process.env.PAYOS_CLIENT_ID,
  PAYOS_API_KEY: process.env.PAYOS_API_KEY,
  PAYOS_CHECKSUM_KEY: process.env.PAYOS_CHECKSUM_KEY,
  PAYOS_PARTNER_CODE: process.env.PAYOS_PARTNER_CODE,
  PAYOS_BASE_URL: process.env.PAYOS_BASE_URL,
});

// Initialize PayOS SDK correctly. The PayOS constructor expects an options object.
const initializePayOS = () => {
  const {
    PAYOS_CLIENT_ID,
    PAYOS_API_KEY,
    PAYOS_CHECKSUM_KEY,
    PAYOS_PARTNER_CODE,
    PAYOS_BASE_URL,
  } = getEnv();

  if (!PAYOS_CLIENT_ID) {
    throw new Error("PAYOS_CLIENT_ID is not defined in your .env file.");
  }
  if (!PAYOS_API_KEY) {
    throw new Error("PAYOS_API_KEY is not defined in your .env file.");
  }
  if (!PAYOS_CHECKSUM_KEY) {
    throw new Error("PAYOS_CHECKSUM_KEY is not defined in your .env file.");
  }

  try {
    return new PayOS({
      clientId: PAYOS_CLIENT_ID,
      apiKey: PAYOS_API_KEY,
      checksumKey: PAYOS_CHECKSUM_KEY,
      partnerCode: PAYOS_PARTNER_CODE,
      baseURL: PAYOS_BASE_URL,
    });
  } catch (error) {
    console.error("Error initializing PayOS SDK:", error);
    throw new Error("Could not initialize PayOS SDK. Please check the constructor arguments.");
  }
};

const getClient = () => {
  if (!client) client = initializePayOS();
  return client;
};

// Wrapper functions to keep current project code working. The SDK exposes
// paymentRequests.create/get and webhooks.verify, so provide the project's
// expected API surface: createPaymentLink, getPaymentLinkInformation,
// verifyPaymentWebhookData.
const createPaymentLink = async (paymentData, options = {}) => {
  // SDK: client.paymentRequests.create(paymentData)
  return getClient().paymentRequests.create(paymentData, options);
};

const getPaymentLinkInformation = async (paymentLinkId, options = {}) => {
  // SDK: client.paymentRequests.get(id)
  return getClient().paymentRequests.get(paymentLinkId, options);
};

const verifyPaymentWebhookData = async (webhookBody) => {
  // SDK expects { data, signature } object; the controller passes req.body
  // so forward directly to client.webhooks.verify
  return getClient().webhooks.verify(webhookBody);
};

export default {
  createPaymentLink,
  getPaymentLinkInformation,
  verifyPaymentWebhookData,
  // expose the raw client in case other code needs advanced APIs
  get client() {
    return getClient();
  },
};
