<?php 
function im_show_test_map (){
?>

<div class="<?php echo im_main_div_class();?>">
	<table>
		<tr>
			<td style="width: 200pt">
				<table>
					<tr>
						<td>
							<?php echo im_table_select('im_test_geodaten', array('Id_Kategorie'), array ('Kategorie'), 'geodaten',
								array (
									'placeholder' => 'Kategorie auswählen'
								));
							?>
							<?php echo im_table_select('im_test_informanten', array('Atlas'), array ('Atlas'), 'informanten',
								array (
									'placeholder' => 'Informant auswählen'
								));
							?>
							
							<?php
							$data_array = array (array(1, 'Stamm', 'Ast', 'Zweig', 'Apfel'), array(2, 'Stamm', 'Ast', 'Zweig', 'Blatt'), array(3, 'Wurzel'));
							echo im_hierarchical_select('tree-test', 'Baum', $data_array, array(), array ('style' => 'width: 190pt;'));
							
							?>
							<br />
							<br />
						</td>
					</tr>
					<tr>
						<td>
							<?php im_create_legend(); ?>
						</td>
					</tr>
					<tr>
						<td>
							<?php im_create_synoptic_map_div('190pt'); ?>
						</td>
					</tr>
				</table>
			</td>
			<td>
				<?php im_create_map(350); ?>
			</td>	
		</tr>
	</table>
</div>

<?php

//TODO add synoptic map

//Hidden stuff

im_create_filter_popup_html(); //Needed for the popup windows which enable to apply filters to the visualized data
im_create_save_map_popup_html();
im_create_comment_popup_html();
im_create_ajax_nonce_field ();

}
?>