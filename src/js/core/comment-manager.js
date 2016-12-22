/**
 * @constructor
 * @struct 
 */
function CommentManager (){
	
	/**
	 * @type {Map<string, !Object<string, string>>} 
	 */
	var comments = new Map ();
	
	/**
	 * @type {Map<string, number>} 
	 */
	var commentCount = new Map ();
	
	/**
	 * @type {string} 
	 */
	var currentLang;
	
	/**
	 * @type {string} 
	 */
	var currentKey;
	
	/**
	 * @type {boolean}
	 */
	var editMode = false;
	
	/**
	 * @type {boolean}
	 */
	var canEditComment = false;
	
	
	//--------------------------------------- BACKGROUND STUFF --------------------------------------------------------------------------
	
	//TODO document function
	/**
	 * Can be overwriten to add additional filter possibilities, except the capability and the category
	 * 
	 * @param {number} categoryID
	 * @param {string} elementID
	 * 
	 * @return {boolean}
	 */
	this.showCommentMenu = function (categoryID, elementID){
		return true;
	}
	
	this.showContent = function (){
		var result = "";
		comments.forEach(function (e){
			result += JSON.stringify(e) + "\n";
		});
		alert(result);
	};
	
	/**
	 * @param {string} key
	 * @param {!Object<string, string>} commentTranslations
	 * 
	 * @return {undefined}
	 */
	this.addComment = function (key, commentTranslations) {
		var /** @type {number|undefined} */ count = commentCount.get(key);
		if(count === undefined){
			comments.set(key, commentTranslations);
			commentCount.set(key, 1);
		} 
		else {
			commentCount.set(key, count + 1);
		}
	};
	
	/**
	 * @param {string} key
	 * 
	 * @return {undefined} 
	 */
	this.removeComment = function (key){
		var /** @type {number|undefined} */ count = commentCount.get(key);
		if(count === undefined)
			return;
		if(count === 1){
			comments.delete(key);
			commentCount.delete(key);
		}
		else {
			commentCount.set(key, count - 1);
		}
	};
	
	/**
	 * @param {string} key 
	 * 
	 * @return {!Object<string, string>|undefined}
	 */
	this.getComment = function (key){
		return comments.get(key);
	};
	
	/**
	 * @param {string} key
	 * @param {string} lang
	 * @param {string} comment
	 * 
	 * @return {undefined}
	 */
	this.updateComment = function (key, lang, comment){
		var /** @type{!Object<string, string>|undefined} */ commentTranslations = comments.get(key);
		if(commentTranslations === undefined){
			if(comment === ""){
				return;
			}
			else {
				var newCommentObject = {};
				newCommentObject[lang] = comment;
				comments.set(key, newCommentObject);
				commentCount.set(key, 1);
			}
		}
		else {
			if(comment == ""){
				delete commentTranslations[lang];
				if(jQuery.isEmptyObject(commentTranslations)){
					comments.delete(key);
					commentCount.delete(key);
				}
			}
			else {
				commentTranslations[lang] = comment;
			}
		}
	};
	
	/**
	 * @param {string} key
	 * 
	 * @return {boolean} 
	 */
	this.hasComment = function (key){
		return comments.has(key);
	};
	
	/**
	 * @return {string} 
	 */
	this.getCurrentCommentText = function (){
		return comments.get(currentKey)[currentLang];
	};
	
	
	//--------------------------------------- GUI STUFF --------------------------------------------------------------------------
	
	/**
	 * @param {number} category
	 * @param {string} key
	 * @param {boolean} edit
	 * 
	 * @return {undefined}
	 */
	this.openCommentWindow = function (category, key, edit){
		canEditComment = this.showCommentMenu(category, key);
		
		var /** boolean */ currentLanguageActive = false;
		currentKey = key;
		currentLang = PATH["language"];
		
		jQuery('#commentTitle').html(categoryManager.getCategoryName(category) + " <i>" + categoryManager.getElementName(category, key) + "</i>");
		
		jQuery("#commentTabs").tabs("disable");
		var /** !Object<string, string> */ commentTranslations = /** @type{!Object<string, string>} */ (this.getComment(key));
		for (var /** string */ lang in commentTranslations){
			this.showTab(lang, commentTranslations[lang], edit);
			if(lang == currentLang)
				currentLanguageActive = true;
		}
		
		if(!currentLanguageActive){
			if(edit){
				this.showTab(currentLang, "", edit);
			}
			else {
				this.showTab(currentLang, "<font color='red'>" + TRANSLATIONS["COMMENT_LANG_MISSING"] + "</font>", edit);
			}
		}
		
		var /** number */ indexCurrentLang = jQuery('#commentTabs a[href="#ctabs-' + currentLang + '"]').parent().index();
		jQuery("#commentTabs").tabs("option", "active", indexCurrentLang);
		
		this.commentTabOpened(jQuery('#commentContent-' + currentLang), edit);

		jQuery('#commentWindow').dialog({
			"minWidth" : 700,
			"maxHeight" : 600, //TODO remove constants
			"beforeClose" : this.beforeClose.bind(this)
		});
	};
	
	/**
	 * @param {string} lang
	 * @param {string} comment
	 * @param {boolean} edit
	 */
	this.showTab = function (lang, comment, edit){
		if(comment == null)
			comment = "";
		
		jQuery('#commentContent-' + lang).html(comment);
		jQuery("#commentTabs").tabs("enable", "#ctabs-" + lang);
		if(edit){
			jQuery("#saveComment-" + lang).css("display", "inline");
			jQuery("#editComment-" + lang).css("display", "none");
			jQuery('#commentContent-' + lang).html("<textarea id='commentEditField' style='width: 95%; height: 150pt;'>" + comment + "</textarea>"); //TODO remove constant
			jQuery('#commentContent-' + lang + " textarea").focus();
		}
		else {
			jQuery("#saveComment-" + lang).css("display", "none");
			if(canEditComment)
				jQuery("#editComment-" + lang).css("display", "inline");
			else
				jQuery("#editComment-" + lang).css("display", "none");
		}
	};
	
	/**
	 * @param {string} mode
	 * @param {string|null} content
	 * @param {function (string)} callback
	 */
	function commentAjax (mode, content, callback){
		jQuery.post(ajaxurl, {
			"action" : "im_u",
			"namespace" : "comments",
			"mode" : mode,
			"content" : content,
			"lang" : currentLang,
			"key" : currentKey,
			"name" : PATH["mapName"],
			"_wpnonce" : jQuery("#_wpnonce_comments").val()},
		function(response) {
			callback(response);
		});
	}
	
	this.editComment = function () {
		commentAjax("get", null, function (response){
			commentManager.showTab(currentLang, /** @type{string} */ (JSON.parse(response)), true);
			editMode = true;
		});
	};
	
	/**
	 * 
	 * @return {undefined}
	 */
	this.saveComment = function () {
		var /** CommentManager */ thisObject = this;
		commentAjax("update", /** @type{string} */ (jQuery("#commentEditField").val()), function (response){
			
			thisObject.commentTabClosed(jQuery('#commentContent-' + currentLang), true);
			
			commentManager.updateComment(currentKey, currentLang, response);
			legend.update();
			editMode = false;
			
			if (response == "") {
				jQuery('#commentWindow').dialog("close");
				//TODO evntl. nur Sprachwechsel
			}
			else {
				jQuery('#commentContent-' + currentLang).html(response);
				jQuery("#saveComment-" + currentLang).css("display", "none");
				jQuery("#editComment-" + currentLang).css("display", "inline");
				thisObject.commentTabOpened(jQuery('#commentContent-' + currentLang), false);
			}
		});
	};
	
	/**
	 *
	 * @param {Object} event 
	 * @param {Object} ui
	 *
	 * @return {boolean} 
	 */
	this.beforeTabChange = function (event, ui){
		//always save changes:
		if(editMode){
			if(confirm(TRANSLATIONS["SAVE_CHANGES"]))
				return false;
			else {
				var /** string */ comm = comments.get(currentKey)[currentLang];
				if(comm == null)
					this.showTab(currentLang, "<font color='red'>" + TRANSLATIONS["COMMENT_LANG_MISSING"] + "</font>", false);
				else
					this.showTab(currentLang, comm, false);
				editMode = false;
			}
		}
		
		if(jQuery("#commentWindow").is(":visible")){
			this.commentTabClosed(jQuery('#commentContent-' + currentLang), editMode);
		}
		
		var /** string */ id = ui["newPanel"].attr("id");
		currentLang = id.substring(id.length-2);
		this.commentTabOpened(jQuery('#commentContent-' + currentLang), editMode);
		
		return true;
	};
	
	this.beforeClose = function (){
		if(editMode){
			if(confirm(TRANSLATIONS["SAVE_CHANGES"]))
				return false;
			editMode = false;
		}
		this.commentTabClosed(jQuery('#commentContent-' + currentLang), editMode);
	};
	
	//TODO document functions (also e.g. save content calls closed with edit = true and opened with edit = false
	/**
	 * @param {jQuery} element
	 * @param {boolean} edit
	 * 
	 * @return {undefined}
	 */
	this.commentTabOpened = function (element, edit){
		
	}
	
	/**
	 * @param {jQuery} element
	 * @param {boolean} edit
	 * 
	 * @return {undefined}
	 */
	this.commentTabClosed = function (element, edit){
		
	}
}