<?php

/**
 * Returns a <select> element that is created from the values of a database table.
 * 
 * Does not check for SQL injection, so do not call with unsafe parameters.
 * 
 * @param string $table Table name
 * @param string|array $key
 * 		Primary key row of the database table. 
 * 		The values of this row will be used for the value attribute of the <option> elements.
 * 		For multiple rows the respective elements will be concatenated with | for the value of the <option> element.
 * 		
 * @param array $colums_to_select_from
 * 		Columns from which the <option> text is created.
 * 		For multiple columns the first non-empty, non-null value is used for every row.
 * 		It is also possible to give a custom format function in the $addional_data array for more complex tasks.
 * @param string $id ID attribute for the <select> element.
 * @param array $additional_data {
 * 		Optional. More specific options.
 * 
 * 		@type string 'placeholder' Placeholder attribute for the <select> element.
 * 		@type string 'class_name' Class for the <select> element
 * 		@type bool 'multiple_values' If multiple value should be selectable. Default false.
 * 		@type Row_Information 'new_values_info' If this parameter is not NULL an additional <option> is added that allows the insertion of new table rows {@see table_entry_box}. Default NULL.
 * 		@type string 'new_values_text' The text for the <option> element for adding new table rows. Only used if 'new_values_info' is not NULL. Default '(Add new value)'
 * 		@type string 'filter' SQL where clause to filter the elements (do not include the key word WHERE!)
 * 		@type string 'width' CSS width property for the <select> element. Default '190pt'.
 * 		@type string 'custom_style_attributes CSS style rules added to the <select> element. Default ''.
 * 		@type callable list_format_function 	Takes for each row an array with values of the columns specified in $colums_to_select_from and returns the string used as text for the respective <option> element.
 * 												Default behaviour is to return the first non-empty, non-null value.
 * 		@type callable sort_simplification_function Transforms a string for sorting
 * 		@type string group_by Grouping of elements the ids are concatenated with +
 * 		@type string group_order_by Order by clause for the group concat that creates the key for queries with group by clauses
 * 		@type callable costum_attribute_function A function that returns for any option a string of attributes, e.g. "data-key=9 data-val='test'". Takes the value and the name of the option as parameters.
 * }
 * @return string The html code for the <select> element
 */



function im_table_select ($table, $key, $colums_to_select_from, $id, $addional_data = NULL, $create_nonce_field = true){
	
	//Check mandatory parameters
	if(!isset($table)){
		return im_error_message(__('No table given!'), 'interactive-map');
	}
	if(!isset($key)){
		return im_error_message(__('No primary key given!'), 'interactive-map');
	}
	if(!isset($colums_to_select_from)){
		return im_error_message(__('No columns given!'), 'interactive-map');
	}
	if(!isset($id)){
		return im_error_message(__('No id given!'), 'interactive-map');
	}

	//Set defaults
	$multiple_values = isset($addional_data['multiple_values'])? $addional_data['multiple_values'] : false;
	
	$new_values_info = isset($addional_data['new_values_info'])? $addional_data['new_values_info'] : NULL;
	if($new_values_info != NULL){
		if(!isset($addional_data['new_values_text'])){
			$addional_data['new_values_text'] = '(' . __('Add new value', 'interactive-map') . ')';
		}
	}
	
	$class_name = isset($addional_data['class_name'])? $addional_data['class_name'] : '';
	
	$width = isset($addional_data['width'])? $addional_data['width'] : '190pt';

	$custom_style_attributes = isset($addional_data['custom_style_attributes'])? $addional_data['custom_style_attributes'] : '';
	
	$list_format_function = isset($addional_data['list_format_function'])? $addional_data['list_format_function'] : NULL;
	
	$sort_simplification_function = isset($addional_data['sort_simplification_function'])? $addional_data['sort_simplification_function'] : NULL;
	
	$costum_attribute_function = isset($addional_data['costum_attribute_function'])? $addional_data['costum_attribute_function'] : NULL;
	
	//Create key array if single key
	if(!is_array($key)){
		$key = array($key);
	}
	
	//Get table rows
	$key_part = 'DISTINCT ' . implode(',', $key);
	if (isset($addional_data['group_by'])){
		$group_order = '';
		if (isset($addional_data['group_order_by'])){
			$group_order .= ' ORDER BY ' . $addional_data['group_order_by'];
		}
		$keySelect = 'GROUP_CONCAT(' . $key_part . $group_order . " SEPARATOR '+')";
	}
	else {
		$keySelect = $key_part;
	}
	
	$sql = 'SELECT ' . $keySelect . ', ' . implode(', ', $colums_to_select_from) . ' FROM ' . $table . (isset($addional_data['filter'])? ' WHERE ' . $addional_data['filter'] : '');
	if (isset($addional_data['group_by'])){
		$sql .= ' GROUP BY ' . $addional_data['group_by'];
	}
	
	$values = IM_Initializer::$instance->database->get_results($sql, ARRAY_A);
	
	$result = '';
	
	if($new_values_info != NULL){
		$result .= im_table_entry_box('TEB_' . $id, $new_values_info, NULL, $create_nonce_field);
	}

	//Create <select>
	$result .= "<select class='im_table_select " . $class_name . "' id='" . $id . "' " .
		(isset($addional_data['placeholder'])? 'data-placeholder="' . $addional_data['placeholder'] . '" ': '') . 
		($multiple_values? 'multiple="multiple" ': '') .
		"style='width : " . $width . "; " . $custom_style_attributes . "'>\n";
	
	if(!$multiple_values)
		$result .= "<option value=\"\" selected></option>\n";
	
	if($new_values_info != NULL){
		//Create option for new entry
		$result .= '<option value="###NEW###">' . $addional_data['new_values_text'] . "</option>\n";
	}
	
	//Create option texts
	foreach ($values as &$value){
		$optext = im_get_option_text($value, $colums_to_select_from, $list_format_function);
		$value[] = $optext;
		$value[] = ($sort_simplification_function? $sort_simplification_function($optext): $optext);
	}
	
	//Sort values
	uasort($values, function ($v1, $v2) {
		return strcasecmp(end($v1), end($v2));
	});
	
	foreach($values as $val){//TODO find better solution than the str_replace here or document!!!
		
		end($val);
		$current_value = str_replace("'", '', implode('|', array_slice($val, 0, count($key))));
		$current_name = strip_tags(prev($val));
		
		$attrs = '';
		if ($costum_attribute_function){
			$attrs = ' ' . $costum_attribute_function($current_value, $current_name);
		}
		
		$result .= "<option value='" . $current_value . "'" . $attrs . ">" . $current_name . "</option>\n";
	}
	$result .= "</select>\n\n";
	return $result;
}


/**
 * Creates the <option> text for a table row
 * 
 * @param array $row the table row
 * @param int $start_index The first elements of the array will be ignored since they contain the key value(s) that are not used for the name
 * @param callable $list_format_function The function applied to the row elements or NULL for default behaviour
 * 
 * @return string The <option> text
 */
function im_get_option_text ($row, $colums_to_select_from, $list_format_function){
	
	if($list_format_function == null){
		//First non-empty, non-null value
		foreach ($row as $key => $val){
			//Filter key columns
			//Wordpress does not return duplicate rows so it is not possible to use just an index here, since that results in problems,
			//if a column is contained in $key and in $colums_to_select_from
			if(!in_array($key, $colums_to_select_from))
				continue;
			
			if($val != NULL && $val != ''){
				return $val;
			}
		}
	}
	else { //Custom function
	
		$filtered_array = array();
		foreach ($colums_to_select_from as $col){
			$index_as = stripos($col, ' AS ');
			if($index_as !== false){
				$col = substr($col, $index_as + 4);
			}
			$filtered_array[] = $row[$col];
		}
		
		if(is_array($list_format_function)){
			$filtered_array = array_merge($filtered_array, array_slice($list_format_function, 1));
			$list_format_function = $list_format_function[0];
		}
		
		return call_user_func_array($list_format_function, $filtered_array);
	}
}

class IM_Field_Information {
	function __construct ($col_name, $col_type, $mandatory, $allow_new_values = false, $default_value = NULL, $fixed = false, $default_on_empty = false, $help = NULL){
		$this->col_name = $col_name;
		$this->col_type = $col_type;
		$this->mandatory = $mandatory;
		$this->allow_new_values = $allow_new_values;
		$this->default_value = $default_value;
		$this->fixed = $fixed;
		$this->default_on_empty = $default_on_empty;
		$this->help = $help;
	}
	
	public $col_name;
	
	/**
	 * Type information for the column.
	 * 
	 * Possible values:
	 * - 'B' -> Boolean == <checkbox>
	 * - 'T' -> Text == <textfield>
	 * - 'F' -> Foreign Key == <select>
	 * - 'E' -> Enum == <select>
	 * - 'V' -> Varchar == <input>
	 * - 'H' -> Hidden == hidden <input>
	 * 
	 */
	public $col_type;
	public $mandatory;
	public $allow_new_values;
}

class IM_Row_Information {
	function __construct ($table, $field_list, $user_name_field = NULL, $title = NULL){
		$this->table = $table;
		$this->field_list = $field_list;
		$this->user_name_field = $user_name_field;
		
		if ($title){
		    $this->title = $title;
		}
		else {
		    $this->title = $table;
		}
	}
	
	public $table;
	public $field_list;
	public $user_name_field;
	public $title;
}

/**
 * An input box for new data base rows.
 * 
 * Does not check for SQL injection, so do not call with unsafe parameters.
 * 
 * @param string $id The id for the containing <div> element.
 * @param IM_Row_Information Details about the values that can be inserted
 * @param dbname Database name
 * 
 * @return string The html code for the input box
 */
function im_table_entry_box ($id, $row_information, $dbname = NULL, $create_nonce_field = true, $addional_html = ''){

	$result = '<div id="' . $id . '" style="display:none;" title="' . $row_information->title . '" data-table="' . $row_information->table . '" >
				<div id="error' . $id . '" class="IM_error_message">
				</div>
				<form name="input' . $id . '" autocomplete="off">
				<table>';
				
	foreach ($row_information->field_list as $field_info){
		
		$alias = $field_info->col_name;
		$pos_as = strpos($field_info->col_name, ' AS ');
		if($pos_as !== false){
			$alias = substr($field_info->col_name, $pos_as + 4);
			$field_info->col_name = substr($field_info->col_name, 0, $pos_as);
		}
		
		//TODO use default value for others than booleans!
		//TODO use fixed for others than fk!
		$result .= '<tr>';
		
		$type = $field_info->col_type;
		if($type == 'B'){ //Boolean
			$result .= 
			'<td>' . $alias . ':</td><td><input type="checkbox" name="' . 
			$field_info->col_name . '"' . ($field_info->default_value? 'checked="checked' : '') . ' data-nonempty="' . 
			$field_info->mandatory . '" data-type="B" data-emptydefault="' . $field_info->default_on_empty . '">';
		}
		else if ($type == 'E'){
			$result .=
			'<td>' . $alias . ':</td><td>' .
			im_enum_select($row_information->table, $field_info->col_name, $field_info->col_name, '---', $field_info->allow_new_values, 'data-type="E" data-nonempty="' . $field_info->mandatory . '" data-emptydefault="' . $field_info->default_on_empty . '"', NULL, $dbname);
		}
		else if ($type == 'T'){ //Text
			$result .=
			'<td>' . $alias . ':</td><td><textarea name="' .
			$field_info->col_name . '" data-nonempty="' . $field_info->mandatory . '" data-type="T" data-emptydefault="' . $field_info->default_on_empty . '"></textarea>';
		}
		else if ($type == 'S'){ 
			//Serialized enum 
			//(e.g. used for multiple gender assignments, instead of using a separate table to store the gender assignments
			// an enum with all combinations (f m n f+m, f+n m+n f+m+n) is used. On the surface checkboxes are used for every value (f,m,n)
			$result .=
			'<td>' . $alias . ':</td><td>' .
			im_serialized_enum($row_information->table, $field_info->col_name, $field_info->col_name, '---', $dbname);
		}
		else if(strpos($type, 'F') === 0){ //Foreign Key
			$add_info = substr($type, 1);
			$where_clause = '';
			$extra_field = NULL;
			if($add_info != ''){
				if($add_info[0] == '{'){
					$pos_closing = strpos($add_info, '}');
					$extra_field = substr($add_info, 1, $pos_closing - 1);
					$where_clause = substr($add_info, $pos_closing + 1);
				}
				else {
					$where_clause = $add_info;
				}
			}
			
			$result .=
			'<td>' . $alias . ':</td><td>' .
			im_fk_input($row_information->table, $field_info->col_name, $field_info->col_name,  '---', "data-type=\"F\" data-emptydefault=\"" . $field_info->default_on_empty . "\"", $where_clause, $extra_field, $dbname, $field_info->fixed); //TODO nonempty
		}
		else if($type == 'N'){ //Number
			$result .=
			'<td>' . $alias . ':</td><td><input type="text" name="' .
			$field_info->col_name . '" data-nonempty="' . $field_info->mandatory . '" data-type="N" data-emptydefault="' . $field_info->default_on_empty . '" />';
		}
		else if ($type == 'H'){
			$result .=
			'<td></td><td><input type="hidden" value="' . htmlentities($field_info->default_value) . '" name="' .
			$field_info->col_name . '" data-nonempty="' . $field_info->mandatory . '" data-type="H" data-emptydefault="' . $field_info->default_on_empty . '" />';
		}
		else { //Varchar
			$result .=
			'<td>' . $alias . ':</td><td><input type="text" ' . ($field_info->fixed? 'disabled ': '') . 'value="' . ($field_info->default_value? htmlentities($field_info->default_value) : '') . '" name="' .
			$field_info->col_name . '" data-nonempty="' . $field_info->mandatory . '" data-type="V" data-emptydefault="' . $field_info->default_on_empty . '" />';
		}
		
		if ($field_info->help){
			$result .= $field_info->help;
		}
		
		$result .= '</td></tr>';
	}

	$result .= '</table>';
	
	$result .= $addional_html;
	
	if(isset($row_information->user_name_field)){
		$result .= '<input type="hidden" data-meta="user" name="' .$row_information->user_name_field . '" value="' . wp_get_current_user()->user_login . '" />';
	}
	
	if($create_nonce_field)
		$result .= wp_nonce_field('im_aett_' . $row_information->table, '_wpnonce', false, false);
	
	return $result . "</form><br /><br /><input id='save$id' type='button' value='' data-insert-value='" . __('Insert', 'interactive-map') . "' data-update-value='" . __('Update', 'interactive-map') . "' class='button button-primary im_table_entry_box_submit' /><br /><br /><br /><br /></div>";
}

function im_serialized_enum ($table, $col, $name, $selected_value, $dbname = NULL){
	if($dbname === NULL){
		$dbname = IM_Initializer::$instance->database->dbname;
	}
	
	$enum_list = im_get_enum_values_list($table, $col, $dbname);
	
	//Search for longest value, since it contains all possibilities
	$max_len = 0;
	$max_index = -1;
	foreach ($enum_list as $i => $val){
		if(strlen($val) > $max_len){
			$max_len = strlen($val);
			$max_index = $i;
		}
	}
	
	$possiblities = explode('+', $enum_list[$max_index]);
	
	$result = '';
	foreach ($possiblities as $poss){
		$result .= '<input type="checkbox" name="' . $name . '" value="' . $poss . '" data-type="S" data-nonempty="">' . $poss . '&nbsp;&nbsp;&nbsp;';
	}
	
	return $result;
}

/**
 * Creates a <select> element to chose an enum value.
 *
 * Does not check for SQL injection, so do not call with unsafe parameters.
 *
 * @param string $table Table name
 * @param string $col Column name
 * @param string $name Name for the <select> element
 * @param string $selected_value
 * @param bool $allow_new Optional. Default false. If new enum values can be added (database user needs appropriate rights for that)
 * @param string $custom_attributes Optional. Default ''. Html attributes added to the <select> element
 * @param string $new_values_name Optional. Default '(Add new value)'. The text for the <option> element for adding new enum values. Only used if $allow_new is set to true.
 *
 *
 * @return string The html code for the <select> element
 */
function im_enum_select($table, $col, $name, $selected_value, $allow_new = false, $custom_attributes = '', $new_values_name = NULL, $dbname = NULL){

	if($new_values_name === NULL){
		$new_values_name = '(' . __('Add new value', 'interactive-map') . ')';
	}

	if($dbname === NULL){
		$dbname = IM_Initializer::$instance->database->dbname;
	}

	//$enum = IM_Initializer::$instance->database->get_var("SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '$table' AND COLUMN_NAME = '$col' AND TABLE_SCHEMA = '" . $dbname . "'");

	$enum_list = im_get_enum_values_list($table, $col, $dbname);

	$result = '<select class="im_enum_select" name="' . $name . '" ' . $custom_attributes .
	' data-table="' . $table . '" data-column="' . $col . '" data-nonce="' . wp_create_nonce('im_anev_' . $table . $col) . '">' . "\n";
	
	foreach($enum_list as $value)
		if($value == $selected_value)
			$result .= "<option value=\"$value\" selected>$value</option>\n";
		else
			$result .= "<option value=\"$value\">$value</option>\n";

	if($allow_new)
		$result .= '<option value="###NEW###">' . $new_values_name . "</option>\n";
		
	$result .= "</select>\n";

	return $result;
}

function im_get_enum_values_list ($table, $col, $dbname){
	$enum = IM_Initializer::$instance->database->get_var("SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '$table' AND COLUMN_NAME = '$col' AND TABLE_SCHEMA = '" . $dbname . "'");
	
	$enum_list = array_map(function ($e){
		return str_replace("'", '', $e);
	}, explode(',', substr($enum, 5, (strlen($enum) - 6))));
	sort($enum_list);
	return $enum_list;
}

function im_fk_input ($table, $col, $name, $selected_value, $custom_attributes = '', $where_clause = '', $extra_field = NULL, $dbname = NULL, $fixed = false){

	if($dbname === NULL){
		$dbname = IM_Initializer::$instance->database->dbname;
	}
	else {
		$oldname = IM_Initializer::$instance->database->dbname;
	}
	
	$db = IM_Initializer::$instance->database;
	$db->select($dbname);
	
	$table_info = $db->get_results("
			select REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
			from INFORMATION_SCHEMA.KEY_COLUMN_USAGE
			where TABLE_SCHEMA = '$dbname' and TABLE_NAME = '$table' and COLUMN_NAME = '$col'
			and referenced_column_name is not NULL;", ARRAY_N);
	
	$select_clause = $table_info[0][1];
	if($extra_field !== NULL){
		$select_clause = $extra_field;
	}
	$valueList = $db->get_results("SELECT " . $table_info[0][1] . ', ' . $select_clause . " AS Renamed FROM " . $table_info[0][0] . $where_clause . ' ORDER BY ' . $select_clause, ARRAY_N);
	
	if($fixed)
		$custom_attributes .= ' disabled="disabled"';
	
	$result = '<select name="' . $name . '" id="' . $col . '" ' . $custom_attributes . ">\n";
	foreach($valueList as $value){
		if($value == $selected_value)
			$result .= "<option value=\"{$value[0]}\" selected>{$value[1]}</option>\n";
			else
				$result .= "<option value=\"{$value[0]}\">{$value[1]}</option>\n";
	}
	$result .= "</select>\n\n";
	
	if(isset($oldname))
		$db->select($oldname);
	
	return $result;
}

/**
 * Returns a <p> element with an error message
 * 
 * @param string $text The message text
 * 
 * @return string The html code for the error message
 */
function im_error_message ($text){
	return '<p class="IM_error_message">' . $text . '</div>';
}

function im_create_filter_popup_html (){
	?>

	<div id="IM_filter_popup_div" class="modal fade">
 		 <div class="modal-dialog" role="document">
			  <div class="modal-content im_map_modal_content">  

				    <div class="modal-header">
				        <h5 class="modal-title"></h5>
				        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
				          <span aria-hidden="true">&times;</span>
				        </button>
				      </div>

					<div class="modal-body im_map_modal_body">
						<div id="IM_filter_popup_form">
						<!-- 	<h1 id="IM_filter_popup_title"></h1> -->
							<div id="IM_filter_popup_content">
								
							</div>
					
						</div>
					</div>	
					
				<div class="modal-footer im_custom_footer_big">
						<input type="button" id="IM_filter_popup_submit" class="btn btn-secondary im_custom_button" value="<?php _e('Show data', 'interactive-map');?>" />
				</div>

				
			</div>

	 </div>
</div>	
	<?php
}

function im_create_loc_nav_popup_html($Ue){
	?>

	<div id="IM_loc_nav_popup" class="modal fade im_search_modal">
 		 <div class="modal-dialog" role="document">
			  <div class="modal-content im_map_modal_content">  

				    <div class="modal-header">
				        <h5 class="modal-title"><span><i class="fas fa-compass" aria-hidden="true"></i> <?php echo $Ue['GEO_NAVIGATION']; ?></span></h5>
				        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
				          <span aria-hidden="true">&times;</span>
				        </button>
				      </div>

					<div class="modal-body im_map_modal_body">
							<div class="db_select_head"> <?php echo $Ue['LOC_NAVIGATION']; ?>:</div>
							<select class="loc_data_select"></select>
					</div>	
					
				<div class="modal-footer"></div>

			</div>

	 </div>
</div>	
	<?php
}


function im_create_synmap_cite_popup_html($Ue){
	?>

	<div id="IM_synmap_cite_popup" class="modal fade">
 		 <div class="modal-dialog" role="document">
			  <div class="modal-content im_map_modal_content">  


				    <div class="modal-header">
				        <h5 class="modal-title"><span>

				        	<i class="fa-solid fa-quote-right"></i>

  							<span style="margin-left:5px;">
				        	  <?php echo $Ue['ZITIEREN']; ?>
							</span>
				        </span>

				        </h5>
				        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
				          <span aria-hidden="true">&times;</span>
				        </button>
				      </div>

                    <span class="ue_karte"><?php echo $Ue['ATLASKARTE']; ?></span>
                    
					<div class="modal-body im_map_modal_body"></div>	
					
				<div class="modal-footer">
					<button style="background: transparent;"> <i title="copy to clipboard" class="fa-regular fa-copy"></i> <?php echo ' '.$Ue['KOPIEREN']; ?> </button>
				</div>

			</div>

	 </div>
</div>	
	<?php
}




function im_create_add_overlay_popup_html($Ue){


	?>

	<div id="IM_add_overlay_popup" class="modal fade">
 		 <div class="modal-dialog" role="document">
			  <div class="modal-content im_map_modal_content">  


				    <div class="modal-header">
				        <h5 class="modal-title"><span>

        	       <span class="fa-stack add_layer_stack">
                         <i class="fa fa-circle fa-stack-1x" aria-hidden="true" style="color: #444444; font-size: 11px;"></i>
                         <i class="fa fa-plus fa-stack-1x" style="color: #ffffff; font-size: 9px;" aria-hidden="true"></i>
                     </span>

				        	<i class="fa-solid fa-layer-group"></i> 

  							<span style="margin-left:5px;">
				        	  <?php echo $Ue['ADD_MAP_OVERLAY']; ?>
							</span>
				        </span>

				        </h5>
				        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
				          <span aria-hidden="true">&times;</span>
				        </button>
				      </div>

					<div class="modal-body im_map_modal_body">

					
							
									<div class="map_overlay_group">
									<input id="mayr_overlay" type="checkbox" autocomplete="off">
										<span class="map_overlay_name">


													<span> 

														<?php 
													     list($code, $html) = va_create_bibl_html("Mayr's Alpenkarte 1875");
													     $html_tooltip = va_create_bib_tooltip_content("Mayr's Alpenkarte 1875", $code);
														 echo $html . $html_tooltip;
														?> 

												    </span> 


								   </span>

										<div  class="overlay_slider">
										<input disabled="true" type="range" min="1" max="100" value="100">
										</div>
										
									



									</div>


									<div class="map_overlay_group">
									<input id="czoernig" type="checkbox" autocomplete="off">
										<span class="map_overlay_name">Karl von Czoernig: Ethnographische Karte der oesterreichischen Monarchie,

													<span> 

														<?php 
													     list($code, $html) = va_create_bibl_html('Czoernig 1855');
													     $html_tooltip = va_create_bib_tooltip_content('Czoernig 1855', $code);
														 echo $html . $html_tooltip;
														?> 

												    </span> 

										 </span>

										<div  class="overlay_slider">
										<input disabled="true" type="range" min="1" max="100" value="100">
										</div>

									</div>

								  <div class="map_overlay_group">
									<input id="kirchenprovizen" type="checkbox" autocomplete="off">
										<span class="map_overlay_name">Kirchenprovinzen Mitteleuropas um 1500,

												<span> 

														<?php 
													     list($code, $html) = va_create_bibl_html('Droysen / Andree 1886');
													     $html_tooltip = va_create_bib_tooltip_content('Droysen / Andree 1886', $code);
														 echo $html . $html_tooltip;

														?> 

												    </span> 


										</span>

										<div  class="overlay_slider">
										<input disabled="true" type="range" min="1" max="100" value="100">
										</div>

									</div>

						
						
									<div class="map_overlay_group">
									<input id="ald_overlay" type="checkbox" autocomplete="off">
										<span class="map_overlay_name"> ALD,

												<span> 

														<?php 
													     list($code, $html) = va_create_bibl_html('ALD-I');
													     $html_tooltip = va_create_bib_tooltip_content('ALD-I', $code);
														 echo $html . $html_tooltip;

														 echo ", ";

													     list($code, $html) = va_create_bibl_html('ALD-II');
													     $html_tooltip = va_create_bib_tooltip_content('ALD-II', $code);
														 echo $html . $html_tooltip;

														?> 

												    </span> 


										 </span>

										<div  class="overlay_slider">
										<input disabled="true" type="range" min="1" max="100" value="100">
										</div>

									</div>



									<div class="map_overlay_group">
									<input id="stamen_labels" type="checkbox" autocomplete="off">
										<span class="map_overlay_name"> Stamen Labels </span>

										<div  class="overlay_slider">
										<input disabled="true" type="range" min="1" max="100" value="100">
										</div>

									</div>
							

					
					</div>	
					
				<div class="modal-footer"></div>

			</div>

	 </div>
</div>	
	<?php
}

function im_create_add_overlay_button_html($Ue){
	?>
       <div style="color:#0075ff; cursor: pointer;" class="addLayerButton">

       		 <div style="position:relative; display: inline-flex;">	
       	       <span class="fa-stack add_layer_stack" style="top:0px;">
                         <i class="fa fa-circle fa-stack-1x" aria-hidden="true" style="color: #0075ff; font-size: 7px;"></i>
                         <i class="fa fa-plus fa-stack-1x" style="color: #ffffff; font-size: 5px;" aria-hidden="true"></i>
                     </span>

				   <i class="fa-solid fa-layer-group"></i> 
			 </div>

       	<?php echo $Ue['ADD_MAP_OVERLAY']; ?>
       </div>
	<?php
}

function im_create_lang_search_html($Ue){
	?>

	<div id="IM_lang_search_modal" class="modal fade im_search_modal">
 		 <div class="modal-dialog" role="document">
			  <div class="modal-content im_map_modal_content">  

				    <div class="modal-header">
				        <h5 class="modal-title"><span><i class="fas fa-search" aria-hidden="true"></i> <?php echo $Ue['SEARCH']; ?></span></h5>
				        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
				          <span aria-hidden="true">&times;</span>
				        </button>
				      </div>

					<div class="modal-body im_map_modal_body">
							<div class="db_select_head"> <?php echo $Ue['LANG_NAVIGATION']; ?>:</div>
							<select class="lang_data_select"></select>
					</div>	
					
				<div class="modal-footer"></div>

			</div>

	 </div>
</div>	
	<?php
}




function im_create_legend (){
	?>
	<div id="IM_legend">
	</div>
	<?php
}

function im_create_map ($min_height){
	?>
	<div id="IM_map_div" style="min-height: <?php echo $min_height;?>pt"></div>
	<?php
}

function im_main_div_class (){
	return 'IM_main_div';
}

function im_create_synoptic_map_div ($width, $readonly = false, $extra_content = ''){
	echo '<div id="IM_Syn_Map_Cotainer">';
	$add_data = array(
		'placeholder' => __('Synoptic map', 'interactive-map'),
		'width' => $width
	);
	$add_data['filter'] = "Name != 'Anonymous'";
	
	
	if(!is_super_admin(wp_get_current_user() -> ID)){
		$add_data['filter'] .= " AND (Released = 'Released' OR Author = '" .  wp_get_current_user() -> user_login . "')";
	}
	
	echo im_table_select('im_syn_maps', 'Id_Syn_Map', array('Name'), 'IM_Syn_Map_Selection', $add_data);
	
	if(is_user_logged_in() && !$readonly){
		?>
		<input type="button" class="btn btn-secondary im_custom_button" id="IM_Save_Syn_Map_Button" style="width: <?php echo $width;?>;" value="<?php _e('Save selection as synoptic map', 'interactive-map');?> ">
		<?php
	}
	echo $extra_content . '</div>';
}


function im_create_ajax_nonce_field (){
	wp_nonce_field('im_load_data', '_wpnonce', false, true);
	wp_nonce_field('im_edit_comments', '_wpnonce_comments', false, true);
	wp_nonce_field('im_save_map', '_wpnonce_syn_map_save', false, true);
}

function im_create_comment_popup_html (){
	?> 
<div id="commentWindow" class="modal fade">
  <div class="modal-dialog" role="document">
   
   <div class="modal-content im_map_modal_content">  

     <div class="modal-header">
        <h5 class="modal-title" id="commentTitle"><?php _e('Comment', 'interactive-map');?></h5>
        <button type="button" class="close" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>


  			<div class="modal-body im_map_modal_body">
			<!-- 	<h1 id="commentTitle" style="margin-left: 0.5em;"></h1> -->
				
				<div id="commentTabs"  style="height : 80%;">
					<ul>
						<?php $langs = IM_Initializer::$instance->gui_languages;
						foreach ($langs as $lan){
							echo "<li><a href='#ctabs-$lan'>$lan</a></li>\n";
						}
						?>
					</ul>

					<?php
					foreach ($langs as $lan){
						?>
						<div id="ctabs-<?php echo $lan; ?>">
							<?php 
							if(current_user_can_for_blog(1, 'im_edit_comments')){
							?>
							<div class="im_edit_comments_btn">
								<a href="#" class="editCommentLink" id="editComment-<?php echo $lan; ?>"><i class="fa fa-pencil" aria-hidden="true"></i> <?php _e('Edit comment', 'interactive-map');?></a>
								<input type="button" class="btn btn-secondary im_custom_button saveCommentButton" value="<?php _e('Save'); ?> " style="display: none" id="saveComment-<?php echo $lan; ?>">
							</div>
							<?php
							}
							?>
						
							<div id="commentContent-<?php echo $lan; ?>"  class="entry-content"></div>
						</div>
					<?php
					}
					?>
				</div>

			  </div>

			  <div class="modal-footer im_custom_footer"></div>
    		 

	</div>
  </div>
</div>	

	<?php
}

/**
 * Returns a hierarchical menu to select from.
 * 
 * @param id id for the top-level element
 * @param string $selection_name
 * @param $data_array 
 * 	Two-dimensional array with numeric keys.
 * 	It must have the following structure:
 * 		- First column: Key
 * 		- All other columns: Tree nodes for this element starting with the top-level node. The last one will become the (selectable) leaf.
 * @param array params_leaves Optional. Html attributes for the leaf elements.
 * @param array params_root Optional. Html attributes for the top-level element.
 * 
 */
function im_hierarchical_select ($id, $selection_name, $data_array, $params_leaves = array(), $params_root = array ()){
	$tree = new IM_Tree($selection_name);
	
	foreach ($data_array as $i => $row){
		$rid = $row[0];
		unset($row[0]);
		if(isset($params_leaves[$i])){
			$className = 'sf-tree-leaf';
			if(isset($params_leaves[$i]['class'])){
				$className .= ' ' . $params_leaves[$i]['class'];
			}
			$lparams = array_merge($params_leaves[$i], array('data-id' => $rid, 'class' => $className));
		}
		else {
			$lparams = array('data-id' => $rid, 'class' => 'sf-tree-leaf');
		}
		$tree->addSubTree(IM_Tree::arrayToTreePath($row, true, $lparams));
	}
	
	if(isset($params_root['class'])){
		$params_root['class'] .= ' sf-menu sf-vertical sf-menu-toplevel im_data_loader';
	}
	else {
		$params_root['class'] = ' sf-menu sf-vertical sf-menu-toplevel im_data_loader';
	}
	$params_root['id'] = $id;
	$tree->sort();
	return $tree->toHtml($params_root);
}

function im_create_save_map_popup_html (){
	?>


	 <div id="IM_Save_Syn_Map" class="modal fade">

	  <div class="modal-dialog" role="document">
   	    <div class="modal-content im_map_modal_content">  

				    <div class="modal-header">
				        <h5 class="modal-title"><?php _e('Save selection as synoptic map', 'interactive-map') ?></h5>
				        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
				          <span aria-hidden="true">&times;</span>
				        </button>
				      </div>

			<div class="modal-body im_map_modal_body">

						<br/>
						<table style="border-spacing: 5px; border-collapse: separate; width : 100%">
							<tr>
								<td>
									<?php _e('Name'); ?>
								</td>
								<td>
									<input type="text" id="IM_Syn_Map_Name" style="width: 90%" />
								</td>
							</tr>
							<tr>
								<td>
									<?php _e('Description') ?>
								</td>
								<td>
									<textarea id="IM_Syn_Map_Description" style="width:90%" rows="5"></textarea>
								</td>
							</tr>
						</table>
						<br />
						<p>
							<input type="radio" name="IM_Syn_Map_All" value="0" checked /> <?php _e('Save only active elements', 'interactive-map'); ?>
							<br/>
							<input type="radio" name="IM_Syn_Map_All" value="1" /> <?php _e('Save all elements', 'interactive-map'); ?>
						</p>
						<br/>
						<p>
							<input type="checkbox" id="IM_Syn_Map_Release" value="release" /> <?php _e('Apply for release', 'interactive-map'); ?>

							<i id="helpRelease" class="helpsymbol fa fa-question-circle-o" style="vertical-align: middle;" title="Hilfe"></i>
							<!-- <img  id="helpRelease" src="<?php echo IM_PLUGIN_URL; ?>/icons/Help.png" style="vertical-align: middle;" /> -->
						</p>
						<br/>
						<input type="button" class="btn btn-secondary im_custom_button" id="IM_Save_Syn_Map_Final_Button" value="<?php echo _e('Save') ?>">

			 </div>

			 	 <div class="modal-footer im_custom_footer"></div>

		   </div>
		</div>
	</div>

	<?php
}

function im_create_debug_area (){
	?>
	<div id="im_debug_area" class="IM_error_message"></div>
	<?php
}

function va_create_list_popup_html (&$Ue){
	
	?>
	<div class="modal fade select_export_popup" tabindex="-1" role="dialog" aria-labelledby="mySmallModalLabel" aria-hidden="true">
	  <div class="modal-dialog modal-sm">
	    <div class="modal-content">

	   <div class="modal-header">

        <h5 class="modal-title">
	        <span>
	        <?php
	    		     echo __('Print List','interactive-map');
		     ?>
	    		   	
	    	 </span>
        </h5>

        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">×</span>
        </button>
      </div>

	       <div class="modal-body">

	       <div class="btn-group-vertical" style="min-width: 100%;" role="group" aria-label="Vertical button group">
					<button id="export_json" type="button" class="btn btn-secondary hex-modal-btn">Json</button>
					<button id="export_csv" type="button" class="btn btn-secondary hex-modal-btn">CSV</button>
					<button id="export_list" type="button" class="btn btn-secondary hex-modal-btn"> 
					   <?php
							echo __('Print as List','interactive-map');
						?>
		     </button>
		   </div>


	      </div>

	    </div>
	  </div>
	</div>	
<?php
}

function va_create_export_list_popup_html (&$Ue){
	
	?>
	<div class="modal fade export_list_popup" tabindex="-1" role="dialog" aria-labelledby="mySmallModalLabel" aria-hidden="true">
	  <div class="modal-dialog im_map_modal_content">
	    <div class="modal-content">

	   <div class="modal-header">

        <h5 class="modal-title">
	        <span>
	        <?php
	    		     echo __('Print List','interactive-map');
		     ?>
	    		   	
	    	 </span>
        </h5>

        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">×</span>
        </button>
      </div>

	       <div class="modal-body im_map_modal_body">

	
	      </div>

	      <div class="modal-footer im_custom_footer"></div>

	    </div>
	  </div>
	</div>	
<?php
}

?>