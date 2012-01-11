var levels = [];

function AddLevelPack(prefix, width, height, colors, data) {
	var i;
	for (i = 0; i < data.length; i++) {
		levels.push({
			title: prefix + " - " + (i + 1),
			width: width,
			height: height,
			colors: colors,
			lines: data[i]
		});
	}
}

