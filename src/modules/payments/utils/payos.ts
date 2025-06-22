const PayOS = require('@payos/node');

export const payOS = new PayOS(
    process.env.PAYOS_CLIENT_ID as string,
    process.env.PAYOS_API_KEY as string,
    process.env.PAYOS_CHECKSUM_KEY as string,
);

// check log environment variable
if (process.env.PAYOS_CLIENT_ID) {
    console.log('PayOS Client ID:', process.env.PAYOS_CLIENT_ID);
}
