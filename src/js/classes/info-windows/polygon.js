/**
 * @constructor
 * @struct
 * @implements {InfoWindowContent}
 * 
 * @param {number} categoryID
 * @param {string} elementID
 * @param {OverlayType} overlayType
 * @param {Object<string, string>} data
 */
function PolygonInfoWindowContent(categoryID, elementID, overlayType, data) {
	/**
	 * @type{Object<string,string>}
	 */
	this.data = data;

	/**
	 * @override
	 * 
	 * param {number} index
	 * 
	 * @return {string}
	 */
	this.getHtml = function(index) {
		var /** string */
		polygon_id = data['id_polygon'];

		var /** !Object<string, !Object<string, ?>> */
		keys_to_count = {};

		var /** Array<OverlayInfo> */
		markers

		for (var i = 0; i < legend.getLength(); i++) {
			var element_l = legend.getElement(i);

			if (element_l instanceof MultiLegendElement) {
				for (var j = 0; j < element_l.getNumSubElements(); j++) {

					var /** LegendElement */
					subelement = element_l.getSubElement(j);
					markers = subelement.getOverlayInfos();

					this.buildKeysToCount(markers, subelement, elementID, polygon_id, keys_to_count);
				}
			} else {
				markers = element_l.getOverlayInfos();
				this.buildKeysToCount(markers, element_l, elementID, polygon_id, keys_to_count);
			}
		}

		var /** jQuery */
		container = jQuery('<div class="outer_ifw_container"></div>');
		var /** jQuery */
		inner_container = jQuery('<div class="inner_ifw_container"></div>');
		var /** jQuery */
		table = jQuery('<table class="table"></table>');

		inner_container.append(table);

		var total_count = 0;
		var /** jQuery */
		headline;

		if (Object.keys(keys_to_count).length > 0) {
			var /** jQuery */
			tr = jQuery('<tr></tr>');
			var cnt = 0;

			for ( var key in keys_to_count) {
				var /** Object<string, ?> */
				obj = keys_to_count[key];
				var /** number */
				count = /** @type{number} */
				(obj['count']);
				total_count += count;
				var /** string */
				symbol = /** @type{string} */
				(obj['symbol']);

				var /** jQuery */
				row = jQuery('<td data-key="' + key + '" class="ifw_row"><img style = "vertical-align: middle; margin-right: 5px;" src="' + symbol
						+ '"/><span>'+count+'</span></td>');
				tr.append(row);

				cnt++;
				if (cnt == 4) {
					table.append(tr);
					tr = jQuery('<tr></tr>');
					cnt = 0;
				}

			}

			if (cnt < 4)
				table.append(tr);

			headline = jQuery('<div style="line-height: 1.35;"><h2 class="inf_gemeinde_hl">' + data["name"] + ' ('
					+ total_count + ')</h2>' + data["description"] + '</div>');
			container.append(inner_container);
		} else {
			headline = jQuery('<div style="line-height: 1.35;"><h2  class="inf_gemeinde_hl">' + data["name"] + "</h2>" + data["description"] + '</div>');
		}

		container.prepend(headline);
		
		if (data["comparable"]){
			container.append(jQuery("<input type='button' value='compare' class='similarity_button' data-id='" + data["id_polygon"] + "' />"));
		}

		return /** @type{string} */ (container.prop('outerHTML'));
	};

	/**
	 * @private
	 * 
	 * @param {Array<OverlayInfo>} markers
	 * @param {LegendElement} legendElement
	 * @param {string} elementID
	 * @param {string} polygonID
	 * @param {!Object<string, !Object<string, ?>>} _keys_to_count
	 * 
	 * @return {undefined}
	 */
	this.buildKeysToCount = function(markers, legendElement, elementID, polygonID, _keys_to_count) {

		for (var k = 0; k < markers.length; k++) {
			var /** OverlayInfo */
			marker = markers[k];

			if (marker.geomData.type == IMGeoType.Point) {
				if (marker.getQuantifyInfo(elementID) == polygonID) {
					var /** number */
					numData = marker.infoWindowContents.length;

					var symbol;

					if (legend.numActive > 0) {

						if (legendElement.active) {
							symbol = legendElement.symbolStandard;
						} else {
							symbol = legendElement.symbolInactive;
						}

					}

					else {
						symbol = legendElement.symbolStandard;
					}

					if (_keys_to_count[legendElement.key] == undefined) {
						_keys_to_count[legendElement.key] = {
							'count' : numData,
							'markers' : [marker],
							'symbol' : symbol.toDataURL()
						};
					}
					else {
						_keys_to_count[legendElement.key]['count'] += numData;
						_keys_to_count[legendElement.key]['markers'].push(marker);
					}
				}
			}
		}
	};

	/**
	 * @override
	 * 
	 * @param {InfoWindowContent} oldContent
	 * 
	 * @return {boolean}
	 */
	this.tryMerge = function(oldContent) {
		return false;
	};
	
	/**
	*
	* @override
	*
	* @return {undefined} 
	*/
	this.resetState = function (){
		//Do nothing
	};

	/**
	 * @override
	 * 
	 * @param {Element} content
	 * 
	 * @return {undefined}
	 */
	this.onOpen = function(content) {
		var outer_gm_style = jQuery(content).parent().parent().parent();
		outer_gm_style.addClass('custom_gm_map_width');
		jQuery(content).parent().css('overflow', 'hidden');
		outer_gm_style.parent().addClass('ifw_parent');
		outer_gm_style.parent().find('div').first().addClass('ifw_first_child');

		outer_gm_style.parent().find('div').find('div:nth-child(2)').addClass('ifw_second_sub_child');
		outer_gm_style.parent().find('div').find('div:nth-child(4)').addClass('ifw_forth_sub_child');

		jQuery(content).on('click', '.ifw_row', function() {
			var l_key = jQuery(this).attr('data-key');

			var l_element;

			for (var i = 0; i < legend.getLength(); i++) {
				var element_l = legend.getElement(i);

				if (element_l instanceof MultiLegendElement) {
					for (var j = 0; j < element_l.getNumSubElements(); j++) {
						var /** LegendElement */
						subelement = element_l.getSubElement(j);
						if (subelement.key == l_key) {
							l_element = subelement;
							break;
						}
					}
				} else {

					if (element_l.key == l_key) {
						l_element = element_l;
						break;
					}

				}
			}

			l_element.highlight();

			setTimeout(function() {
				l_element.unhighlight();
			}, 1000);

		});
	}

	/**
	 * @override
	 * 
	 * @param {Element} content
	 * 
	 * @return {undefined}
	 */
	this.onClose = function(content) {

	}

	/**
	 * @override
	 * 
	 * @return {Array<Object<string, string>>}
	 */
	this.getData = function() {
		return [this.data];
	};

	/**
	 * @override
	 * 
	 * @return {string}
	 */
	this.getName = function() {
		return this.data["name"];
	};
	
	/**
	 * @override
	 * 
	 * @return {number}
	 */
	this.getNumElements = function (){
		return 1;
	};
}