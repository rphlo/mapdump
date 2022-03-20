import os

from django.core.files.storage import FileSystemStorage


class OverwriteImageStorage(FileSystemStorage):
    """Storage that delete a previous file with the same name
    and its copy at different resolution
    """

    def get_available_name(self, name, max_length=None):
        # If the filename already exists,
        # remove it and its copy at different resolution as if it was a true
        # file system
        if self.exists(name):
            self.delete(name)
        return super(OverwriteImageStorage, self).get_available_name(name, max_length)

    def isdir(self, name):
        return os.path.isdir(self.path(name))

    def makedirs(self, name):
        os.makedirs(self.path(name))

    def url(self, name):
        return "/media/{}".format(name)
