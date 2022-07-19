from django.conf import settings
from django.core.management.base import BaseCommand
from routedb.models import Route
from utils.s3 import s3_delete_key, s3_key_exists

class Command(BaseCommand):
    help = "Remove image file from prev version"

    def handle(self, *args, **options):
        qs = Route.objects.all()
        for route in qs:
            file_path = route.raster_map.path + "_thumb"
            if s3_key_exists(file_path, settings.AWS_S3_BUCKET):
                s3_delete_key(file_path, settings.AWS_S3_BUCKET)
            file_path = route.images_path + "_header"
            if s3_key_exists(file_path, settings.AWS_S3_BUCKET):
                s3_delete_key(file_path, settings.AWS_S3_BUCKET)
            file_path = route.images_path + "_route"
            if s3_key_exists(file_path, settings.AWS_S3_BUCKET):
                s3_delete_key(file_path, settings.AWS_S3_BUCKET)
            file_path = route.images_path + "_header_route"
            if s3_key_exists(file_path, settings.AWS_S3_BUCKET):
                s3_delete_key(file_path, settings.AWS_S3_BUCKET)
            file_path = route.images_path
            if s3_key_exists(file_path, settings.AWS_S3_BUCKET):
                s3_delete_key(file_path, settings.AWS_S3_BUCKET)
            file_path = route.images_path + "_blank"
            if s3_key_exists(file_path, settings.AWS_S3_BUCKET):
                s3_delete_key(file_path, settings.AWS_S3_BUCKET)
        self.stdout.write(self.style.SUCCESS("Done"))
