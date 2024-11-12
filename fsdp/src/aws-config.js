import AWS from 'aws-sdk';

// Configure AWS SDK
AWS.config.update({
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
    region: process.env.REACT_APP_AWS_REGION
});

const s3 = new AWS.S3(s3Config);   


// template bucket
const s3Bucket2Config = {
  accessKeyId: process.env.AWS_BUCKET_2_ACCESS_KEY,
  secretAccessKey: process.env.AWS_BUCKET_2_SECRET_KEY,
  region: process.env.AWS_BUCKET_2_REGION
};

const s3Bucket2 = new AWS.S3(s3Bucket2Config);

export { s3, s3Bucket2 };
