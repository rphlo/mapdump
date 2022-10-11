from django.conf import settings
from django.core.management.base import BaseCommand
from utils.s3 import get_s3_client, s3_delete_key


class Command(BaseCommand):
    help = "Remove image file from prev version"

    def scan_map_directory(self):
        # Should use v2 but wasabi fails to list all files with it
        # paginator = s3.get_paginator('list_objects_v2')
        paginator = self.s3.get_paginator("list_objects")
        kwargs = {
            "Bucket": settings.AWS_S3_BUCKET,
            "Prefix": "routes/",
        }
        for page in paginator.paginate(**kwargs):
            try:
                contents = page["Contents"]
            except KeyError:
                break
            for obj in contents:
                key = obj["Key"]
                yield key

    def handle(self, *args, **options):
        self.s3 = get_s3_client()
        for filename in self.scan_map_directory():
            s3_delete_key(filename, settings.AWS_S3_BUCKET)
        self.stdout.write(self.style.SUCCESS("Done"))
