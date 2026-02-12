## help: print this help message
.PHONY: help
help:
	@echo 'Usage'
	@echo '-----'
	@grep '^##' ${MAKEFILE_LIST} | column -t -s ':' | sed 's/^## /  /'

## format: format code using ruff
format:
	@uv run ruff check --select I --fix --quiet
	@uv run ruff format --quiet

## lint: lint code using ruff
lint:
	@uv run ruff check

## type: type check code using ty
type:
	@uv run ty check
