/**
	_enyo.LeftRightArranger_ is an <a href="#enyo.Arranger">enyo.Arranger</a>
	that displays the active control and some of the previous and next controls.
	The active control is centered horizontally in the container, and the
	previous and next controls are laid out to the left and right, respectively.

	Transitions between arrangements are handled by sliding the new control
	in from the right and sliding the active control out to the left.
*/
enyo.kind({
	name: "hm.LeftRightArranger",
	kind: "Arranger",
	//* The margin width (i.e., how much of the previous and next controls
	//* are visible) in pixels
	margin: 0,
	//* @protected
	axisSize: "width",
	offAxisSize: "height",
	axisPosition: "left",
	constructor: function() {
		this.inherited(arguments);
		this.margin = this.container.margin != null ? this.container.margin : this.margin;
	},
	//* @public
	size: function() {
		var c$ = this.container.getPanels();
		var port = this.containerBounds[this.axisSize];
		var box = port - this.margin -this.margin;
		for (var i=0, b, c; (c=c$[i]); i++) {
			b = {};
			b[this.axisSize] = box;
			b[this.offAxisSize] = "100%";
			c.setBounds(b);
		}
	},
	arrange: function(inC, inIndex) {
		if (this.container.getPanels().length==1){
			var b = {};
			b[this.axisPosition] = this.margin;
			this.arrangeControl(this.container.getPanels()[0], b);
			return;
		}

		var c$ = this.container.getPanels();
		var o = Math.floor(c$.length/2);
		var box = this.containerBounds[this.axisSize] - this.margin -this.margin;
		var e = this.margin - box * Math.floor(inIndex);
		for (var i=0, c, b, v; (c=c$[i]); i++) {
			b = {};
			b[this.axisPosition] = e;
			this.arrangeControl(c, b);
			e += box;
		}
	},
	calcArrangementDifference: function(inI0, inA0, inI1, inA1) {
		if (this.container.getPanels().length==1){
			return 0;
		}

		var i = Math.abs(inI0 % this.c$.length);
		//enyo.log(inI0, inI1);
		return inA0[i][this.axisPosition] - inA1[i][this.axisPosition];
	},
	destroy: function() {
		var c$ = this.container.getPanels();
		for (var i=0, c; (c=c$[i]); i++) {
			enyo.Arranger.positionControl(c, {left: null, top: null});
			enyo.Arranger.opacifyControl(c, 1);
			c.applyStyle("left", null);
			c.applyStyle("top", null);
			c.applyStyle("height", null);
			c.applyStyle("width", null);
		}
		this.inherited(arguments);
	}
});

/**
copy from WIP onyx/enyo.TabPanels with some small modifications

enyo.TabPanels is a subkind of <a href="#enyo.Panels">enyo.Panels</a> that
displays a set of tabs, which allow navigation between the individual panels.
Unlike enyo.Panels, by default, the user cannot drag between the panels of a
TabPanels. This behavior can be enabled by setting *draggable* to true.

Here's an example:

		enyo.kind({
			name: "App",
			kind: "TabPanels",
			fit: true,
			components: [
				{kind: "MyStartPanel"},
				{kind: "MyMiddlePanel"},
				{kind: "MyLastPanel"}
			]
		});
		new App().write();
*/
enyo.kind({
	name: "hm.TabPanels",
	kind: "enyo.Control",
	published: {
		index: 0,
		draggable: false,
		animate: true,
		wrap: false,
	},
	//* @protected
	draggable: false,
	classes: "hm-panels",
	tabTools: [
		{name: "scroller", kind: "Scroller", maxHeight: "100px", strategyKind: "TranslateScrollStrategy", thumb: false, vertical: "hidden", horizontal: "auto", components: [
			{name: "tabs", kind: "onyx.RadioGroup", style: "text-align: left; white-space: nowrap", controlClasses: "onyx-tabbutton", onActivate: "tabActivate"}
		]},
		{name: "client", fit: true, kind: "enyo.Panels", classes: "hm-tab-panels", onTransitionStart: "clientTransitionStart", arrangerKind: "hm.LeftRightArranger"}
	],
	create: function() {
		this._haveTabTools = false;
		this.inherited(arguments);
		this.$.client.getPanels = enyo.bind(this, "getClientPanels");
		this.draggableChanged();
		this.animateChanged();
		this.wrapChanged();
	},
	initComponents: function() {
		this.createChrome(this.tabTools);
		this._haveTabTools = true;
		this.inherited(arguments);
	},
	getClientPanels: function() {
		return this.getClientControls();
	},
	flow: function() {
		this.inherited(arguments);
		this.$.client.flow();
	},
	reflow: function() {
		this.inherited(arguments);
		this.$.client.reflow();
	},
	draggableChanged: function() {
		this.$.client.setDraggable(this.draggable);
		this.draggable = false;
	},
	animateChanged: function() {
		this.$.client.setAnimate(this.animate);
		this.animate = false;
	},
	wrapChanged: function() {
		this.$.client.setWrap(this.wrap);
		this.wrap = false;
	},
	isPanel: function(inControl) {
		
		return !inControl.isChrome ||
			(this._haveTabTools
			&& inControl != this.$.scroller
			&& inControl != this.$.tabs
			&& inControl != this.$.client);
	},
	addControl: function(inControl) {
		this.inherited(arguments);
		if (this.isPanel(inControl)) {
			var c = inControl.caption || ("Tab " + this.$.tabs.controls.length);
			var t = inControl._tab = this.$.tabs.createComponent({content: c});
			if (this.hasNode()) {
				t.render();
			}
		}
	},
	removeControl: function(inControl) {
		if (this.isPanel(inControl) && inControl._tab) {
			inControl._tab.destroy();
		}
		this.inherited(arguments);
	},
	layoutKindChanged: function() {
		if (!this.layout) {
			this.layout = enyo.createFromKind("FittableRowsLayout", this);
		}
	},
	indexChanged: function() {
		// FIXME: initialization order problem
		if (this.$.client.layout) {
			this.$.client.setIndex(this.index);
		}
		this.index = this.$.client.getIndex();
	},
	tabActivate: function(inSender, inEvent) {
		if (this.hasNode()) {
			if (inEvent.originator.active) {
				inEvent.originator.hasNode().blur();
				var i = inEvent.originator.indexInContainer();
				if (this.getIndex() != i) {
					this.setIndex(i);
				}
			}
		}
	},
	clientTransitionStart: function(inSender, inEvent) {
		var i = inEvent.toIndex;
		var t = this.$.tabs.getClientControls()[i];
		if (t && t.hasNode()) {
			this.$.tabs.setActive(t);
			var tn = t.node;
			var tl = tn.offsetLeft;
			var tr = tl + tn.offsetWidth;
			var sb = this.$.scroller.getScrollBounds();
			if (tr < sb.left || tr > sb.left + sb.clientWidth) {
				this.$.scroller.scrollToControl(t);
			}
		}
		return true;
	}
});