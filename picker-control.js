function PickerControl(options) {
	if (!(this instanceof PickerControl)) {
		return new PickerControl(options);
	}
	
	this.options = options;
	this.$dom = options.dom;
	this.$pickerSet = this.$dom.find(PickerControl.className.picker);
	this.$pickerList = this.$dom.find(PickerControl.className.pickerList);
	this.$cancelButton = this.$dom.find(PickerControl.className.cancelButton);
	this.$confirmButton = this.$dom.find(PickerControl.className.confirmButton);
	this.translations = [];
	this.listData = [];
	this.pickedData = [];
	this.controlIndex = null;
	this.translationBase = null;
	this.startY = null;
	this.init();
}

PickerControl.className = {
	pickerBar: '.picker-bar',
	pickers: '.pickers',
	picker: '.picker',
	pickerList: '.picker-list',
	pickerItem: '.picker-item',
	cancelButton: '.bar-button.left',
	confirmButton: '.bar-button.right'
};

PickerControl.prototype = {
	init: function () {
		for (var i = 0; i < this.options.count; i++) {
			this.translations[i] = 0;
			this.listData[i] = [];
			this.getDataFromItem(i);
			if (this.listData[i].length !== 0) {
				this.pickedData[i] = {
					pickerIndex: i,
					itemIndex: 0,
					data: this.listData[i][0]
				};
				
				if (this.options.changedEvent) {
					this.options.changedEvent.call(this, {
						pickerIndex: i,
						itemIndex: 0,
						data: this.listData[i][0]
					});
				}
			}
		}

		this.bindEvent();
	},
	bindEvent: function () {
		var self = this;
		this.$pickerSet.on('touchstart mousedown', function (e) {
			var index = $(this).index();

			if (self.listData[index].length === 0) {
				return;
			}
			
			self.controlIndex = index;
			self.startY = e.pageY || e.changedTouches[0].pageY;
			self.translationBase = self.translations[index];
		});

		this.$pickerSet.on('touchmove mousemove', function (e) {
			if (!self.startY) {
				return;
			}

			var index = self.controlIndex;
			var deltaY = (e.pageY || e.changedTouches[0].pageY) - self.startY;
			var trans = self.translationBase + deltaY;

			self.setTranslation(index, trans);
			
			return false;
		});

		$(document).on('touchend mouseup', function (e) {
			if (!self.startY) {
				return;
			}
			
			var lastTrans = self.translations[self.controlIndex] + (e.pageY || e.changedTouches[0].pageY) - self.startY;
			self.tuneTranslation(self.controlIndex, lastTrans);
			self.translationBase = self.controlIndex = self.startY = null;
		});

		this.$cancelButton.on('click', function () {
			if (self.options.cancelEvent) {
				self.options.cancelEvent.call(this);
			}
		});

		this.$confirmButton.on('click', function () {
			if (self.options.confirmEvent) {
				self.options.confirmEvent.call(this, self.pickedData);
			}
		});
	},

	getDataFromItem: function (index) {
		var self = this;
		var $pickerItem = this.$pickerList.eq(index).find(PickerControl.className.pickerItem);
		$pickerItem.each(function () {
			var $this = $(this);
			self.listData[index].push({value: $this.attr('data-value'), text: $this.text()});
		});
	},
	
	tuneTranslation: function (index, lastTrans) {
		var self = this;
		var itemHeight = this.options.itemHeight;
		var listHeight = this.listData[index].length * itemHeight;
		var trans = lastTrans;
		var transRemain = Math.abs(trans % itemHeight);

		if (trans >= 0) {
			trans = 0;
		} else if (Math.abs(trans) > listHeight - itemHeight) {
			trans = 0 - (listHeight - itemHeight);
		} else {
			if (transRemain > itemHeight / 2) {
				trans = trans - (itemHeight - transRemain);
			} else {
				trans = trans + transRemain;
			}
		}

		this.setTranslation(index, trans);

		if (trans === this.translations[index]) {
			return;
		}

		this.translations[index] = trans;
		var itemIndex = Math.abs(Math.floor(trans / itemHeight));
		this.pickedData[index] = {
			pickerIndex: index,
			itemIndex: itemIndex,
			data: this.listData[index][itemIndex]
		};

		if (this.options.changedEvent) {
			this.options.changedEvent.call(this, {
				pickerIndex: index,
				itemIndex: itemIndex,
				data: self.listData[index][itemIndex]
			});
		}
	},

	setTranslation: function (index, translation) {
		
		this.$pickerList.eq(index)
			.css('transition', 'transform .2s ease-out')
			.css('-webkit-transition', 'transform .2s ease-out')
			.css('transform', 'translate3d(0, ' + translation + 'px, 0)')
			.css('-webkit-transform', 'translate3d(0, ' + translation + 'px, 0)');
	},
	
	getPickedData: function (index) {
		return this.pickedData[index];
	},

	getItemLength: function (index) {
		return this.listData[index].length;
	},

	getSelectedIndex: function (index) {
		return this.pickedData[index] ? this.pickedData[index].itemIndex : 0;
	},
	
	setItems: function (index, items, selectedItemIndex, preventChange) {
		if (!items.length) {
			return;
		}

		selectedItemIndex = selectedItemIndex || 0;
		
		var html = '';

		for (var i = 0; i < items.length; i++) {
			html += '<div class="picker-item" data-value="' + items[i].value + '">' + items[i].text + '</div>';
		}

		this.$pickerList.eq(index).html(html);
		this.listData[index] = items
		this.setSelected(index, selectedItemIndex, preventChange);
	},
	setSelected: function (index, selectedItemIndex, preventChange) {
		var listData = this.listData;
		var trans = -selectedItemIndex * this.options.itemHeight;
		var itemHeight = this.options.itemHeight;
		trans = Math.min(0, Math.max(trans, -(this.listData[index].length * itemHeight - itemHeight)));
		selectedItemIndex = -trans / itemHeight;
		
		this.setTranslation(index, trans);
		this.translations[index] = trans;
		this.pickedData[index] = {
			pickerIndex: index,
			itemIndex: selectedItemIndex,
			data: this.listData[index][selectedItemIndex]
		};
		
		if (!preventChange && this.options.changedEvent) {
			this.options.changedEvent.call(this, {
				pickerIndex: index,
				itemIndex: selectedItemIndex,
				data: listData[index][selectedItemIndex]
			});
		}
	}
};