<?php
	$size = $_REQUEST['size'];
	if(isset($_REQUEST['color']))
		$col = explode(',', $_REQUEST['color']);
	if(isset($_REQUEST['border_color']))
		$col_b = explode(',', $_REQUEST['border_color']);
	else
		$col_b = array(0, 0, 0);
	
	header ("Content-type: image/png");
	$symbol = imagecreatetruecolor($size, $size);
	
	if(isset($col)){
		$img_color = ImageColorAllocate($symbol, $col[0], $col[1], $col[2]);
		
		if(0.2126*$col[0]+0.7152*$col[1]+0.0722*$col[2] < 128) { // Luminanz!
			$text_color = ImageColorAllocate($symbol, 255, 255, 255);
		}
		else {
			$text_color = ImageColorAllocate($symbol, 1, 1, 1); //don't use 0,0,0; with that the anti aliasing can't be turned off
		}
	}
	$border_color = ImageColorAllocate($symbol, $col_b[0], $col_b[1], $col_b[2]);
	
	imagealphablending($symbol, false);
	$transparency = imagecolorallocatealpha($symbol, 0, 0, 0, 127);
	imagefill($symbol, 0, 0, $transparency);
	imagesavealpha($symbol, true);
	
	if(isset($_REQUEST['shape'])){
		$shape = $_REQUEST['shape'];
		
		//Create symbol
		switch ($shape){
			case 'circle':
				if($size % 2 == 0)
					$size--;
				if(isset($col))
			 		imagefilledellipse($symbol, $size/2, $size/2, $size, $size, $img_color);
				imageellipse($symbol, $size/2, $size/2, $size, $size, $border_color);
			break;
			
			case 'rect':
				if(isset($col))
					imagefilledrectangle($symbol,0, 0, $size, $size, $img_color);
				imagerectangle($symbol, 0, 0, $size - 1, $size - 1, $border_color);
			break;
			
			case 'triangle':
				$points = array ($size / 2, 0, 0, $size - 1, $size - 1, $size - 1);
				if(isset($col))
					imagefilledpolygon($symbol, $points, 3, $img_color);
				imagepolygon($symbol, $points, 3, $border_color);
			break;
			
			case 'triangle_i':
				$points = array (-1, 0, $size, 0, $size / 2, $size-1);
				if(isset($col))
					imagefilledpolygon($symbol, $points, 3, $img_color);
				imagepolygon($symbol, $points, 3, $border_color);
			break;
			
			case 'rhomb':
				$points = array ($size / 2, 0, $size - 1, $size / 2, $size / 2, $size - 1, 0, $size / 2);
				if(isset($col))
					imagefilledpolygon($symbol, $points, 4, $img_color);
				imagepolygon($symbol, $points, 4, $border_color);
			break;
			
			case 'house':
				$points = array ($size / 2, 0, $size - 1, $size / 3, $size - 1, $size - 1, 0, $size - 1, 0, $size / 3);
				if(isset($col))
					imagefilledpolygon($symbol, $points, 5, $img_color);
				imagepolygon($symbol, $points, 5, $border_color);
			break;
			
			case 'house_i':
				$points = array (0, 0, $size - 1, 0, $size - 1, $size * 2 / 3, $size / 2, $size - 1, 0, $size * 2 / 3);
				if(isset($col))
					imagefilledpolygon($symbol, $points, 5, $img_color);
				imagepolygon($symbol, $points, 5, $border_color);
			break;
			
			case 'stripe_r':
				$points = array ($size / 3, 0, $size - 1, 0, $size - 1, $size * 2 / 3, $size * 2 / 3, $size - 1, 0, $size - 1, 0, $size / 3);
				if(isset($col))
					imagefilledpolygon($symbol, $points, 6, $img_color);
				imagepolygon($symbol, $points, 6, $border_color);
			break;
			
			case 'stripe_l':
				$points = array (0, 0, $size * 2 / 3, 0, $size - 1, $size / 3, $size - 1, $size -1, $size / 3, $size - 1, 0, $size * 2 / 3);
				if(isset($col))
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
			$font_size = ceil($size * 0.42);
		}
		else {
			$font_size = ceil($size * 0.45);
		}
		$box = imagettfbbox($font_size, 0, $font, $_REQUEST['letter']);
		$width = abs($box[4] - $box[0]);
		$height = abs($box[5] - $box[1]);
		$text_x = ceil($size / 2) - floor($width / 2);
		switch($shape){
			case 'triangle':
			case 'house':
				$text_y = $size - 2 - ($box[1] == -1? 0: $box[1]);
			break;
			
			case 'triangle_i':
				$text_y = $height + 1 - ($box[1] == -1? 0: $box[1]);  
			break;
			
			default:
				$text_y = $size - ceil($size / 2) + ceil($height / 2) - ($box[1] == -1? 0: $box[1]);
		}
			
		imagealphablending($symbol, true);
		imagettftext($symbol, $font_size, 0, $text_x, $text_y, -$text_color, $font, $_REQUEST['letter']);
	}
	
	ImagePNG($symbol);
?>