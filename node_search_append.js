
function createLevel1() {
	var pattern = {
		title:"Pattern",
		width:9,
		height:9,
		colors:"BGORVY",
		lines:[
			"?????????",
			"???????? ",
			" ??? ??? ",
			" ??  ??  ",
			"  ?????  ",
			"  ????   ",
			"   ???   ",
			"   ??    ",
			"    ?    "
		]
	};
	hm.fillPattern(pattern, true);
	console.log("Level found: %j", pattern.lines);
}

while (true) {
	createLevel1();
}
