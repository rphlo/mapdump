import math


class GlobalMercator(object):
    def __init__(self):
        self.originShift = 2 * math.pi * 6378137 / 2.0
        # 20037508.342789244

    def latlon_to_meters(self, latlon):
        """
        Converts given lat/lon in WGS84 Datum to XY in Spherical Mercator
        EPSG:900913
        """
        lon = latlon['lng']
        lat = latlon['lat']
        mx = lon * self.originShift / 180.0
        my = math.log(math.tan((90 + lat) * math.pi / 360.0)) / (
                    math.pi / 180.0)

        my = my * self.originShift / 180.0
        return {'x': mx, 'y': my}

    def meters_to_latlon(self, mxy):
        """
        Converts XY point from Spherical Mercator EPSG:900913 to lat/lon
        in WGS84 Datum
        """

        mx = mxy['x']
        my = mxy['y']

        lon = (mx / self.originShift) * 180.0
        lat = (my / self.originShift) * 180.0

        lat = 180 / math.pi * (2 * math.atan(
            math.exp(lat * math.pi / 180.0)) - math.pi / 2.0)
        return {'lat': lat, 'lng': lon}
