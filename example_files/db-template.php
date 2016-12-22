<?php
	function im_load_test_data (){
		$db = IM_Initializer::$instance->database;
		
		switch ($_POST['category']){
			case 0: //Geodaten
				$sql = 'SELECT Name, Beschreibung, Land, asText(Geodaten) as Geo FROM im_test_geodaten WHERE Id_Kategorie = %s';
				$data = $db->get_results($db->prepare($sql, substr($_POST['key'],1)), ARRAY_A);
				
				$result = new IM_Result();
				if($_POST['filter']['subElementCategory'] == 1){ //Land
					foreach ($data as $row){
						if($row['Land'] == 'X'){
							$result->addMapElement(-1, new IM_SimpleElementInfoWindowData($row['Name'], $row['Beschreibung']), $row['Geo']);
						}
						else{
							$result->addMapElement($row['Land'], new IM_SimpleElementInfoWindowData($row['Name'], $row['Beschreibung']), $row['Geo']);
						}
					}
				}
				else if($_POST['filter']['subElementCategory'] == 2){ //Anfangsbuchstabe
					foreach ($data as $row){
						$result->addMapElement($row['Name'][0], new IM_SimpleElementInfoWindowData($row['Name'], $row['Beschreibung']), $row['Geo']);
					}
				}
				
				return $result;
			break;
			
			case 3: //Informanten
				$sql = 'SELECT Ort, asText(Geodaten) as Geo FROM im_test_informanten WHERE Atlas = %s';
				$data = $db->get_results($db->prepare($sql, substr($_POST['key'],1)), ARRAY_A);
				
				$result = new IM_Result();
				foreach ($data as $row){
					$result->addMapElement(-1, new IM_SimpleElementInfoWindowData($row['Ort'], ''), $row['Geo']);
				}
				return $result;
			break;
			
			default:
				return new IM_Result();
		}
	}
?>