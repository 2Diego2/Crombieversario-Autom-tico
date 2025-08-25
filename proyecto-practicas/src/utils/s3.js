// src/utils/s3.js
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
const BUCKET_REGION = process.env.AWS_S3_BUCKET_REGION;

// --- Configuración del Cliente S3 ---
// Al no pasarle 'accessKeyId' ni 'secretAccessKey', el SDK buscará
// automáticamente las credenciales del Rol de IAM asignado a la EC2.
const s3Client = new S3Client({
    region: BUCKET_REGION,
});

/**
 * Sube un archivo a S3.
 * @param {Buffer} fileBuffer - El buffer del archivo.
 * @param {string} fileName - El nombre que tendrá el archivo en S3.
 * @param {string} mimetype - El tipo de archivo (ej. 'image/png').
 * @returns {Promise<string>} La URL pública del archivo subido.
 */
async function uploadFile(fileBuffer, fileName, mimetype) {
    const uploadParams = {
        Bucket: BUCKET_NAME,
        Body: fileBuffer,
        Key: fileName,
        ContentType: mimetype,
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    // Construye y retorna la URL pública del objeto
    const fileUrl = `https://${BUCKET_NAME}.s3.${BUCKET_REGION}.amazonaws.com/${fileName}`;
    return fileUrl;
}

/**
 * Elimina un archivo de S3.
 * @param {string} fileName - El nombre del archivo a eliminar en S3.
 */
async function deleteFile(fileName) {
    const deleteParams = {
        Bucket: BUCKET_NAME,
        Key: fileName,
    };

    await s3Client.send(new DeleteObjectCommand(deleteParams));
}

module.exports = { uploadFile, deleteFile };