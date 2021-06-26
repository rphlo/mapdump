import os
import urllib
from io import BytesIO
import re
import json
import time

from django.contrib.auth.models import User
from django.contrib.auth.signals import user_logged_in
from django.shortcuts import get_object_or_404, render
from django.conf import settings
from django.http import HttpResponse, HttpResponseRedirect
from django.contrib.auth.decorators import login_required

from knox.models import AuthToken

from rest_framework.decorators import api_view
from rest_framework import generics, parsers, status
from rest_framework.permissions import IsAuthenticated, SAFE_METHODS
from rest_framework.authtoken.serializers import AuthTokenSerializer
from rest_framework.response import Response

from stravalib import Client as StravaClient

from routedb.models import RasterMap, Route
from routedb.serializers import (
    RouteSerializer,
    UserMainSerializer,
    LatestRouteListSerializer,
    EmailSerializer,
    ResendVerificationSerializer,
    UserInfoSerializer,
    MapListSerializer,
)
from utils.s3 import s3_object_url, upload_to_s3

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
    
    response_status = status.HTTP_200_OK
    if request.method == 'GET':
        response_status = status.HTTP_206_PARTIAL_CONTENT
    
    response = HttpResponse('', status=response_status)
    
    if request.method == 'GET':
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


class EmailsView(generics.ListCreateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = EmailSerializer

    def get_queryset(self):
        return self.request.user.emailaddress_set.all().order_by('-primary', '-verified', 'email')

    def perform_create(self, serializer):
        return serializer.save(user=self.request.user)

class EmailDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = EmailSerializer
    lookup_field = 'email'

    def get_queryset(self):
        return self.request.user.emailaddress_set.all()

class ResendVerificationView(generics.GenericAPIView):
    serializer_class = ResendVerificationSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RouteCreate(generics.CreateAPIView):
    queryset = Route.objects.all()
    serializer_class = RouteSerializer
    permission_classes = (IsAuthenticated,)


class LatestRoutesList(generics.ListAPIView):
    queryset = Route.objects.all().select_related('athlete')[:24]
    serializer_class = LatestRouteListSerializer


class MapsList(generics.ListAPIView):
    queryset = RasterMap.objects.all().prefetch_related('route_set', 'route_set__athlete')
    serializer_class = MapListSerializer

class UserDetail(generics.RetrieveAPIView):
    serializer_class = UserMainSerializer
    lookup_field = 'username'

    def get_queryset(self):
        username = self.kwargs['username']
        return User.objects.filter(username=username).prefetch_related('routes')

class UserEditView(generics.RetrieveUpdateAPIView):
    serializer_class = UserInfoSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user

    def get_queryset(self):
        return User.objects.none()

class RouteDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RouteSerializer
    lookup_field = 'uid'
    queryset = Route.objects.all().select_related('athlete', 'raster_map')

    def get_queryset(self):
        if self.request.method not in SAFE_METHODS:
            return super().get_queryset().filter(athlete_id=self.request.user.id)
        return super().get_queryset()

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        rmap = obj.raster_map
        if rmap.route_set.exclude(id=obj.id).count() == 0:
            rmap.delete()
        return super().destroy(request, *args, **kwargs)


def raster_map_download(request, uid, *args, **kwargs):
    rmap = get_object_or_404(
        RasterMap,
        uid=uid,
    )
    file_path = rmap.path
    mime_type = rmap.mime_type
    return serve_from_s3(
        'drawmyroute-maps',
        request,
        '/internal/' + file_path,
        filename='{}.{}'.format(rmap.uid, mime_type[6:]),
        mime=mime_type
    )


def map_download(request, uid, *args, **kwargs):
    show_header = request.GET.get('show_header', False)
    show_route = request.GET.get('show_route', False)
    out_bounds = request.GET.get('out_bounds', False)
    route = get_object_or_404(
        Route.objects.select_related('raster_map'),
        uid=uid,
    )
    suffix = '_header' if show_header else ''
    suffix += '_route' if show_route else ''
    if show_header or show_route:
        file_path = route.images_path + suffix
        mime_type = 'image/jpeg'
        if not getattr(route, 'has_image_w' + suffix, False):
            img = route.route_image(show_header, show_route)
            up_buffer = BytesIO(img)
            up_buffer.seek(0)
            upload_to_s3('drawmyroute-maps', file_path, up_buffer)
            route.__setattr__('has_image_w' + suffix, True)
            route.save()
            return HttpResponse(img, content_type=mime_type)
    elif out_bounds:
        file_path = route.images_path
        mime_type = 'image/jpeg'
        if not route.has_image_blank:
            img = route.route_image(False, False)
            up_buffer = BytesIO(img)
            up_buffer.seek(0)
            upload_to_s3('drawmyroute-maps', file_path, up_buffer)
            route.has_image_blank = True
            route.save()
            return HttpResponse(img, content_type=mime_type)
    else:
        file_path = route.raster_map.path
        mime_type = route.raster_map.mime_type
    return serve_from_s3(
        'drawmyroute-maps',
        request,
        '/internal/' + file_path,
        filename='{}{}.{}'.format(route.name, suffix, mime_type[6:]),
        mime=mime_type
    )


def map_thumbnail(request, uid, *args, **kwargs):
    route = get_object_or_404(
        Route.objects.select_related('raster_map'),
        uid=uid,
    )
    file_path = route.raster_map.path + '_thumb'
    if not route.has_image_thumbnail:
        image = route.raster_map.thumbnail
        up_buffer = BytesIO()
        image.save(up_buffer, 'JPEG', quality=80)
        up_buffer.seek(0)
        upload_to_s3('drawmyroute-maps', file_path, up_buffer)
        route.has_image_thumbnail = True
        route.save()
        response = HttpResponse(content_type='image/jpeg')
        image.save(response, 'JPEG', quality=80)
        return response
    return serve_from_s3(
        'drawmyroute-maps',
        request,
        '/internal/' + file_path,
        filename='{}_thumbnail.jpg'.format(route.name),
        mime='image/jpeg'
    )


def gpx_download(request, uid, *args, **kwargs):
    route = get_object_or_404(
        Route,
        uid=uid,
    )
    gpx_data = route.gpx
    response = HttpResponse(
        gpx_data,
        content_type='application/gpx+xml'
    )
    response['Content-Disposition'] = 'attachment; filename="{}.gpx"'.format(
        route.name.replace('\\', '_').replace('"', '\\"')
    )
    return response


@api_view(['GET'])
@login_required
def strava_authorize(request):
    code = request.GET.get('code')
    scopes = request.GET.get('scope', '').split(',')
    if not code or 'activity:read_all' not in scopes or 'activity:write' not in scopes:
        return HttpResponseRedirect(settings.URL_FRONT+'/new')
    client = StravaClient()
    access_token = client.exchange_code_for_token(
        client_id=settings.MY_STRAVA_CLIENT_ID,
        client_secret=settings.MY_STRAVA_CLIENT_SECRET,
        code=code
    )
    user_settings = request.user.settings
    user_settings.strava_access_token = json.dumps(access_token) 
    user_settings.save()
    return HttpResponseRedirect(settings.URL_FRONT + '/new')


@api_view(['GET'])
@login_required
def strava_access_token(request):
    user_settings = request.user.settings
    if user_settings.strava_access_token:
        token = json.loads(user_settings.strava_access_token)
        if time.time() < token['expires_at']:
            return Response({'strava_access_token': token['access_token'], 'expires_at': token['expires_at']})
        client = StravaClient()
        try:
            access_token = client.refresh_access_token(
                client_id=settings.MY_STRAVA_CLIENT_ID,
                client_secret=settings.MY_STRAVA_CLIENT_SECRET,
                refresh_token=token['refresh_token']
            )
        except Exception:
            user_settings.strava_access_token = ''
            user_settings.save()
            return Response({})
        user_settings.strava_access_token = json.dumps(access_token)
        user_settings.save()
        return Response({'strava_access_token': access_token['access_token'], 'expires_at': access_token['expires_at']})
    return Response({})


@api_view(['POST'])
@login_required
def strava_deauthorize(request):
    user_settings = request.user.settings
    if user_settings.strava_access_token:
        token = json.loads(user_settings.strava_access_token)
        client = StravaClient(token['access_token'])
        try:
            client.deauthorize()
        except Exception:
            pass
        user_settings.strava_access_token = None
        user_settings.save()
    return Response({})


def index_view(request):
    return render(request, 'frontend/index.html')

def route_view(request, route_id):
    route = get_object_or_404(Route.objects.select_related('athlete'), uid=route_id)
    return render(request, 'frontend/route.html', {'route': route, 'athlete': route.athlete})

def athlete_view(request, athlete_username):
    athlete = get_object_or_404(User, username__iexact=athlete_username)
    return render(request, 'frontend/athlete.html', {'athlete': athlete})

