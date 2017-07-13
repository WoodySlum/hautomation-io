<?php
	$icons = json_decode(file_get_contents(__DIR__."/config.json"));
	$iconsFiltered = new StdClass();
	foreach ($icons->glyphs as $icon) {
		$code = dechex($icon->code);
		$iconsFiltered->$code = $icon->css;
	}

	// Save output
	file_put_contents(__DIR__."/icons.json", json_encode($iconsFiltered));
	echo "Generation done".PHP_EOL;
?>
