import boto3
from django.conf import settings


def get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.AWS_S3_ENDPOINT_URL,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )


def s3_object_url(key, bucket):
    s3 = get_s3_client()
    return s3.generate_presigned_url(
        ClientMethod="get_object", Params={"Bucket": bucket, "Key": key}
    )


def s3_key_exists(key, bucket):
    s3 = get_s3_client()
    response = s3.list_objects(
        Bucket=bucket,
        Prefix=key,
    )
    for obj in response.get("Contents", []):
        if obj["Key"] == key:
            return True
    return False


def s3_delete_key(key, bucket):
    s3 = get_s3_client()
    s3.delete_object(
        Bucket=bucket,
        Key=key,
    )


def upload_to_s3(bucket, key, fileobj):
    s3 = get_s3_client()
    s3.upload_fileobj(fileobj, bucket, key)
