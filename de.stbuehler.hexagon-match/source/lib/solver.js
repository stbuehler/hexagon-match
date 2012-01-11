var hm = hm || {};

hm.solve = function(level, uniqueSolution) {
	var occupied = [];
	var i, j;
	var solution = null;
	var cursolution = [];
	var usedcols = { };

	function makeTag(c1, c2) {
		return (c1 < c2) ? c1+c2 : c2+c1;
	}
	function possibleCols(c1, c2) {
		var tags = [], i, j, clist = level.colors, c;
		if ('?' == c1 && '?' == c2) {
			for (i = 0; i < clist.length; i++) {
				for (j = i; j < clist.length; j++) {
					c =  clist[i] + clist[j];
					if (!usedcols[c]) tags.push(c);
				}
			}
		} else if ('?' == c1) {
			for (i = 0; i < clist.length; i++) {
				c =  makeTag(clist[i], c2);
				if (!usedcols[c]) tags.push(c);
			}
		} else if ('?' == c2) {
			for (i = 0; i < clist.length; i++) {
				c =  makeTag(clist[i], c1);
				if (!usedcols[c]) tags.push(c);
			}
		} else {
			c =  makeTag(c1, c2);
			if (!usedcols[c]) tags.push(c);
		}
		return tags;
	}

	function addMoveWith(r, x, y, tx, ty, direction) {
		var i, cols = possibleCols(level.lines[y][x], level.lines[ty][tx]);
		for (i = 0; i < cols.length; i++) {
			r.push({sx: x, sy: y, tx: tx, ty: ty, direction: direction, tag: cols[i] });
		}
	}

	function nextNeighbours(x, y) {
		var r = [];
		var tx = x;
		if (x < 0 || y < 0 || x >= level.width || y >= level.height) return r;
		if (x + 1 < level.width && !occupied[y][x+1]) addMoveWith(r, x, y, x+1, y, 1);
		if (y + 1 < level.height) {
			if (0 === y % 2) tx = tx-1;
			if (tx >= 0 && !occupied[y+1][tx]) addMoveWith(r, x, y, tx, y+1, 3);
			tx = tx + 1;
			if (tx < level.width && !occupied[y+1][tx]) addMoveWith(r, x, y, tx, y+1, 2);
		}
		return r;
	}

	function run(x, y) {
		var l, i, n, r = 0;

		if (x >= level.width) {
			y++;
			x = 0;
			if (y >= level.height) {
				if (!solution) solution = cursolution.slice();
				return 1;
			}
		}
		while (occupied[y][x]) {
			x++;
			if (x >= level.width) {
				y++;
				x = 0;
				if (y >= level.height) {
					if (!solution) solution = cursolution.slice();
					return 1;
				}
			}
		}

		occupied[y][x] = 1;
		l = nextNeighbours(x, y);
		for (i = 0; i < l.length; i++) {
			n = l[i];
			usedcols[n.tag] = 1;
			cursolution.push(n);
			occupied[n.ty][n.tx] = 1;
			r += run(x+1, y);
			occupied[n.ty][n.tx] = 0;
			cursolution.pop();
			usedcols[n.tag] = 0;
			if (r > 1) break; /* we only want to know whether it is unique, not the count of possible solutions */
		}
		occupied[y][x] = 0;
		return r;
	}

	for (j = 0; j < level.height; j++) {
		occupied[j] = [];
		for (i = 0; i < level.width; i++) {
			occupied[j][i] = (' ' == level.lines[j][i]) ? 1 : 0;
		}
	}

	var r = run(0, 0);
	if (r === 0) return false;
	if (r > 1) {
		if (uniqueSolution) return false;
		if (enyo && enyo.warn) enyo.warn("Solution not unique");
	}
	return { solution: solution, unique: r == 1 };
};
