import base64
import hashlib
import json
import re
import time
from datetime import datetime
from io import BytesIO

from django.conf import settings
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile, File
from django.core.validators import validate_slug
from django.db import models
from django.db.models import Value
from django.urls import reverse
from django.utils.timezone import now, utc

from PIL import Image
from utils.gps_data_encoder import GeoLocation, GeoLocationSeries
from utils.helper import tz_at_coords, random_key, time_base64, country_at_coords
from utils.storages import OverwriteImageStorage
from utils.validators import (validate_corners_coordinates, validate_latitude,
                              validate_longitude, validate_nice_slug)


def map_upload_path(instance=None, file_name=None):
    import os.path
    tmp_path = [
        'maps'
    ]
    if file_name:
        pass
    time_hash = time_base64()
    basename = instance.uid + '_' + time_hash
    tmp_path.append(basename[0])
    tmp_path.append(basename[1])
    tmp_path.append(basename)
    return os.path.join(*tmp_path)


class RasterMap(models.Model):
    uid = models.CharField(
        default=random_key,
        max_length=12,
        editable=False,
        unique=True,
    )
    creation_date = models.DateTimeField(auto_now_add=True)
    modification_date = models.DateTimeField(auto_now=True)
    uploader = models.ForeignKey(
        User,
        related_name='maps',
        on_delete=models.CASCADE
    )
    image = models.ImageField(
        upload_to=map_upload_path,
        height_field='height',
        width_field='width'
    )
    height = models.PositiveIntegerField(
        null=True,
        blank=True,
        editable=False
    )
    width = models.PositiveIntegerField(
        null=True,
        blank=True,
        editable=False,
    )
    corners_coordinates = models.CharField(
        max_length=255,
        help_text='Latitude and longitude of map corners separated by commas '
        'in following order Top Left, Top right, Bottom Right, Bottom left. '
        'eg: 60.519,22.078,60.518,22.115,60.491,22.112,60.492,22.073',
        validators=[validate_corners_coordinates]
    )

    @property
    def path(self):
        return self.image.path[len(settings.MEDIA_ROOT) + 1:]

    @property
    def data(self):
        with self.image.open('rb') as fp:
            data = fp.read()
        return data

    @property
    def mime_type(self):
        img = Image.open(self.image.open())
        self.image.close()
        return 'image/{}'.format(img.format.lower())

    @property
    def data_uri(self):
        return 'data:{};base64,{}'.format(
            self.mime_type,
            base64.b64encode(self.data).decode('utf-8')
        )

    @data_uri.setter
    def data_uri(self, value):
        if not value:
            raise ValueError('Value can not be null')
        data_matched = re.match(
            r'^data:image/(?P<format>jpeg|png|gif);base64,'
            r'(?P<data_b64>(?:[A-Za-z0-9+/]{4})*'
            r'(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?)$',
            value
        )
        if data_matched:
            self.image.save(
                'filename',
                ContentFile(
                    base64.b64decode(data_matched.group('data_b64'))
                ),
                save=False
            )
            self.image.close()
        else:
            raise ValueError('Not a base 64 encoded data URI of an image')

    def strip_exif(self):
        if self.image.closed:
            self.image.open()
        with Image.open(self.image.file) as image:
            is_jpeg = image.format.lower() == 'jpeg'
            if not is_jpeg:
                return
            data = image.getdata()
            image_without_exif = Image.new(image.mode, image.size)
            image_without_exif.putdata(data)
            out_buffer = BytesIO()
            image_without_exif.save(out_buffer, image.format.lower())
        f_new = File(out_buffer, name=self.image.name)
        self.image.save(
            'filename',
            f_new,
            save=False,
        )
        self.image.close()

    @property
    def hash(self):
        hash = hashlib.sha256()
        hash.update(self.data_uri.encode('utf-8'))
        hash.update(self.corners_coordinates.encode('utf-8'))
        return base64.b64encode(hash.digest()).decode('utf-8')

    @property
    def bounds(self):
        cal_values = self.corners_coordinates.split(',')
        return {
            'top_left': [cal_values[0], cal_values[1]],
            'top_right': [cal_values[2], cal_values[3]],
            'bottom_right': [cal_values[4], cal_values[5]],
            'bottom_left': [cal_values[6], cal_values[7]],
        }

    @bounds.setter
    def bounds(self, value):
        self.corners_coordinates = '{},{},{},{},{},{},{},{}'.format(
            value['top_left'][0], value['top_left'][1],
            value['top_right'][0], value['top_right'][1],
            value['bottom_right'][0], value['bottom_right'][1],
            value['bottom_left'][0], value['bottom_left'][1],
        )


    @property
    def thumbnail_url(self):
        return '{}_256x256'.format(self.image.url)

    @property
    def thumbnail(self):
        orig = self.image.storage.open(
            self.image.name,
            'rb'
        ).read()
        img = Image.open(BytesIO(orig))
        if img.mode != 'RGBA':
            img = img.convert('RGB') 
        img = img.transform(
            (256, 256),
            Image.QUAD,
            (
                int(self.width) / 2 - 256,
                int(self.height) / 2 - 256,
                int(self.width) / 2 - 256,
                int(self.height) / 2 + 256,
                int(self.width) / 2 + 256,
                int(self.height) / 2 + 256,
                int(self.width) / 2 + 256,
                int(self.height) / 2 - 256
            )
        )
        img_out = Image.new(
            'RGB',
            img.size, 
            (255, 255, 255, 0)
        )
        img_out.paste(img, (0, 0))
        img.close()
        return img_out

    def __str__(self):
        return 'map <{}>'.format(self.uid)

    class Meta:
        ordering = ['-creation_date']
        verbose_name = 'raster map'
        verbose_name_plural = 'raster maps'


class Route(models.Model):
    uid = models.CharField(
        default=random_key,
        max_length=12,
        editable=False,
        unique=True,
    )
    creation_date = models.DateTimeField(auto_now_add=True)
    modification_date = models.DateTimeField(auto_now=True)
    athlete = models.ForeignKey(User, related_name='routes', on_delete=models.CASCADE)
    name = models.CharField(max_length=52)
    route_json = models.TextField()
    raster_map = models.ForeignKey(RasterMap, blank=True, null=True, on_delete=models.SET_NULL)
    start_time = models.DateTimeField(editable=False)
    
    def save(self, *args, **kwargs):
        self.start_time = datetime.fromtimestamp(self.route[0]['time'], utc)
        super().save(*args, **kwargs)
    
    @property
    def route(self):
        return json.loads(self.route_json)

    @route.setter
    def route(self, value):
        self.route_json = json.dumps(value)

    @property
    def api_url(self):
        return reverse('route_detail', kwargs={'uid': self.uid})

    @property
    def tz(self):
        return tz_at_coords(
            self.route[0]['latlon'][0],
            self.route[0]['latlon'][1],
        )

    @property
    def country(self):
        return country_at_coords(
            self.route[0]['latlon'][0],
            self.route[0]['latlon'][1],
        )

    class Meta:
        ordering = ['-start_time']
        verbose_name = 'route'
        verbose_name_plural = 'routes'
