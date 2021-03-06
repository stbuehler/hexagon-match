var hm = hm || {};

hm.levelPattern = function(level) {
	var i, j, l, lines = level.lines, n;
	level = {
		title: 'Pattern ' + level.title,
		width: level.width,
		height: level.height,
		colors: level.colors,
		lines: []
	};
	for (j = 0; j < lines.length; j++) {
		l = lines[j];
		n = '';
		for (i = 0; i < l.length; i++) {
			n += (' ' == l[i]) ? ' ' : '?';
		}
		level.lines.push(n);
	}
	return level;
};

hm.allTags = function (colors) {
	var i, j, tags = [];
	for (j = 0; j < colors.length; j++) {
		for (i = j; i < colors.length; i++) {
			tags.push(colors[i] + colors[j]);
		}
	}
	return tags;
};

hm.fillPattern = function (level, uniqueSolution, filter) {
	var i;
	var tags = hm.allTags(level.colors);
	var lines = level.lines, width = level.width, height = level.height;
	var tries = 0, totals = 0, filtered = 0;
	var rndOrder = [];

	function strToArray(s) {
		var a = [];
		for (var i = 0; i < s.length; ++i) a[i] = s[i];
		return a;
	}
	function arrToString(a) {
		return ''.concat.apply('', a);
	}

	function addMoveWith(r, x, y, tx, ty, tag) {
		r.push({sx: x, sy: y, tx: tx, ty: ty, scolor: tag[0], tcolor: tag[1] });
		if (tag[0] != tag[1]) {
			r.push({sx: x, sy: y, tx: tx, ty: ty, scolor: tag[1], tcolor: tag[0] });
		}
	}

	function nextNeighbours(x, y, tag) {
		var r = [];
		var tx = x;
		if (x < 0 || y < 0 || x >= width || y >= height) return r;
		if (x + 1 < width && ('?' == lines[y][x+1])) addMoveWith(r, x, y, x+1, y, tag);
		if (y + 1 < height) {
			if (0 === y % 2) tx = tx-1;
			if (tx >= 0 && ('?' == lines[y+1][tx])) addMoveWith(r, x, y, tx, y+1, tag);
			tx = tx + 1;
			if (tx < width && ('?' == lines[y+1][tx])) addMoveWith(r, x, y, tx, y+1, tag);
		}
		return r;
	}

	function run(x, y, tagndx) {
		var l, i, n, ord = rndOrder[tagndx];

		if (x >= width) {
			++y;
			x = 0;
			if (y >= height) {
				++tries; ++totals;
				//if (0 === totals % 20000 && console && console.log) console.log("Running solver after " + totals + " tries.");
				if (filter && !filter(level)) { ++filtered; return false; };
				if (uniqueSolution && !hm.solve(level, true)) return false;
				return true;
			}
		}
		while ('?' != lines[y][x]) {
			++x;
			if (x >= width) {
				++y;
				x = 0;
				if (y >= height) {
					++tries; ++totals;
					//if (0 === totals % 20000 && console && console.log) console.log("Running solver after " + totals + " tries.");
					if (filter && !filter(level)) { ++filtered; return false; }
					if (uniqueSolution && !hm.solve(level, true)) return false;
					return true;
				}
			}
		}

		l = nextNeighbours(x, y, tags[tagndx]);
		l.doShuffle();
		for (i = 0; i < ord.length; ++i) {
			n = l[ord[i]];
			if (!n) continue;
			lines[n.sy][n.sx] = n.scolor;
			lines[n.ty][n.tx] = n.tcolor;
			if (run(x+1, y, tagndx+1)) return true;
			lines[n.ty][n.tx] = '?';
			if (tries >= 15000) break;
		}
		lines[y][x] = '?';
		return false;
	}

	function randomizeOrder() {
		var i, l = [0,1,2,3,4,5], thin = 2*tags.length / 3, ll;
		for (i = 0; i < tags.length; ++i) {
			ll = l.shuffle();
			if (i < thin) ll.splice(3, 3);
			rndOrder[i] = ll;
		}
	}

	for (i = 0; i < lines.length; ++i) {
		lines[i] = strToArray(lines[i]);
	}

	while (true) {
		tries = 0;
		tags.doShuffle();
		randomizeOrder();
		var r = run(0, 0, 0);
		if (r) break;
		if (tries > 0 && console && console.log) console.log("No solution found after " + totals + " tries (" + filtered + " were filtered), restart.");
	}

	for (i = 0; i < lines.length; i++) {
		lines[i] = arrToString(lines[i]);
	}
	if (console && console.log) console.log("Found solution after " + totals + " tries (" + filtered + " were filtered).");

	return r;

};
