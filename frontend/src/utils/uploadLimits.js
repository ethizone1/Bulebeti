// Uploads are sent to the API as base64 inside a JSON body. The server accepts
// JSON bodies up to 5 MB and base64 adds ~33%, so files must stay under 3.5 MB.
export const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024;
export const MAX_UPLOAD_LABEL = "3.5MB";
