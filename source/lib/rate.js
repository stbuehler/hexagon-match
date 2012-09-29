var hm = hm || {};

hm.Rating = function Rating(list) {
	this.list = list;
}

hm.Rating.prototype.unique = function(level) {
	level = Math.min(level, this.list.length-1);
	if (level < 0) return 0;
	return this.list[level].unique;
};

hm.Rating.prototype.easy = function(level) {
	level = Math.min(level, this.list.length-1);
	if (level < 0) return 0;
	return this.list[level].easyunique;
};

hm.rate = function(level) {
	var occupied = [];
	var i, j;
	var tags = {};
	var info = { unique: 0, easyunique: 0 };
	var l = level.lines;
	var w = level.width, h = level.height;

	function addMoveWith(r, x, y, tx, ty, othercol) {
		var col = l[ty][tx];
		if ('?' != col && -1 == othercol.indexOf(col)) return;
		r.push([x,y,tx,ty]);
		//r.push({sx: x, sy: y, tx: tx, ty: ty});
	}

	function nextNeighbours(r, x, y, tag) {
		if (occupied[y][x]) return;
		var col0 = l[y][x], col1;
		if (col0 == tag[0]) {
			col1 = tag[1]
		} else if (col0 == tag[1]) {
			col1 = tag[0];
		} else if (col0 == '?') {
			col1 = tag;
		} else {
			return;
		}

		var tx = x;
		if (x + 1 < w && !occupied[y][x+1]) addMoveWith(r, x, y, x+1, y, col1);
		if (y + 1 < h) {
			var ty = y + 1;
			if (0 === y % 2) tx = tx-1;
			if (tx >= 0 && !occupied[ty][tx]) addMoveWith(r, x, y, tx, ty, col1);
			++tx;
			if (tx < w && !occupied[ty][tx]) addMoveWith(r, x, y, tx, ty, col1);
		}
	}

	function placesFor(tag) {
		var x, y, r = [];
		for (x = 0; x < w; ++x) {
			for (y = 0; y < h; ++y) {
				nextNeighbours(r, x, y, tag);
			}
		}
		return r;
	}

	function firstSearch() {
		var remove = [];
		var i, j, tag, l;
		for (i = 0; i < level.colors.length; ++i) {
			for (j = i; j < level.colors.length; ++j) {
				tag = level.colors[i] + level.colors[j];
				tags[tag] = l = placesFor(tag);
				if (1 == l.length) remove.push(tag);
			}
		}
		return remove;
	}

	function remove(taglist) {
		var i;
		for (i = 0; i < taglist.length; ++i) {
			var tag = taglist[i];
			var m = tags[tag][0];
			delete tags[tag];

			++info.unique;
			if (tag[0] == tag[1]) ++info.easyunique;

			/* mark field */
			occupied[m[1]][m[0]] = 1;
			occupied[m[3]][m[2]] = 1;
		}
	}

	function filter() {
		var remove = [];
		var i, tag, moves, m;
		for (tag in tags) {
			var moves = tags[tag];
			for (i = 0; i < moves.length; ++i) {
				m = moves[i];
				if (occupied[m[1]][m[0]] || occupied[m[3]][m[2]]) {
					moves.splice(i, 1);
					--i;
				}
			}
			if (1 == moves.length) remove.push(tag);
		}
		return remove;
	}

	for (j = 0; j < h; ++j) {
		occupied[j] = [];
		for (i = 0; i < w; ++i) {
			occupied[j][i] = (' ' == l[j][i]) ? 1 : 0;
		}
	}

	var rem;
	rem = firstSearch();

	var rating = [];
	while (rem.length > 0) {
		remove(rem);
		rating.push({ unique: info.unique, easyunique: info.easyunique});
		rem = filter();
	}

	return (new hm.Rating(rating));
};
