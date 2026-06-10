const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const region = process.env.AWS_REGION || 'us-east-1';

const s3Client = new S3Client({
  region,
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    : undefined
});

const getBucketName = () => process.env.AWS_S3_BUCKET_NAME;

const getPublicBaseUrl = () => {
  if (process.env.S3_PUBLIC_URL) {
    return process.env.S3_PUBLIC_URL.replace(/\/$/, '');
  }
  const bucket = getBucketName();
  if (bucket) return `https://${bucket}.s3.${region}.amazonaws.com`;
  return (process.env.API_URL || '').replace(/\/$/, '');
};

const getS3Hostname = () => {
  try {
    return new URL(getPublicBaseUrl()).hostname;
  } catch {
    const bucket = getBucketName();
    return bucket ? `${bucket}.s3.${region}.amazonaws.com` : '';
  }
};

let s3WriteEnabled = null;

const isS3Configured = () => Boolean(
  process.env.DISABLE_S3 !== 'true' &&
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_S3_BUCKET_NAME
);

const isS3WriteEnabled = () => s3WriteEnabled === true;

const probeS3WriteAccess = async () => {
  if (process.env.DISABLE_S3 === 'true') {
    s3WriteEnabled = false;
    return false;
  }

  if (!isS3Configured()) {
    s3WriteEnabled = false;
    return false;
  }

  const bucket = getBucketName();
  const prefix = (process.env.S3_FOLDER_PREFIX || 'enigma').replace(/^\/+|\/+$/g, '');
  const testKey = `${prefix}/.enigma-write-test-${Date.now()}.txt`;

  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: testKey,
      Body: 'enigma-storage-probe',
      ContentType: 'text/plain'
    }));
    s3WriteEnabled = true;
    console.log(` S3 write probe OK (bucket: ${bucket}, region: ${region})`);
    return true;
  } catch (error) {
    s3WriteEnabled = false;
    console.error(` S3 write probe FAILED: ${error.name || error.code} — ${error.message}`);
    console.error(` Uploads will use API storage at ${process.env.API_URL || ''}/uploads/ until IAM is fixed.`);
    console.error(` Required IAM: s3:PutObject on arn:aws:s3:::${bucket}/*`);
    return false;
  }
};

module.exports = {
  s3Client,
  getBucketName,
  getPublicBaseUrl,
  getS3Hostname,
  region,
  isS3Configured,
  isS3WriteEnabled,
  probeS3WriteAccess
};
