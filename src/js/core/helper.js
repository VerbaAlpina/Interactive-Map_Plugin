/**
 * @return {undefined} 
 */
function openSaveDialog (){
	if(legend.getLength() == 0) 
		alert(TRANSLATIONS["NO_SELECTION"]);
	else {
		jQuery("#nameTK").val("");
		jQuery("#beschreibungTK").val("");
		jQuery('#karteSpeichern').dialog({minWidth : 500});
	}
		
}

/**
 * @param {number} id
 * @param {Object} args
 * @param {function (string)} callback
 */
function mapSQL(id, args, callback) {
	jQuery.post(ajaxurl, jQuery.extend({
		"action" : "im_a",
		"namespace" : "load_data",
		"category" : id,
		"lang" : PATH["language"],
		"_wpnonce" : jQuery("#_wpnonce").val()
	}, args), function(response) {
		callback(response);
	});
}

/**
 * @template T
 *
 * @param {Array<Array<T>>} arr
 * @param {Array<T>} value
 *
 * @return {number}
 */
function arrayIndexOf(arr, value) {
	for (var/** number */ i = 0; i < arr.length; i++) {
		var/** boolean */ eq = true;
		for (var/** number */ j = 0; j < arr[i].length; j++) {
			if (arr[i][j] != value[j]) {
				eq = false;
				break;
			}
		}
		if (eq)
			return i;
	}
	return -1;
}

/**
 * @param {number} id
 */
function linkifyF(id) {
	jQuery("#content" + id).linkify();
}

/**
 * 
 * @param {number} d
 * @param {number=} padding
 */
function decimalToHex(d, padding) {
    var hex = d.toString(16);
    padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;
    while (hex.length < padding) {
        hex = "0" + hex;
    }
    return hex;
}

/**
 * 
 * @param {string} urlStr
 * @param {string} param
 * @param {string} value
 *
 * @return{string}
 */
function addParamToUrl (urlStr, param, value){
	var url = new URL(urlStr);
	var params = new URLSearchParams(url.search);
	params.set(param, value);
	url.search = params.toString();
	return url.toString()
}



function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}