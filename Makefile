SHELL := /bin/bash

install:
	npm install

build:
	npm run build

start:
	npm run start

dev:
	npm run dev

test:
	npm test

lint:
	npm run lint && npm run lint:types

test-e2e:
	npm run test:e2e

docker-build:
	docker build -t evergreenos/selfhost-console:latest .

docker-up:
	docker compose up --build

docker-down:
	docker compose down

.PHONY: install build start dev test lint test-e2e docker-build docker-up docker-down
