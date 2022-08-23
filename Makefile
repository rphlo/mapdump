all: build push
	@echo "All done!"

build:
	docker build -t rphlo/mapdump-dev-server:latest -f docker/django.dockerfile .

push:
	docker push rphlo/mapdump-dev-server:latest
