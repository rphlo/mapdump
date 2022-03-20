from io import BytesIO

from django.core.management.base import BaseCommand
from routedb.models import Route
from utils.s3 import upload_to_s3


class Command(BaseCommand):
    help = "Remove image cache"

    def generate_thumb(self, route):
        file_path = route.raster_map.path + "_thumb"
        if not route.has_image_thumbnail:
            image = route.raster_map.thumbnail
            up_buffer = BytesIO()
            image.save(up_buffer, "JPEG", quality=80)
            up_buffer.seek(0)
            upload_to_s3("drawmyroute-maps", file_path, up_buffer)
            route.has_image_thumbnail = True
            route.save()

    def generate_map(self, route, show_header, show_route):
        suffix = "_header" if show_header else ""
        suffix += "_route" if show_route else ""
        if show_header or show_route:
            file_path = route.images_path + suffix
            if not getattr(route, "has_image_w" + suffix, False):
                img = route.route_image(show_header, show_route)
                up_buffer = BytesIO(img)
                up_buffer.seek(0)
                upload_to_s3("drawmyroute-maps", file_path, up_buffer)
                route.__setattr__("has_image_w" + suffix, True)
                route.save()
        else:
            file_path = route.images_path
            if not route.has_image_blank:
                img = route.route_image(False, False)
                up_buffer = BytesIO(img)
                up_buffer.seek(0)
                upload_to_s3("drawmyroute-maps", file_path, up_buffer)
                route.has_image_blank = True
                route.save()

    def handle(self, *args, **options):
        qs = Route.objects.all()
        for r in qs:
            print("Processing route: {} by {}".format(r.name, r.athlete))
            self.generate_thumb(r)
            self.generate_map(r, True, False)  # has_image_w_header
            self.generate_map(r, True, True)  # has_image_w_header_route
            self.generate_map(r, False, True)  # has_image_w_route
            self.generate_map(r, False, False)  # has_image_blank
        self.stdout.write(self.style.SUCCESS("Done"))
