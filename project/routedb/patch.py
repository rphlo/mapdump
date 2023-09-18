import patchy
from requests.adapters import HTTPAdapter


def patch_requests_default_timeout():
    """
    Set a default timeout for all requests made with “requests”.

    Upstream is waiting on this longstanding issue:
    https://github.com/psf/requests/issues/3070
    """

    patchy.patch(
        HTTPAdapter.send,
        """\
        @@ -15,6 +15,8 @@
             :param proxies: (optional) The proxies dictionary to apply to the request.
             :rtype: requests.Response
             \"""
        +    if timeout is None:
        +        timeout = 5.0

             try:
                 conn = self.get_connection(request.url, proxies)
        """,
    )