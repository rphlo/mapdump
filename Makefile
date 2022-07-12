all: build-and-push
	@echo "All done!"

build-and-push:
	make build
	make push

build:
	docker build -t rphl/mapdump-dev-server:latest -f docker/django.dockerfile .

push:
	docker push rphl/mapdump-dev-server:latest
