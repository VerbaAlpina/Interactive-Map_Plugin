<?php
	$size = $_REQUEST['size'];
	
	if(isset($_REQUEST['color']))
		$col = explode(',', $_REQUEST['color']);
	
	if(isset($_REQUEST['border_color']))
		$col_b = explode(',', $_REQUEST['border_color']);
	else
		$col_b = array(0, 0, 0);
	
	$msize = 0;
	if (isset($_REQUEST['msize'])){
		$msize = $_REQUEST['msize'];
		
		if (isset($_REQUEST['mcolor'])){
			$col_m = explode(',', $_REQUEST['mcolor']);
		}
		else {
			$col_m = array(0, 0, 0);
		}
	}
	
	
	header ("Content-type: image/png");
	$symbol = imagecreatetruecolor($size, $size);
	
	if(isset($col)){
		$img_color = ImageColorAllocate($symbol, $col[0], $col[1], $col[2]);
		
		if(0.2126*$col[0]+0.7152*$col[1]+0.0722*$col[2] < 128) { // Luminanz!
			$text_color = ImageColorAllocate($symbol, 255, 255, 255);
		}
		else {
			$text_color = ImageColorAllocate($symbol, 0, 0, 0); //don't use 0,0,0; with that the anti aliasing can't be turned off
		}
	}
	$border_color = ImageColorAllocate($symbol, $col_b[0], $col_b[1], $col_b[2]);
	if($msize > 0){
		$marking_color = ImageColorAllocate($symbol, $col_m[0], $col_m[1], $col_m[2]);
	}
	
	imagealphablending($symbol, false);
	$transparency = imagecolorallocatealpha($symbol, 0, 0, 0, 127);
	imagefill($symbol, 0, 0, $transparency);
	imagesavealpha($symbol, true);
	
	$pure_size =  ($size - 2 * $msize);
	
	if(!isset($col))
		$img_color = $transparency;
	
	if(isset($_REQUEST['shape'])){
		$shape = $_REQUEST['shape'];
		
		//Create symbol
		switch ($shape){
			case 'circle':
				if($size % 2 == 0)
					$size--;
				
				if($msize == 0){
					imagefilledellipse($symbol, $size / 2, $size / 2, $size, $size, $img_color);
					imageellipse($symbol, $size/2, $size/2, $size, $size, $border_color);
				}
				else {
					imagefilledellipse($symbol, $size/2, $size/2, $size, $size, $marking_color);
					imagefilledellipse($symbol, $size / 2, $size / 2, $pure_size, $pure_size, $img_color);
					imageellipse($symbol, $size / 2, $size / 2, $pure_size, $pure_size, $border_color);
				}
			break;
			
			case 'rect':
				if(isset($marking_color))
					imagefilledrectangle($symbol,0, 0, $size, $size, $marking_color);
				
				imagefilledrectangle($symbol, $msize, $msize, $size - $msize - 1, $size - $msize - 1, $img_color);
					
				imagerectangle($symbol, $msize, $msize, $size - $msize - 1, $size - $msize - 1, $border_color);
			break;
			
			case 'triangle':
				if(isset($marking_color)){
					$points_full = array ($size / 2, 0, 0, $size - ($msize / 2) - 1, $size - 1, $size - ($msize / 2) - 1);
					imagefilledpolygon($symbol, $points_full, 3, $marking_color);
				}
				
				$points = array ($size / 2, $msize, $msize, $size - $msize - 1, $size - $msize - 1, $size - $msize - 1);				
				
				imagefilledpolygon($symbol, $points, 3, $img_color);
				imagepolygon($symbol, $points, 3, $border_color);
			break;
			
			case 'triangle_i':
				if(isset($marking_color)){
					$points_full = array (-1, $msize / 2, $size, $msize / 2, $size / 2, $size-1);
					imagefilledpolygon($symbol, $points_full, 3, $marking_color);
				}
				
				$points = array ($msize, $msize, $size - $msize, $msize, $size / 2, $size - $msize);
				
				imagefilledpolygon($symbol, $points, 3, $img_color);
				imagepolygon($symbol, $points, 3, $border_color);
			break;
			
			case 'rhomb':
				if(isset($marking_color)){
					$points_full = array ($size / 2, 0, $size - 1, $size / 2, $size / 2, $size - 1, 0, $size / 2);
					imagefilledpolygon($symbol, $points_full, 4, $marking_color);
				}
				
				$points = array ($size / 2, $msize, $size - $msize - 1, $size / 2, $size / 2, $size - $msize - 1, $msize, $size / 2);
					
				imagefilledpolygon($symbol, $points, 4, $img_color);
				imagepolygon($symbol, $points, 4, $border_color);
			break;
			
			case 'house':
				if(isset($marking_color)){
					$points_full = array (
						$size / 2, 0, 
						$size - ($msize / 3) - 1, $size / 3, 
						$size - ($msize / 3) - 1, $size - ($msize / 3) - 1, 
						($msize / 3), $size - ($msize / 3) - 1, 
						($msize / 3), $size / 3);
					imagefilledpolygon($symbol, $points_full, 5, $marking_color);
				}
				
				$points = array ($size / 2, $msize, $size - $msize - 1, $pure_size / 3 + $msize, $size - $msize - 1, $size - $msize - 1, $msize, $size - $msize - 1, $msize, $pure_size / 3 + $msize);

				imagefilledpolygon($symbol, $points, 5, $img_color);
				imagepolygon($symbol, $points, 5, $border_color);
			break;
			
			case 'house_i':
				if(isset($marking_color)){
					$points_full = array (
						($msize / 3), ($msize / 3), 
						$size - ($msize / 3) - 1, 0, 
						$size - ($msize / 3) - 1, $size * 2 / 3, 
						$size / 2, $size - 1, 
						($msize / 3), $size * 2 / 3);
					imagefilledpolygon($symbol, $points_full, 5, $marking_color);
				}
				
				$points = array ($msize, $msize, $size - $msize - 1, $msize, $size - $msize - 1, $pure_size * 2 / 3 + $msize, $size / 2, $size - $msize - 1, $msize, $pure_size * 2 / 3 + $msize);
					
				imagefilledpolygon($symbol, $points, 5, $img_color);
				imagepolygon($symbol, $points, 5, $border_color);
			break;
			
			case 'stripe_r':
				if(isset($marking_color)){
					$points_full = array ($size / 3, 0, $size - 1, 0, $size - 1, $size * 2 / 3, $size * 2 / 3, $size - 1, 0, $size - 1, 0, $size / 3);
					imagefilledpolygon($symbol, $points_full, 6, $marking_color);
				}
				
				$points = array ($pure_size / 3 + $msize, $msize, $size - $msize - 1, $msize, $size - $msize - 1, $pure_size * 2 / 3 + $msize, $pure_size * 2 / 3 + $msize, $size - $msize - 1, $msize, $size - $msize - 1, $msize, $pure_size / 3 + $msize);
				
				imagefilledpolygon($symbol, $points, 6, $img_color);
				imagepolygon($symbol, $points, 6, $border_color);
			break;
			
			case 'stripe_l':
				if(isset($marking_color)){
					$points_full = array (0, 0, $size * 2 / 3, 0, $size - 1, $size / 3, $size - 1, $size -1, $size / 3, $size - 1, 0, $size * 2 / 3);
					imagefilledpolygon($symbol, $points_full, 6, $marking_color);
				}
				
				$points = array ($msize, $msize, $pure_size * 2 / 3 + $msize, $msize, $size - $msize - 1, $pure_size / 3 + $msize, $size - $msize - 1, $size - $msize -1, $pure_size / 3 + $msize, $size - $msize - 1, $msize, $pure_size * 2 / 3 + $msize);

				imagefilledpolygon($symbol, $points, 6, $img_color);
				imagepolygon($symbol, $points, 6, $border_color);
			break;
		}
	}
	else {
		imagefill($symbol, 0, 0, $img_color);
		$shape = 'NONE';
	}

	
	if(isset($_REQUEST['letter'])){
		//Add letter
		$font = __DIR__ . '/tahoma.ttf';
		if($shape == 'triangle' || $shape == 'triangle_i' || $shape == 'rhomb'){
			$font_size = ceil($pure_size* 0.42);
		}
		else {
			$font_size = ceil($pure_size* 0.45);
		}
		$box = imagettfbbox($font_size, 0, $font, $_REQUEST['letter']);
		$width = abs($box[4] - $box[0]);
		$height = abs($box[5] - $box[1]);
		$text_x = floor(($size - $width) / 2);
		switch($shape){
			case 'triangle':
			case 'house':
				$text_y = 0.9 * ($pure_size + $msize) - ($box[1] == -1? 0: $box[1]);
			break;
			
			case 'triangle_i':
				$text_y = 1.2 * $height + $msize - ($box[1] == -1? 0: $box[1]);  
			break;
			
			default:
				$text_y = $size - ceil($size / 2) + ceil($height / 2) - ($box[1] == -1? 0: $box[1]);
		}
			
		imagealphablending($symbol, true);
		imagettftext($symbol, $font_size, 0, $text_x, $text_y, -$text_color, $font, $_REQUEST['letter']);
	}
	
	ImagePNG($symbol);
?>