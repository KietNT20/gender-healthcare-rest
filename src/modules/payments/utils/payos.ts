import PayOS = require('@payos/node');

export const payOS = new PayOS(
    process.env.PAYOS_CLIENT_ID as string,
    process.env.PAYOS_API_KEY as string,
    process.env.PAYOS_CHECKSUM_KEY as string,
);

// check log environment variable
if (process.env.PAYOS_CLIENT_ID) {
    console.log('PayOS have Client ID');
}

if (process.env.PAYOS_API_KEY) {
    console.log('PayOS have API Key');
}

if (process.env.PAYOS_CHECKSUM_KEY) {
    console.log('PayOS have Checksum Key');
}
