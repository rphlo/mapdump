from django.urls import include, path, re_path

from . import feeds, views

urlpatterns = [
    path("routes/new", views.RouteCreate.as_view(), name="route_create"),
    path("latest-routes/", views.LatestRoutesList.as_view(), name="latest_routes_list"),
    re_path(
        r"^routes-by-tag/(?P<tag>[a-zA-Z0-9_]+)/?$",
        views.RoutesForTagList.as_view(),
        name="routes_by_tag_list",
    ),
    path("latest-routes/feed/", feeds.latest_routes_feed, name="latest_routes_feed"),
    path("maps/", views.MapsList.as_view(), name="maps_list"),
    re_path(
        r"^user/(?P<username>[a-zA-Z0-9_-]+)/?$",
        views.UserDetail.as_view(),
        name="user_detail",
    ),
    re_path(
        r"^user/(?P<username>[a-zA-Z0-9_-]+)/feed/?$",
        feeds.athlete_routes_feed,
        name="user_feed",
    ),
    re_path(
        r"^route/(?P<uid>[a-zA-Z0-9_-]+)/?$",
        views.RouteDetail.as_view(),
        name="route_detail",
    ),
    re_path(
        r"^route/(?P<uid>[a-zA-Z0-9_-]+)/gpx/?$",
        views.gpx_download,
        name="gpx_download",
    ),
    re_path(
        r"^route/(?P<uid>[a-zA-Z0-9_-]+)/map/?$", views.map_download, name="map_image"
    ),
    re_path(
        r"^route/(?P<uid>[a-zA-Z0-9_-]+)/thumbnail/?$",
        views.map_thumbnail,
        name="map_thumbnail",
    ),
    re_path(
        r"^route/(?P<uid>[a-zA-Z0-9_-]+)/opengraph-thumbnail/?$",
        views.map_og_thumbnail,
        name="map_og_thumbnail",
    ),
    re_path(
        r"^map/(?P<uid>[a-zA-Z0-9_-]+)/image/?$",
        views.raster_map_download,
        name="raster_map_image",
    ),
    path("auth/user/", view=views.UserEditView.as_view(), name="auth_user_detail"),
    path(
        "auth/user/settings/",
        views.UserSettingsDetail.as_view(),
        name="user_settings_detail",
    ),
    re_path(r'^auth/password-reset/confirm/(?P<uidb64>[0-9A-Za-z_\-]+)/(?P<token>[0-9A-Za-z]{1,13}-[0-9A-Za-z]{1,32})/$',
        TemplateView.as_view(template_name="password_reset_confirm.html"),
        name='password_reset_confirm'
    ),
    path("auth/", include("dj_rest_auth.urls")),
    path("auth/registration/", include("dj_rest_auth.registration.urls")),
    path("auth/emails/", view=views.EmailsView.as_view(), name="auth_emails"),
    re_path(
        r"^auth/emails/(?P<email>[^/]+)/?$",
        views.EmailDetailView.as_view(),
        name="auth_email_detail",
    ),
    path(
        "auth/registration/resend-verification/",
        views.ResendVerificationView.as_view(),
        name="auth_resend_verification",
    ),
    path("auth/login", view=views.LoginView.as_view(), name="knox_login"),
    path("strava/token", view=views.strava_access_token, name="strava_token"),
    path("strava/authorization", view=views.strava_authorize, name="strava_authorize"),
    path(
        "strava/deauthorize", view=views.strava_deauthorize, name="strava_deauthorize"
    ),
]
