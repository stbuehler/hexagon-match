
var tstLevel = {
	title: "Test",
	width: 9,
	height: 9,
	colors: "BGORVY",
	lines: ["BBGBOBYVG","YYBOGBOG "," ORV GGY "," BR  OY  ","  RRGRV  ","  VVRR   ","   VOV   ","   YO    ","    Y    "]
};

function Medium_filterRating(level) {
	var rating = hm.rate(level);
	if (rating.unique(0) < 3 || rating.easy(0) < 1) return false;
	if (rating.unique(1) < 5) return false;
	if (rating.unique(2) < 6 || rating.easy(2) < 2) return false;
	return true;
}

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
	hm.fillPattern(pattern, true, Medium_filterRating);
	console.log("Level found: %j", pattern.lines);
}

function createLevel2() {
	var pattern = {
		title:"Pattern",
		width:5,
		height:3,
		colors:"BGR",
		lines:[
			" ??? ",
			"?????",
			" ????",
		]
	};
	hm.fillPattern(pattern, true);
	console.log("Level found: %j", pattern.lines);
}

/*
var start = (new Date).getTime();
var num = 10000;
for (var i = 0; i < num; i++) hm.rate(tstLevel);
var diff = ((new Date).getTime() - start) / 1000.0;

console.log("Rated ", Math.round(num / diff), " levels per second");
console.log("Rate result: ", hm.rate(tstLevel));
*/

while (true) {
	createLevel2();
}

