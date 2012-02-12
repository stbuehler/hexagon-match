var levels = [];
var levelGroups = { byName: {}, list: [] };

function AddLevelPack(group, width, height, colors, data) {
	var i;

	var g = levelGroups, gg;
	for (i = 0; i < group.length; ++i) {
		gg = g.byName[group[i]];
		if (!gg) {
			g.byName[group[i]] = gg = { title: group[i], byName: {}, list: [] };
			g.list.push(gg);
		}
		g = gg;
	}

	g.levels = g.levels || [];

	var prefix = group.join(' - '), l;
	for (i = 0; i < data.length; ++i) {
		l = {
			title: prefix + " - " + (i + 1),
			short: ("00" + (i+1)).slice(-2),
			width: width,
			height: height,
			colors: colors,
			lines: data[i]
		};
		g.levels.push(levels.length);
		levels.push(l);
	}
}
