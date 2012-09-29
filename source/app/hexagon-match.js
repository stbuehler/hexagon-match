var hm = hm || {};

enyo.kind({
	name: "hm.Field",
	kind: "enyo.Control",
	
	components: [
		{name: "container", kind: "enyo.Control", classes: "hmContainer", components: [
			{name: "pieces",kind: "enyo.Control", tag:"canvas", classes:"hmCanvas layer1"},
			{name: "marks",kind: "enyo.Control", tag:"canvas", classes:"hmCanvas layer2"},
			{name: "highlight",kind: "enyo.Control", tag:"canvas", classes:"hmCanvas layer3"},
		]},
	],
	
	published: {
		level: null,
		theme: "default",
	},

	create: function() {
		this.addClass("hmField");
		this.inherited(arguments);
	},
	themeChanged: function() {
		if (this._board) {
			this._board.theme = this.theme;
			this.theme = this._board.theme;
		}
	},
	levelChanged: function() {
		if (this._board) {
			this._board.level = this.level;
			this.level = this._board.level;
		}
	},

	rendered: function() {
		var i;
		this.inherited(arguments);
		if (this._board) return;
		if (!this.hasNode() || !this.$.container.hasNode()) return;
		var layers = [this.$.pieces, this.$.marks, this.$.highlight];
		for (i = 0; i < layers.length; i++) {
			if (!layers[i].hasNode()) return;
			layers[i] = layers[i].node;
		}
		this._board = new hm.Board(layers);
		this._board.resize(this.node.clientWidth, this.node.clientHeight);
		this._boardcontrol = new hm.BoardControl(this._board, this.$.container.node);
		this.levelChanged();
		this.themeChanged();
	},
	resizeHandler: function() {
		this.inherited(arguments);
		if (this._board) this._board.resize(this.node.clientWidth, this.node.clientHeight);
	},
	
	solve: function() {
		if (!this._board) return;

		this._board.cheated = true;
		var solution = hm.solve(this._board.level);
		if (solution) {
			this._board.marks = solution.solution;
		} else {
			enyo.log("no solution found");
		}
	},
	reset: function() {
		if (!this._board) return;
		this._board.marks = [];
	}
});

enyo.kind({
	name: "SelectMenuGroup",
	kind: "enyo.Control",
	published: {
		caption: "",
		open: false,
	},
	components: [
		{name:"item",kind:"enyo.Button",onclick:"selectPane"},
		{name:"body",kind:"enyo.FittableRows",components: [
			{name:"client",kind:"enyo.FittableColumns"},
			{name:"content",kind:"enyo.Panels",layoutKind:"",fit:true}
		]}
	],
	create: function() {
		this.inherited(arguments);
		this.$.body.isChrome = false;
		this.captionChanged();
		this._updateBodyContainer();
	},
	_select: function(element) {
		if (this._selected) {
			this._selected.setOpen(false);
		}
		this._selected = element;
		if (this._selected) {
			this._selected.setOpen(true);
		}
	},
	select: function(element) {
		this._select(element);
		this.selectPane();
	},
	selectPane: function() {
		var c = this.menuContainer();
		if (c) {
			c.select(this);
		}
	},
	adjustComponentProps: function(inProps) {
		if (!inProps.kind) {
			if (inProps.components && inProps.components.length > 0) {
				inProps.kind = "SelectMenuGroup";
			} else {
				inProps.kind = enyo.Button;
			}
		}
		this.inherited(arguments);
	},
	menuContainer: function() {
		var node = this.container;
		while (node && !node.getContentPane) {
			node = node.container;
		}
		return node;
	},
	upperPane: function() {
		var node = this.menuContainer();
		if (node) return node.getContentPane();
	},
	_updateBodyContainer: function() {
		if (this.$.body) {
			var c = this.upperPane();
			if (c) {
				var first = (0 == c.getControls().length)
				this.$.body.setContainer(c);
				this.$.body.setParent(c);
				if (first) this.selectPane();
			} else {
				this.$.body.setContainer(null);
				this.$.body.setParent(null);
			}
			this.flow();
		}
	},
	containerChanged: function() {
		this.inherited(arguments);
		this._updateBodyContainer();
	},
	captionChanged: function() {
		this.$.item.setContent(this.caption);
	},
	openChanged: function() {
		if (this.open) {
			this.upperPane().selectView(this.$.body);
		}
		this.$.item.setDepressed(this.open);
	},
	rendered: function() {
		this.inherited(arguments);
	},
	getContentPane: function() {
		return this.$.content;
	},
});

enyo.kind({
	name: "SelectMenu",
	kind: "enyo.Popup",
	centered: true,
	modal: true,
	floating: true,
	events: {
		onSelect: "",
	},
	chrome: [
		{kind:"enyo.FittableRows",components: [
			{name:"client",kind:"enyo.FittableColumns"},
			{name:"content",kind:"enyo.Panels",layoutKind:"",fit:true}
		]}
	],
	componentsReady: function() {
		this.inherited(arguments);
		this.flow();
	},
	select: function(element) {
		if (this._selected) {
			this._selected.setOpen(false);
		}
		this._selected = element;
		if (this._selected) {
			this._selected.setOpen(true);
		}
	},
	_selectItem: function(inSender) {
		if (this._selectedItem) {
			this._selectedItem.setDepressed(false);
		}
		this._selectedItem = inSender;
		if (this._selectedItem) {
			this._selectedItem.setDepressed(true);
		}
	},
	selectItem: function(inSender) {
		this._selectItem(inSender);
		this.close();
		this.doSelect(this._selectedItem)
	},
	captureDomEvent: function(inEvent) {
		if (inEvent.type != "click") return;

		var node = inEvent.dispatchTarget;
		while (node && node != this) {
			if (node.hasOwnProperty('value')) {
				this.selectItem(node);
				break;
			}
			node = node.container;
		}
	},
	_selectValue: function(node, value) {
		if (node.hasOwnProperty('value')) {
			if (value === node.value) {
				this._selectItem(node);
				while (node) {
					if (node.selectPane) {
						node.selectPane();
						break;
					}
					node = node.container;
				}
				return true;
			}
			return false;
		}
		for (var i=0, cs=node.controls, c; c=cs[i]; i++) {
			if (!c.isChrome) {
				if (this._selectValue(c, value)) return true;
			}
		}
		return false;
	},
	selectValue: function(value) {
		this._selectValue(this, value);
	},
	adjustComponentProps: function(inProps) {
		inProps.kind = inProps.kind || (inProps.components && inProps.components.length > 0 ? "SelectMenuGroup" : enyo.Button);
		this.inherited(arguments);
	},
	published: {
		value: undefined,
	},
	getContentPane: function() {
		return this.$.content;
	},
});

function levelSelectorItems() {
	function group(items) {
		//if (items.length <= 10) return items;
		var r = [];
		while (items.length > 0) {
			r.push({kind:"enyo.FittableColumns",components: items.splice(0, 10)});
		}
		return [{kind:"enyo.FittableRows",components:r}];
	}

	function build(g) {
		var i, r = [];
		if (g.list.length > 0) {
			for (i = 0; i < g.list.length; ++i) {
				r.push({caption: g.list[i].title, components: build(g.list[i])});
			}
			return [{kind: "hm.TabPanels", classes: "enyo-fit", components: r}];
		}
		if (g.levels) for (i = 0; i < g.levels.length; ++i) {
			var ndx = g.levels[i];
			r.push({content: levels[ndx].short, levelIndex: ndx, kind: "onyx.Button", classes: "onyx-radiobutton", onclick: "selectItem" });
		}
		return group(r);
	}

	return build(levelGroups);
}

enyo.kind({
	name: "hm.LevelMenu",
	kind: "enyo.Popup",
	centered: true,
	modal: true,
	floating: true,
	classes: "onyx",
	components: levelSelectorItems(),
	events: {
		onSelect: "",
	},

	rendered: function() {
		this.inherited(arguments);
		this.setBounds({width: 600, height: 300}, "px");
		this.byLevelIndex = [];
		for (var c$=this.getComponents(),i=0;(c=c$[i]);++i) {
			if (c.hasOwnProperty('levelIndex')) this.byLevelIndex[c.levelIndex] = c;
		}
		this._selectItem(this.byLevelIndex[0]);
	},

	_selectItem: function(inSender) {
		if (this._selectedItem) {
			this._selectedItem.addRemoveClass("active", false);
		}
		this._selectedItem = inSender;
		if (this._selectedItem) {
			this._selectedItem.addRemoveClass("active", true);
		}
	},
	selectItem: function(inSender) {
		if (inSender == this._selectItem) {
			this.hide();
			return;
		}
		this._selectItem(inSender);
		this.hide();
		this.doSelect(this._selectedItem);
	},
});

enyo.kind({
	name: "hexagon_match",
	kind: "enyo.FittableRows",
	components: [
		{kind: "onyx.Toolbar", layoutKind: "enyo.FittableColumnsLayout", components: [
			{content: "Hexagon Match"},
			{name:"levelTitle",content: "",fit:true,style:"text-align: center;"},
//			{name:"themeSelector",kind: "onyx.PickerDecorator",label:"Theme",value:"default",items: ["default"],onChange:"_selectedTheme",showing: false},
			{name:"levelSelector", kind: "onyx.Button", content: "Change Level", onclick: "selectLevel"},
			{kind: "onyx.Button", content: "Reset", onclick:"reset"},
			{name:"solve", kind: "onyx.Button", content: "Solve", onclick:"solve", showing: false},
		]},
		{name: "board", kind: "enyo.FittableRows", fit:true, components: [
			{name: "field", kind: "hm.Field", fit: true }
		]},
		{name:"levelMenu",kind: "hm.LevelMenu",onSelect: "_selectedLevel"},
	],
	create: function() {
		this.inherited(arguments);
		this.$.board.addClass("board");
		this.setLevel(0);
		if (enyo.args.cheat) this.$.solve.show();
	},
	selectLevel: function(inSender, inValue, inOldValue) {
		this.$.levelMenu.show();
	},
	_selectedLevel: function(inSender, inItem) {
		this.setLevel(inItem.levelIndex);
	},
	setLevel: function(level) {
		if (typeof(level) == 'number') {
			this._levelNo = level;
			level = levels[level];
		}
		this.$.levelTitle.setContent(level.title);
		this.$.field.setLevel(level);
	},
	_selectedTheme: function(inSender, inValue, inOldValue) {
		this.$.field.setTheme(inValue);
	},
	setTheme: function(theme) {
		this.$.themeSelector.setValue(theme);
		this.$.field.setTheme(theme);
	},
	solve: function() {
		this.$.field.solve();
	},
	reset: function() {
		this.$.field.reset();
	}
});
