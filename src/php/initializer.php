<?php

define ('DEFAULT_VALUE', '###DEFAULT###');

/**
 * Controls the inclusion of the plugin files.
 *
 * Also stores global information like the database connection.
 */
class IM_Initializer_Implementation extends IM_Initializer {
	
	private $add_scripts = false;

	/**
	 * @var wpdb
	 */
	public $database;

	public $gui_languages;
	public $cap_for_db = 'edit_posts';

	public $name;

	public $load_function;
	public $map_function;

	private static $translations;
	
	function __construct(){
		parent::__construct();
		
		$this->add_hooks();
		$this->includes();
		
		//Options that have to be set
		$this->map_function = 'im_show_test_map';
		$this->load_function = 'im_load_test_data';
		
		//Options that can be used
		$this->gui_languages = array ('de','en','fr', 'it', 'sl', 'rg');
		
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

		//Chosen
		wp_register_script('im_chosen', IM_PLUGIN_URL . 'lib/js/chosen/chosen.jquery.min.js');
		wp_register_script('im_chosen_order', IM_PLUGIN_URL . '/lib/js/chosen-order/dist/chosen.order.jquery.min.js', array('im_chosen'));
		wp_register_style('im_chosen_style', IM_PLUGIN_URL . 'lib/js/chosen/chosen.min.css');
		
		//Select2
		wp_register_script('im_select2', IM_PLUGIN_URL . '/lib/js/select2/dist/js/select2.min.js');
		wp_register_style('im_select2_style', IM_PLUGIN_URL . '/lib/js/select2/dist/css/select2.min.css');

		//Google maps
		wp_register_script('im_googleMaps', 'https://maps.googleapis.com/maps/api/js?v=3&libraries=drawing&language=' . substr(get_locale(), 0, 2), array(), false, true);

		//JQuery UI
		wp_register_style('im_jquery-ui-style', IM_PLUGIN_URL . 'lib/css/jquery-ui.min.css');
		wp_register_style('im_jquery-ui-style2', IM_PLUGIN_URL . 'lib/css/theme.css');
		wp_register_style('im_tabs-css', IM_PLUGIN_URL . 'src/css/tab-style.css');

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
		wp_register_style('im_font_awesome', IM_PLUGIN_URL . '/lib/css/font-awesome-4.7.0/css/font-awesome.min.css');

		//jqColorPicker
		wp_register_script('im_colors', IM_PLUGIN_URL . '/lib/js/colorpicker/colors.js');
		wp_register_script('im_colorpicker', IM_PLUGIN_URL . '/lib/js/colorpicker/jqColorPicker.min.js');
	
		
		
		$dependencies = array(	
				'jquery-ui-dialog',
				'jquery-ui-tabs',
				'im_chosen_order',
				'im_googleMaps',
				'im_context-menu-script',
				'im_linkify',
				'im_linkify-html',
				'im_superfish',
				'im_superfishHI',
				'im_qtip',
				'im_colors',
				'im_colorpicker'
		);

		//Main map script
		wp_register_script('im_map_script', IM_MAIN_JS_FILE, $dependencies, true);
		
		wp_register_script('im_example_config', IM_PLUGIN_URL . 'example_files/data-template.js', array('im_map_script'), true);
		
		wp_register_style('im_map_style', IM_MAIN_CSS_FILE);
		wp_register_style('im_easy_table_style', IM_PLUGIN_URL . 'lib/css/easy-table.css');
	}

	public function enqueue_scripts (){
		
		if($this->add_scripts){
			wp_enqueue_style("im_jquery-ui-style");
			wp_enqueue_style("im_jquery-ui-style2");
				
			wp_enqueue_style('im_chosen_style');

			wp_enqueue_style('im_context-menu-style');
				
			wp_enqueue_style('im_superfish-style');
			
			wp_enqueue_style('im_qtip_style');
				
			wp_enqueue_style('im_map_style');
			wp_enqueue_style('im_easy_table_style');
			
			wp_enqueue_style('im_font_awesome');
			
			if(get_site_option('im_example_data') !== 'false')
				wp_enqueue_script('im_example_config');
			else
				wp_enqueue_script('im_map_script');
			$this->localize_scripts();
		}
	}
	
	//Is meant for external usage
	public function enqueue_qtips (){
		wp_enqueue_script('im_qtip');
		wp_enqueue_style('im_qtip_style');
	}
	
	//Is meant for external usage
	public function enqueue_gui_elements (){
		wp_dequeue_style('wp-jquery-ui-dialog');
		
		wp_enqueue_script('im_js_single', IM_PLUGIN_URL . 'src/js/core/gui-elements.js', array('jquery-ui-dialog'));
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
	public function enqueue_select2_library (){
		wp_enqueue_script('im_select2');
		wp_enqueue_style('im_select2_style');
	}

	public function localize_scripts (){

		// This makes sure the ajax calls work in both http and https (and the nonces are always being verified)
		if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off') {
        	wp_localize_script('im_map_script', 'ajaxurl', admin_url( 'admin-ajax.php',"HTTPS"));
        } else {
        	wp_localize_script('im_map_script', 'ajaxurl', admin_url( 'admin-ajax.php',"HTTP"));
        }
		$path_array = array (
				'Info' => IM_PLUGIN_URL . '/icons/Info.png',
				'Delete' => IM_PLUGIN_URL . '/icons/Delete.png',
				'Delete_M' => IM_PLUGIN_URL . '/icons/Delete_M.png',
				'Plus' => IM_PLUGIN_URL . '/icons/Plus.png',
				'Loading' => IM_PLUGIN_URL . '/icons/Loading.gif',
				'Dot' => IM_PLUGIN_URL . '/icons/dot.png',
				'symbolGenerator' => IM_PLUGIN_URL . 'src/php/createSymbol.php',
				'gradientFile' => IM_PLUGIN_URL . '/lib/js/colorpicker/gradients.json',
				'mapStyleDark' => IM_PLUGIN_URL . '/lib/js/colorpicker/mapstyle_black.json',
				'userName' => wp_get_current_user()->user_login,
				'userCanEditComments' => current_user_can_for_blog(1, 'im_edit_comments')? "1": "0",
				'userCanEditMapData' => current_user_can_for_blog(1, 'im_edit_map_data')? "1": "0",
				'language' => substr(get_locale(), 0, 2),
				'mapName' => $this->name,
				'tk' => isset($_REQUEST['tk'])? $_REQUEST['tk'] : null
		);
		
		//Send
		foreach ($_REQUEST as $key => $param){
			//Send all further parameters to the option manager
			if($key != 'page_id' && $key != 'tk'){
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
				'HELP_RELEASE' => __('If a synoptic map should be shown to all users, you have to ask for its release. All other maps remain personal and can only be used by the person who created it.'),
				'NEW_ENTRY' => __('Enter new value!', 'interactive-map'),
				'VALUE_ADDED' => __('Value added!', 'interactive-map'),
				'PRINT_LIST' => __('Print List', 'interactive-map'),
				'SELECT_LIST_TYPE' => __('Select List Type', 'interactive-map'),
				'OPTIONS' => __('Options', 'interactive-map'),
				'CHOOSE_CATEGORY' => __('Select category', 'interactive-map'),
				'ADD_NEW_DATA' => __('Add new data', 'interactive-map'),
				'SELECT_ALL' => __('Select all', 'interactive-map'),
				'NO_GROUPING' => __('No grouping', 'interactive-map')
		);
		
		$translations = apply_filters ('im_translation_list', $translations); //TODO document
		wp_localize_script($script, 'TRANSLATIONS', $translations);
	}

	public function include_map ($params){
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