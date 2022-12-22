<?php

define ('DEFAULT_VALUE', '###DEFAULT###');

/**
 * Controls the inclusion of the plugin files.
 *
 * Also stores global information like the database connection.
 */
class IM_Initializer_Implementation extends IM_Initializer {
	
	private $add_scripts = false;

	public $database;

	public $gui_languages;
	public $cap_for_db = 'edit_posts';

	public $name;

	public $load_function;
	public $map_function;
	
	public $map_type;

	private static $translations;
	
	function __construct(){
		parent::__construct();
		
		$this->add_hooks();
		
		if (isset($_REQUEST['mapType']) && method_exists($this, $_REQUEST['mapType'] . '_function')){
			$this->map_type = $_REQUEST['mapType'];
		}
		else {
			$this->map_type = apply_filters('im_default_map_type', 'pixi'); //TODO document
		}
		
		$this->includes();
		
		//Options that have to be set
		$this->map_function = 'im_show_test_map';
		$this->load_function = 'im_load_test_data';
		
		//Options that can be used
		$this->gui_languages = array ('de','en','fr', 'it', 'sl', 'rg');
		$this->search_location_function = NULL;
		$this->get_location_function = NULL;
		$this->edit_function = NULL;
		$this->global_search_function = NULL;
		$this->info_window_function = NULL;
		$this->similarity_function = NULL;
		
		global $wpdb;
		$this->database = $wpdb;
	}

	public function uninstall (){
			
		//Remove test tables
		$this->database->query('DROP TABLE IF EXISTS im_test_geodaten');
		$this->database->query('DROP TABLE IF EXISTS im_test_informanten');

		//Remove capabilities
		global $wp_roles;
		$administrator = $wp_roles->role_objects['administrator'];
		$administrator->remove_cap('im_edit_comments');
		$administrator->remove_cap('im_edit_map_data');
	}
	
	public function add_hooks (){
		register_deactivation_hook(IM_PLUGIN_FILE, array($this, 'uninstall'));
	
		add_shortcode('im_show_map', array($this, 'include_map'));
	
		add_action( 'wp_footer', array($this, 'enqueue_scripts'));
	
		//AJAX
		if(is_admin()){
			//Backend
			add_action('wp_ajax_im_be', 'im_ajax_handler_backend');
			
			//Registered users
			add_action('wp_ajax_im_u', 'im_ajax_handler_users');
				
			//All visitors
			add_action('wp_ajax_nopriv_im_a', 'im_ajax_handler_all');
			add_action('wp_ajax_im_a', 'im_ajax_handler_all');
			
			add_action('admin_menu', array($this, 'im_add_menu'));
		}
	}

	public function includes (){

		//Includes
		include_once 'gui-elements.php';
		include_once 'ajax-calls.php';
		include_once 'tree.php';

		//Scripts
		
		$dependencies = [
			'jquery-ui-dialog',
			'jquery-ui-tabs',
			'im_chosen_order',
			'im_context-menu-script',
			'im_linkify',
			'im_linkify-html',
			'im_superfish',
			'im_superfishHI',
			'im_qtip',
			'im_colors',
			'im_colorpicker',
			'im_select2',
			'im_select2_de',
			'im_select2_fr',
			'im_select2_it',
			'im_select2_sl',
		    'im_tether',
		    'im_bootstrap',
		    'im_hammer',
		    'im_hammer_jq'
		];

		//Map types
		$dependencies = call_user_func([$this, $this->map_type . '_function'], $dependencies);

		//Chosen
		wp_register_script('im_chosen', IM_PLUGIN_URL . 'lib/js/chosen/chosen.jquery.js');
		wp_register_script('im_chosen_order', IM_PLUGIN_URL . '/lib/js/chosen-order/dist/chosen.order.jquery.min.js', array('im_chosen'));
		wp_register_style('im_chosen_style', IM_PLUGIN_URL . 'lib/js/chosen/chosen.min.css');
		
		//Select2
		wp_register_script('im_select2', IM_PLUGIN_URL . '/lib/js/select2/dist/js/select2.min.js');
		wp_register_style('im_select2_style', IM_PLUGIN_URL . '/lib/js/select2/dist/css/select2.min.css');

		//Select2 Translations
		wp_register_script('im_select2_de', IM_PLUGIN_URL . '/lib/js/select2/dist/js/i18n/de.js');
		wp_register_script('im_select2_fr', IM_PLUGIN_URL . '/lib/js/select2/dist/js/i18n/fr.js');
		wp_register_script('im_select2_it', IM_PLUGIN_URL . '/lib/js/select2/dist/js/i18n/it.js');
		wp_register_script('im_select2_sl', IM_PLUGIN_URL . '/lib/js/select2/dist/js/i18n/sl.js');

		//JQuery UI
		wp_register_style('im_jquery-ui-style', IM_PLUGIN_URL . 'lib/css/jquery-ui/jquery-ui.min.css');
		wp_register_style('im_jquery-ui-style2', IM_PLUGIN_URL . 'lib/css/jquery-ui/jquery-ui.theme.min.css');

		wp_register_script('im_context-menu-script', IM_PLUGIN_URL . 'lib/js/context-menu/dist/jquery.contextMenu.min.js');
		wp_register_style('im_context-menu-style', IM_PLUGIN_URL . 'lib/js/context-menu/dist/jquery.contextMenu.min.css');

		//Linkify
		wp_register_script('im_linkify', IM_PLUGIN_URL . 'lib/js/linkifyjs/linkify.min.js');
		wp_register_script('im_linkify-html', IM_PLUGIN_URL . 'lib/js/linkifyjs/linkify-html.min.js');

		//Superfish
		wp_register_script('im_superfish', IM_PLUGIN_URL . 'lib/js/superfish/dist/js/superfish.min.js');
		wp_register_script('im_superfishHI', IM_PLUGIN_URL . 'lib/js/superfish/dist/js/hoverIntent.js');
		wp_register_style('im_superfish-style', IM_PLUGIN_URL . 'src/css/superfish_im.css');
		
		//QTip2
		wp_register_script('im_qtip', IM_PLUGIN_URL . '/lib/js/qtip/jquery.qtip.min.js', array('jquery'));
		wp_register_style('im_qtip_style', IM_PLUGIN_URL . '/lib/js/qtip/jquery.qtip.min.css');
		
		//Font Awesome
		wp_register_style('im_font_awesome', IM_PLUGIN_URL . '/lib/css/fontawesome/css/all.css');

		//jqColorPicker
		wp_register_script('im_colors', IM_PLUGIN_URL . '/lib/js/colorpicker/colors.js');
		wp_register_script('im_colorpicker', IM_PLUGIN_URL . '/lib/js/colorpicker/jqColorPicker.min.js');
		
		//Bootstrap
		wp_register_script('im_tether', IM_PLUGIN_URL . '/lib/js/bootstrap/tether.min.js');
		wp_register_style('im_tether_style', IM_PLUGIN_URL . '/lib/js/bootstrap/tether.min.css');
		wp_register_script('im_bootstrap', IM_PLUGIN_URL . '/lib/js/bootstrap/bootstrap.min.js');
		wp_register_style('im_bootstrap_style', IM_PLUGIN_URL . '/lib/js/bootstrap/bootstrap.min.css');
		wp_register_script('im_hammer', IM_PLUGIN_URL . '/lib/js/hammer.js/hammer.min.js');
		wp_register_script('im_hammer_jq', IM_PLUGIN_URL . '/lib/js/hammer.js/jquery.hammer.js');

		//hungarian method
		// wp_register_script('im_munkres', IM_PLUGIN_URL . '/lib/js/munkres/munkres.js');

		//Main map script
		wp_register_script('im_map_script', $this->add_map_type(IM_MAIN_JS_FILE), $dependencies, null);
		
		wp_register_script('im_example_config', IM_PLUGIN_URL . 'example_files/data-template.js', array('im_map_script'), true);
		
		wp_register_style('im_map_style', IM_MAIN_CSS_FILE);
		wp_register_style('im_easy_table_style', IM_PLUGIN_URL . 'lib/css/easy-table.css');
	}
	
	private function add_map_type ($file){
		$parts = parse_url($file);
		return $parts['scheme'] . '://' .  $parts['host'] . substr($parts['path'], 0, -3) . '_' . $this->map_type . '.js' . (isset($parts['query']) && $parts['query']? '?' . $parts['query']: '');
	}
	
	private function gm_function ($dependencies){
		$key = apply_filters('im_google_maps_api_key', '');
		$key_str = ($key != ''? '&key=' . $key : '');
		wp_register_script('im_googleMaps', 'https://maps.googleapis.com/maps/api/js?v=3.32&libraries=drawing&language=' . substr(get_locale(), 0, 2) . $key_str, array(), false, true);
		$dependencies[] = 'im_googleMaps';
		
		wp_register_script('im_gm_contextmenu', IM_PLUGIN_URL . 'lib/js/contextmenuGM.js/ContextMenu.js');
		$dependencies[] = 'im_gm_contextmenu';
		
		wp_register_script('im_gm_infobubble', IM_PLUGIN_URL . 'lib/js/js-info-bubble-gh-pages/src/infobubble.js');
		$dependencies[] = 'im_gm_infobubble';
		
		wp_register_style('mapTypeStyle', IM_PLUGIN_URL . 'src/css/google-maps.css');
		
		return $dependencies;
	}
	
	private function pixi_function ($dependencies){
		wp_register_script('leaflet', IM_PLUGIN_URL . 'lib/js/svn/pixi_webgl/js/leaflet.js');
		$dependencies[] = 'leaflet';

		wp_register_script('leafletbounce', IM_PLUGIN_URL . 'lib/js/svn/pixi_webgl/js/leaflet.smoothmarkerbouncing.js');

	    wp_register_script('leafletcolormarkers', IM_PLUGIN_URL . 'lib/js/svn/pixi_webgl/js/leaflet-color-markers.js');

		wp_register_style('mapTypeStyle', IM_PLUGIN_URL . 'lib/js/svn/pixi_webgl/css/leaflet.css');

		wp_register_script('pixi', IM_PLUGIN_URL . 'lib/js/svn/pixi_webgl/js/pixi.min.js');
		$dependencies[] = 'pixi';

		wp_register_script('im_pixi_overlay', IM_PLUGIN_URL . 'lib/js/svn/pixi_webgl/js/L.PixiOverlay.js');
		$dependencies[] = 'im_pixi_overlay';

		wp_register_script('im_pixi', IM_PLUGIN_URL . 'lib/js/svn/pixi_webgl/js/leafletPixi.js');
		$dependencies[] = 'im_pixi';


		wp_register_script('im_earcut', IM_PLUGIN_URL . 'lib/js/svn/pixi_webgl/js/earcut.js');
		$dependencies[] = 'im_earcut';

		wp_register_style('webgl_css', IM_PLUGIN_URL . 'lib/js/svn/pixi_webgl/css/webgloverlay.css');

		
		return $dependencies;
	}

	public function enqueue_scripts (){
		
		if($this->add_scripts){

			wp_enqueue_script('im_callback');

			wp_enqueue_style("im_jquery-ui-style");
			wp_enqueue_style("im_jquery-ui-style2");
				
			wp_enqueue_style('im_chosen_style');
			wp_enqueue_style('im_select2_style');

			wp_enqueue_style('im_context-menu-style');
				
			wp_enqueue_style('im_superfish-style');
			
			wp_enqueue_style('im_qtip_style');
				
			wp_enqueue_style('im_map_style');
			wp_enqueue_style('mapTypeStyle');
			wp_enqueue_style('im_easy_table_style');
				
			wp_enqueue_style('webgl_css');	

			wp_enqueue_style('im_font_awesome');
			
			wp_enqueue_style('im_bootstrap_style');
			wp_enqueue_style('im_tether_style');
			
			// if(get_site_option('im_example_data', false) !== 'false')
				// wp_enqueue_script('im_example_config');
			// else
			wp_enqueue_script('im_map_script');
			
			$this->localize_scripts();
			
			//For external JS files
			do_action('im_enqueue_scripts'); //TODO document 
		}
	}
	
	//Is meant for external usage
	public function enqueue_font_awesome (){
		wp_enqueue_style('im_font_awesome');
	}
	
	//Is meant for external usage
	public function enqueue_qtips (){
		wp_enqueue_script('im_qtip');
		wp_enqueue_style('im_qtip_style');
	}
	
	//Is meant for external usage
	public function enqueue_gui_elements (){
		wp_dequeue_style('wp-jquery-ui-dialog');
		
		wp_enqueue_script('im_js_single', IM_PLUGIN_URL . 'src/js/core/gui-elements.js?v=2', array('jquery-ui-dialog'));
		$this->add_translations('im_js_single');
		wp_enqueue_style('im_css_single', IM_PLUGIN_URL . 'src/css/gui-elements.css');
		wp_enqueue_style("im_jquery-ui-style");
		wp_enqueue_style("im_jquery-ui-style2");
	}
	
	//Is meant for external usage
	public function enqueue_chosen_library (){
		wp_enqueue_script('im_chosen_order');
		wp_enqueue_style('im_chosen_style');
	}
	
	//Is meant for external usage
	public function enqueue_select2_library ($lang = NULL){
		wp_enqueue_script('im_select2');
		wp_enqueue_style('im_select2_style');
		
		if ($lang){
			wp_enqueue_script('im_select2_' . $lang);
		}
	}
	
	//Is meant for external usage
	public function enqueue_bootstrap (){
	    wp_enqueue_script('im_tether');
	    wp_enqueue_style('im_tether_style');
	    wp_enqueue_script('im_bootstrap');
	    wp_enqueue_style('im_bootstrap_style');
	    wp_enqueue_script('im_hammer');
	    wp_enqueue_script('im_hammer_jq');
	}

	public function localize_scripts (){

		global $wp;
		
		
		// This makes sure the ajax calls work in both http and https (and the nonces are always being verified)
		if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off') {
		    wp_add_inline_script( 'im_map_script', 'const ajaxurl = "' . admin_url('admin-ajax.php', 'HTTPS') . '";');
        } else {
            wp_add_inline_script( 'im_map_script', 'const ajaxurl = "' . admin_url('admin-ajax.php', 'HTTP') . '";');
        }
        
		$path_array = array (
				'Info' => IM_PLUGIN_URL . '/icons/Info.png',
				'Delete' => IM_PLUGIN_URL . '/icons/Delete.png',
				'Delete_M' => IM_PLUGIN_URL . '/icons/Delete_M.png',
				'Plus' => IM_PLUGIN_URL . '/icons/Plus.png',
				'Loading' => IM_PLUGIN_URL . '/icons/Loading.gif',
				'Pencil' => IM_PLUGIN_URL . '/icons/pencil.svg',
				'quantify' => IM_PLUGIN_URL . '/icons/qunatify_svg_m.svg',
				'Commit' => IM_PLUGIN_URL . '/icons/Commit.png',
				'Undo' => IM_PLUGIN_URL . '/icons/undo.png',
				'Dot' => IM_PLUGIN_URL . '/icons/dot.png',
				'Close' => IM_PLUGIN_URL . '/icons/iw_close.gif',
				'symbolGenerator' => IM_PLUGIN_URL . 'src/php/createSymbol.php',
				'gradientFile' => IM_PLUGIN_URL . '/src/json/gradients.json',
				'hexagonFolder' => IM_PLUGIN_URL . 'src/js/classes/hexagon_builder/hexagon_files',
				'baseURL' => IM_PLUGIN_URL,
				'userName' => wp_get_current_user()->user_login,
				'userCanEditComments' => current_user_can_for_blog(1, 'im_edit_comments')? "1": "0",
				'userCanEditMapData' => current_user_can_for_blog(1, 'im_edit_map_data')? "1": "0",
				'language' => substr(get_locale(), 0, 2),
				'mapName' => $this->name,
				'tk' => isset($_REQUEST['tk'])? $_REQUEST['tk'] : null,
		        'layer' => isset($_REQUEST['layer'])? $_REQUEST['layer'] : null,
				'single' => isset($_REQUEST['single'])? $_REQUEST['single'] : null,
				'tkUrl' => add_query_arg('tk', '§§§', remove_query_arg('layer', add_query_arg( $_SERVER['QUERY_STRING'], '', home_url( $wp->request )))),
				'options' => [],
				'mapType' => $this->map_type
		);
		
		//Send
		foreach ($_REQUEST as $key => $param){
			//Send all further parameters to the option manager
			if($key != 'page_id' && $key != 'tk' && $key != 'single'){
				$path_array['options'][$key] = $param;
			}
		}

		wp_localize_script('im_map_script', 'PATH', $path_array);
		$this->add_translations('im_map_script');
	}

	public function add_translations ($script){
		$translations = array (
				'GROUPING' => __('Grouping', 'interactive-map'),
				'SORTING' => __('Sorting', 'interactive-map'),
				'ALPHABETICAL' => __('alphabetical', 'interactive-map'),
				'ASC' => __('ascending', 'interactive-map'),
				'DESC' => __('descending', 'interactive-map'),
				'NUM_RECORDS' => __('according to the number of instances', 'interactive-map'),
				'NO_SELECTION' => __('No elements selected!', 'interactive-map'),
				'ENTER_NAME' => __('Please enter a name!', 'interactive-map'),
				'MAP_ALREADY_EXISTS' => __('A map by that name already exists. Please choose another name!', 'interactive-map'),
				'SAVE_MAP_SUCCESS' => __('You have saved the map successfully!', 'interactive-map'),
				'SAVE_MAP_ERROR' => __('Saving not possible!', 'interactive-map'),
				'NO_SYMBOLS_LEFT' => __('There are not enough symbols to show the current selection!', 'interactive-map'),
				'NO_DATA' => __('There is no data!', 'interactive-map'),
				'COMMENT_LANG_MISSING' => __('This comment is not available in English. Please select another language!', 'interactive-map'),
				'SAVE_CHANGES' => __('Please save the current changes first!', 'interactive-map'),
				'HELP_RELEASE' => __('If a synoptic map should be shown to all users, you have to ask for its release. All other maps remain personal and can only be used by the person who created it.', 'interactive-map'),
				'NEW_ENTRY' => __('Enter new value!', 'interactive-map'),
				'VALUE_ADDED' => __('Value added!', 'interactive-map'),
				'PRINT_LIST' => __('Print List', 'interactive-map'),
				'SELECT_LIST_TYPE' => __('Select List Type', 'interactive-map'),
				'OPTIONS' => __('Options', 'interactive-map'),
				'CHOOSE_CATEGORY' => __('Select category', 'interactive-map'),
				'ADD_NEW_DATA' => __('Add new data', 'interactive-map'),
				'SELECT_ALL' => __('Select all', 'interactive-map'),
				'NO_GROUPING' => __('No grouping', 'interactive-map'),
				'UNDO_CHANGES' => __('Discard changes', 'interactive-map'),
				'COMMIT_CHANGES' => __('Commit changes', 'interactive-map'),
				'EDIT_MODE' => __('Edit mode', 'interactive-map'),
				'SEPARATE_SYMBOL' =>__('Separate %d. marker from multi symbol'),
				'UNDO_CHANGE' => __('Undo last operation', 'interactive-map'),
				'LEAVE_EDIT_MODE' => __('Leave edit mode', 'interactive-map'),
				'NO_EDITING_CATEGORY' => __('Not possible to load non-editable category in edit mode!', 'interactive-map'),
				'FIELD_IS_EMPTY' => __('Field "%s" is not allowed to be empty!', 'interactive-map'),
				'ALL_DISTINCT' => __('per element', 'interactive-map'),
				'COMMENT_LOCKED' => __('This comment is currently edited by another user!', 'interactive-map'),
				'COMMENT' => __('Comment', 'interactive-map'),
				'MARKING' => __('Marking', 'interactive-map'),
				'ADD_MARKING' => __('Add marking', 'interactive-map'),
				'SELECT_TAG' => __('Select domain', 'interactive-map'),
				'SELECT_TAG_VAL' => __('Select value', 'interactive-map'),
				'REMOVE' => __('Remove'),
				'WITHOUT_TAG' => __('(without)', 'interactive-map'),
				'FILTER_NOT_POSSIBLE' => __('This selection will return no data!', 'interactive-map'),
				'GRADIENT_HELP' => __('English text gradient help', 'interactive-map'),
				'SEARCH_LOADING' => __('Loading, please wait...', 'interactive-map'),
				'SEARCH_PLACEHOLDER' => __('Please enter searchterm...', 'interactive-map'),
		        'RELOAD_LEGEND_ENTRY' => __('Adjust filter settings', 'interactive-map')
		);
		
		$translations = apply_filters ('im_translation_list', $translations); //TODO document
		wp_localize_script($script, 'TRANSLATIONS', $translations);
	}

	public function include_map ($params){
	    if (isset($params['map_function'])){
	        $this->map_function = $params['map_function'];
	    }
	    
	    if (isset($params['load_function'])){
	        $this->load_function = $params['load_function'];
	    }
	    
		if(is_callable($this->map_function)){
			//Only add scripts if the shortcode is used
			$this->add_scripts = true;
			
			if(isset($params['name'])){
				$this->name = $params['name'];
			}
			
			call_user_func($this->map_function);
		}
		else {
			echo 'No map function!';
		}
	}

	public function load_data (){
		if(is_callable($this->load_function)){
			return call_user_func($this->load_function);
		}
		else {
			return new IM_Error_Result('No loading function!');
		}
	}
	
	public function edit_data (){
		if(is_callable($this->edit_function)){
			return call_user_func($this->edit_function);
		}
		else {
			return 'No edit function!';
		}
	}
	
	//Only used for lazy info window loading
	public function get_info_window_content($category, $element_id, $overlay_ids, $lang){
		//TODO document
		if(is_callable($this->info_window_function)){
			return call_user_func($this->info_window_function, $category, $element_id, $overlay_ids, $lang);
		}
		else {
			return 'No info window function!';
		}
	}
	
	public function get_similarity_data ($id_polygon){
	    //TODO document
	    if(is_callable($this->similarity_function)){
	        return call_user_func($this->similarity_function, $id_polygon);
	    }
	    else {
	        return 'No similarity function!';
	    }
	}
	
	public function im_add_menu (){
		add_options_page(__('Options Interactive Map', 'interactive-map'), __('Interactive Map', 'interactive-map'), 'activate_plugins', 'im_options', array($this, 'im_options_page'));
	}
	
	public function im_options_page (){
		wp_enqueue_script('im_qtip');
		wp_enqueue_style('im_qtip_style');
		
		?>
		<script type="text/javascript">
			jQuery(function (){
				jQuery('.infoSymbol').qtip();
				
				jQuery("#exampleData").change(function (){
					jQuery.post(ajaxurl, {
						"action" : "im_be",
						"query" : "set_option",
						"option" : "im_example_data",
						"value" : jQuery("#exampleData").is(":checked")
						
					}, function (response){
						if(response != "success"){
							alert("<?php _e('Error', 'interactive-map');?>: " + response);
						}
					});
				});

				jQuery("#selectDB").change(function (){
					if(confirm("<?php _e('Comments and synoptic maps will be copied into the new data base. Any changes within the example data will be lost. Continue?', 'interactive-map'); ?>")){
						jQuery.post(ajaxurl, {
							"action" : "im_be",
							"query" : "copy_tables",
							"slug" : this.value
						}, function (response){
							if(response != "success"){
								alert("<?php _e('Error', 'interactive-map');?>: " + response);
					}
							else {
								alert("<?php _e('Finished!', 'interactive-map');?>");
							}
				});
					}
			});
			});


		</script>
		<br />
		<br />
		<input type="checkbox" id="exampleData" autocomplete="off" <?php echo (get_site_option('im_example_data') === 'false' ? '' : 'checked'); ?> /> <?php _e('Use example data', 'interactive-map');?>
		
		<br />
		<br />
		
		<b><?php _e('Data base', 'interactive-map'); ?>: </b>
		<?php
		if(is_plugin_active('sqlToHtml/sqlToHtml.php')){
			?>
			<select autocomplete="off" id="selectDB">
				<option value="<?php echo DEFAULT_VALUE; ?>" selected><?php _e('Default Wordpress data base', 'interactive-map');?></option>
				<?php
				$logins = get_option('sth_default_logins');
				
				if ($logins !== false){
					foreach ($logins as $slug => $login){
						echo '<option value="' . $slug . '">' . $slug . '</option>';
					}
				}
				?>
			</select>
			<img src="<?php echo IM_PLUGIN_URL; ?>/icons/Help.png" class="infoSymbol" title="<?php _e('The data base connections can be created with the SQLtoHTML plugin.', 'interactive-map'); ?>" />
			<?php 
		}
		else {
			_e('Please install sqlToHtml plugin to use stored data base connections');	
		}
	}
}

new IM_Initializer_Implementation();
register_activation_hook(IM_PLUGIN_FILE, array(IM_Initializer::$instance, 'install'));

//Plugins that depend on this should use this hook to load their files to ensure that all classes etc. are initialised
//TODO document
do_action('im_plugin_files_ready');
?>