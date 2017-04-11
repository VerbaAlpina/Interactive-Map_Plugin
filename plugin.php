<?php

/*
Plugin Name: Interactive map
Plugin URI:  
Description: Visualizes data on an interactive map
Version:     0.5
Author:      fz
License:     CC BY-SA 3.0 DE
License URI: http://creativecommons.org/licenses/by-sa/3.0/de/
Domain Path: /languages
Text Domain: interactive-map
*/
if(get_site_option('im_example_data') !== 'false'){
	include_once 'example_files/map-template.php';
	include_once 'example_files/db-template.php';
}

define ('IM_PLUGIN_URL', plugins_url('', __FILE__) . '/');
define ('IM_PLUGIN_FILE', __FILE__);

add_action(('plugins_loaded'), function (){
	load_plugin_textdomain('interactive-map', false, dirname( plugin_basename(__FILE__) ) . '/languages');
});

register_activation_hook(IM_PLUGIN_FILE, 'im_install_plugin');

add_action('init', function (){
	
	//If other files should be used, the respective constants should be defined with this hook
	//TODO document
	do_action('im_define_main_file_constants');
	
	//Default values for php, js, css root files
	if(!defined('IM_MAIN_PHP_FILE')){
		define('IM_MAIN_PHP_FILE', 'src/php/initializer.php');
	}
	if(!defined('IM_MAIN_JS_FILE')){
		define('IM_MAIN_JS_FILE', IM_PLUGIN_URL . 'compiled/interactive_map_compiled.js');
	}
	if(!defined('IM_MAIN_CSS_FILE')){
		define('IM_MAIN_CSS_FILE', IM_PLUGIN_URL . 'src/css/styles.css');
	}
	
	include_once IM_MAIN_PHP_FILE;
}, 10);

abstract class IM_Initializer {
	
	/**
	 * @var IM_Initializer
	 */
	public static $instance;
	
	public function __construct (){
		self::$instance = $this;
	}
	
	public abstract function uninstall();
	
	public abstract function add_hooks();
	public abstract function includes();
	public abstract function enqueue_scripts();
	
	public abstract function include_map ($params);
	public abstract function load_data ();
	public abstract function edit_data ();
	
	public abstract function enqueue_qtips ();
	public abstract function enqueue_gui_elements ();
	public abstract function enqueue_chosen_library ();
	public abstract function enqueue_select2_library ();
}

function im_install_plugin (){
	global $wpdb;
	im_create_comment_table($wpdb);
	im_create_map_tables($wpdb);
	im_create_test_tables($wpdb);

	//Register capabilities
	global $wp_roles;
	$administrator = $wp_roles->role_objects['administrator'];
	if (!$administrator->has_cap('im_edit_comments')) {
		$administrator->add_cap('im_edit_comments');
		$administrator->add_cap('im_edit_map_data');
	}
}

function im_create_comment_table (&$db){
	$db->query("CREATE TABLE IF NOT EXISTS `im_comments` (
					`Id` varchar(20),
				  	`Source` varchar(50) NOT NULL,
				 	`Author` varchar(100) NOT NULL,
				 	`Created` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
				 	`Changed` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
				 	`Language` char(2) NOT NULL,
				 	`Comment` text NOT NULL,
				 	PRIMARY KEY (Id, Language)
				) ENGINE=InnoDB  DEFAULT CHARSET=utf8");
}

function im_create_map_tables (&$db){
	$db->query("CREATE TABLE IF NOT EXISTS  `im_syn_maps`
		(
			`Id_Syn_Map`   int(10) UNSIGNED PRIMARY KEY AUTO_INCREMENT,
			`Name`         varchar(100),
			`Description`  text,
			`Zoom`         tinyint(3) UNSIGNED,
			`Author`       varchar(100),
			`Released`     ENUM('Private','Applied','Released'),
			`Center_Lat`   double UNSIGNED,
			`Center_Lng`   double UNSIGNED
			) ENGINE=InnoDB  DEFAULT CHARSET=utf8");
	
	$db->query("CREATE TABLE IF NOT EXISTS  `im_syn_maps_elements`
		(
		   `Id_Element`   int(10) UNSIGNED PRIMARY KEY AUTO_INCREMENT,
		   `Id_Syn_Map`   int(10) UNSIGNED,
		   `Position`     int(10) UNSIGNED,
		   `Data`         longtext
		) ENGINE=InnoDB  DEFAULT CHARSET=utf8");
}

function im_create_test_tables (&$db){
	$db->query("CREATE TABLE IF NOT EXISTS `im_test_geodaten` (
								`Id` int(10) unsigned NOT NULL,
								  `Id_Kategorie` int(10) unsigned NOT NULL,
								  `Kategorie` varchar(100) NOT NULL,
								  `Name` varchar(100) NOT NULL,
								  `Beschreibung` varchar(1000) NOT NULL,
								  `Geodaten` geometry NOT NULL,
								  `Land` enum('DE','CH','AT','X') NOT NULL
								) ENGINE=InnoDB  DEFAULT CHARSET=latin1");
	
	$db->query("INSERT INTO im_test_geodaten VALUES (1, 1, 'Städte', 'Innsbruck', 'Bla', GeomFromText('POINT(11.412811 47.270461)'), 'AT')");
	$db->query("INSERT INTO im_test_geodaten VALUES (2, 1, 'Städte', 'Garmisch', 'Bla Bla Bla Bla Bla Bla Bla Bla Bla Bla Bla Bla Bla Bla Bla
			Bla Bla Bla Bla Bla Bla Bla Bla Bla', GeomFromText('POINT(11.135406 47.491772)'), 'DE')");
	$db->query("INSERT INTO im_test_geodaten VALUES (3, 2, 'Seen', 'Bodensee', 'Bla Bla', GeomFromText('
			POLYGON((9.044495 47.816843,9.113159 47.78548,9.170837 47.761484,9.223022 47.735629,9.231262 47.715306,9.357605 47.661688,9.481201 47.659838,9.527893
			47.600607,9.560852 47.585789,9.599304 47.593199,9.678955 47.552433,9.706421 47.552433,9.736633 47.539455,9.750366 47.515346,9.684448 47.504214,9.645996
			47.491225,9.63501 47.496792,9.596558 47.491225,9.563599 47.504214,9.538879 47.485657,9.486694 47.483801,9.42627 47.513491,9.379578 47.554287,9.368591
			47.574673,9.179077 47.656138,9.176331 47.671861,9.213409 47.670011,9.207916 47.686655,9.18045 47.705141,9.170837 47.733782,9.026642 47.805776,9.039001
			47.815921,9.044495 47.816843))'), 'X')");
	$db->query("INSERT INTO im_test_geodaten VALUES (4, 1, 'Städte', 'Wien', 'sggh', GeomFromText('POINT(16.378567 48.223347)'), 'AT')");
	$db->query("INSERT INTO im_test_geodaten VALUES (5, 1, 'Städte', 'Rom', '', GeomFromText('POINT(12.464452 41.86871)'), 'X')");
	
	$db->query("CREATE TABLE IF NOT EXISTS `im_test_informanten` (
								`Id_Informant` int(10) unsigned NOT NULL,
								  `Atlas` varchar(10) NOT NULL,
								  `Ort` varchar(100) NOT NULL,
								  `Geodaten` point NOT NULL
								) ENGINE=InnoDB  DEFAULT CHARSET=latin1");
	
	$db->query("INSERT INTO `im_test_informanten` VALUES (1, 'A1', 'München', GeomFromText('POINT(11.574108 48.132689)'))");
	$db->query("INSERT INTO `im_test_informanten` VALUES (2, 'A2', 'Miesbach', GeomFromText('POINT(11.846933 47.791184)'))");
	$db->query("INSERT INTO `im_test_informanten` VALUES (3, 'A1', 'Rosenheim', GeomFromText('POINT(12.109024 47.871969)'))");
	$db->query("INSERT INTO `im_test_informanten` VALUES (4, 'A3', 'Starnberger See', GeomFromText('POLYGON((11.334557 47.987885,11.229838
			47.837871,11.369815 47.82345,11.334557 47.987885))'))");
	$db->query("INSERT INTO `im_test_informanten` VALUES (5, 'A2', 'München', GeomFromText('POINT(11.567671 48.131376)'))");
}
?>