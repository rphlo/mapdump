from django.contrib import admin, messages
from django.utils.translation import ngettext
from routedb.models import RasterMap, Route, UserSettings


class RasterMapAdmin(admin.ModelAdmin):
    list_display = (
        "uploader",
        "creation_date",
        "uid",
    )
    fields = (
        "uploader",
        "image",
        "corners_coordinates",
    )


class RouteAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "start_time",
        "athlete",
    )
    fields = ("athlete", "name", "route_json", "raster_map")
    list_filter = ("athlete",)
    actions = ["clear_images"]

    @admin.action(description="Clear images")
    def clear_images(self, request, qs):
        updated = qs.update(
            has_image_w_header=False,
            has_image_w_route=False,
            has_image_w_header_route=False,
            has_image_thumbnail=False,
            has_image_blank=False,
        )
        self.message_user(
            request,
            ngettext(
                "%d route images was cleared.",
                "%d routes images were cleared.",
                updated,
            )
            % updated,
            messages.SUCCESS,
        )


class UserSettingsAdmin(admin.ModelAdmin):
    list_display = ("user", "strava_access_token")
    list_filter = ("user",)


admin.site.register(RasterMap, RasterMapAdmin)
admin.site.register(Route, RouteAdmin)
admin.site.register(UserSettings, UserSettingsAdmin)
