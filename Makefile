
all: package

package:
	palm-package de.stbuehler.hexagon-match

install:
	palm-install de.stbuehler.hexagon-match_*.ipk

launch:
	palm-launch de.stbuehler.hexagon-match

log:
	palm-log -f de.stbuehler.hexagon-match

chromium:
	chromium --allow-file-access-from-files de.stbuehler.hexagon-match/index.html

override JSPATH=de.stbuehler.hexagon-match/source/lib
node_search.js: ${JSPATH}/util.js ${JSPATH}/solver.js ${JSPATH}/rate.js ${JSPATH}/edit.js node_search_append.js
	cat $^ > $@

node_search: node_search.js
	node $<
	# xclip -o | grep Level | sed -e 's#Level found: \(.*\)#\1,#' | xclip

.PHONY: all package install launch chromium node_search
