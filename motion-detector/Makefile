name = $(notdir $(realpath .))
host = $(name)
pwd = $(realpath .)
running = $(shell docker ps -f name=$(name) |wc -l)

default: build

build:
	docker build -t $(name) $(pwd)

run: stop build wait start console

start:
	docker run -d -p 8080:80 --name $(host) -h $(host).danielgrants.com $(name)

stop:
ifeq ($(running),2)
	-docker stop $(name) $(name)2
endif
	$(eval running = 1)

kill:
	-docker kill $(name) $(name)2
	$(eval running = 1)

restart:
	docker restart $(name)

wait:
	sleep 1

log:
	docker logs $(name)

clean: kill wait
	-docker rmi `docker images -a |grep -Po '(?<=<none>              )[0-9a-z]{12}'`
#	docker volume rm ldap-db ldap2-db
#	docker volume create ldap-db

shell: console

console:
	docker exec -it $(name) /bin/bash

status:
	docker exec -it $(name) /usr/bin/supervisorctl status
