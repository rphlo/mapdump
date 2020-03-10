import urllib
from django.contrib.auth.models import User
from django.contrib.auth.signals import user_logged_in
from django.shortcuts import get_object_or_404
from knox.models import AuthToken
from django.conf import settings
import re
from django.http import HttpResponse
from rest_framework import generics, parsers, renderers, status
from rest_framework.permissions import IsAuthenticated, SAFE_METHODS
from routedb.models import RasterMap, Route
from routedb.serializers import RouteSerializer, UserMainSerializer, LatestRouteListSerializer
from rest_framework.authtoken.serializers import AuthTokenSerializer
from rest_framework.response import Response
from utils.s3 import s3_object_url


def x_accel_redirect(request, path, filename='',
                     mime='application/force-download'):
    if settings.DEBUG:
        from wsgiref.util import FileWrapper
        import os.path
        path = re.sub(r'^/internal', settings.MEDIA_ROOT, path)
        if not os.path.exists(path):
            return HttpResponse(status=status.HTTP_404_NOT_FOUND)
        wrapper = FileWrapper(open(path, 'rb'))
        response = HttpResponse(wrapper)
        response['Content-Length'] = os.path.getsize(path)
    else:
        response = HttpResponse('', status=status.HTTP_206_PARTIAL_CONTENT)
        response['X-Accel-Redirect'] = urllib.parse.quote(path.encode('utf-8'))
        response['X-Accel-Buffering'] = 'no'
        response['Accept-Ranges'] = 'bytes'
    response['Content-Type'] = mime
    response['Content-Disposition'] = 'attachment; filename="{}"'.format(
        filename.replace('\\', '_').replace('"', '\\"')
    ).encode('utf-8')
    return response


def serve_from_s3(bucket, request, path, filename='',
                  mime='application/force-download'):
    path = re.sub(r'^/internal/', '', path)
    url = s3_object_url(path, bucket)
    url = '/s3{}'.format(url[len(settings.AWS_S3_ENDPOINT_URL):])
    response = HttpResponse('', status=status.HTTP_206_PARTIAL_CONTENT)
    response['X-Accel-Redirect'] = urllib.parse.quote(url.encode('utf-8'))
    response['X-Accel-Buffering'] = 'no'
    response['Accept-Ranges'] = 'bytes'
    response['Content-Type'] = mime
    response['Content-Disposition'] = 'attachment; filename="{}"'.format(
        filename.replace('\\', '_').replace('"', '\\"')
    ).encode('utf-8')
    return response


class LoginView(generics.CreateAPIView):
    """
    Login View: mix of knox login view and drf obtain auth token view
    """
    throttle_classes = ()
    permission_classes = ()
    parser_classes = (parsers.FormParser, parsers.MultiPartParser,
                      parsers.JSONParser,)
    serializer_class = AuthTokenSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.serializer_class(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        authToken, token = AuthToken.objects.create(user)
        user_logged_in.send(
            sender=user.__class__,
            request=request,
            user=user
        )
        return Response({
            'username': user.username,
            'token': token
        })


class RouteCreate(generics.CreateAPIView):
    queryset = Route.objects.all()
    serializer_class = RouteSerializer
    permission_class = IsAuthenticated


class LatestRoutesList(generics.ListAPIView):
    queryset = Route.objects.all().select_related('athlete')[:24]
    serializer_class = LatestRouteListSerializer

class UserDetail(generics.RetrieveAPIView):
    serializer_class = UserMainSerializer
    lookup_field = 'username'

    def get_queryset(self):
        username = self.kwargs['username']
        return User.objects.filter(username=username).prefetch_related('routes')

class RouteDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RouteSerializer
    lookup_field = 'uid'
    queryset = Route.objects.all().select_related('athlete', 'raster_map')

    def get_queryset(self):
        if self.request.method not in SAFE_METHODS:
            return super().get_queryset().filter(athlete_id=self.request.user.id)
        return super().get_queryset()


def map_download(request, uid, *args, **kwargs):
    route = get_object_or_404(
        Route.objects.select_related('raster_map'),
        uid=uid,
    )
    file_path = route.raster_map.path
    return serve_from_s3(
        'drawmyroute-maps',
        request,
        '/internal/' + file_path,
        filename='{}.{}'.format(route.name, route.raster_map.mime_type[6:]),
        mime=route.raster_map.mime_type
    )


def map_thumbnail(request, uid, *args, **kwargs):
    route = get_object_or_404(
        Route.objects.select_related('raster_map'),
        uid=uid,
    )
    image = route.raster_map.thumbnail
    response = HttpResponse(content_type='image/jpeg')
    image.save(response, 'JPEG')
    return response
