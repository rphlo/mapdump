all: build push
	@echo "All done!"

build:
	docker build -t rphl/mapdump-dev-server:latest -f docker/django.dockerfile .

push:
	docker push rphl/mapdump-dev-server:latest
