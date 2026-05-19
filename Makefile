PYTHON ?= python3
OFFLINE_PYTHON ?= $(shell if [ -x /usr/local/anaconda3/envs/py310/bin/python ]; then echo /usr/local/anaconda3/envs/py310/bin/python; else echo python3; fi)
PYTHONPATH := .vendor:.

.PHONY: test compile verify sample-pilot sample-five-step list-agents offline-bundle

test:
	PYTHONPATH=$(PYTHONPATH) $(PYTHON) -m unittest discover -s tests -v

compile:
	PYTHONPATH=$(PYTHONPATH) $(PYTHON) -m compileall -q agent_platform material_agent tests

sample-pilot:
	PYTHONPATH=$(PYTHONPATH) $(PYTHON) -m material_agent.cli run-pilot --limit 30

sample-five-step:
	PYTHONPATH=$(PYTHONPATH) $(PYTHON) -m material_agent.cli run-five-step

list-agents:
	PYTHONPATH=$(PYTHONPATH) $(PYTHON) -m material_agent.cli list-agents

verify: compile test sample-pilot sample-five-step

offline-bundle:
	PYTHON_BIN=$(OFFLINE_PYTHON) bash scripts/offline/build_offline_bundle.sh
