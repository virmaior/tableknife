# tableknife
Table Knife is a PHP/JQuery tool for making HTML tables that can be style, downloaded, and cut/paste to Google Sheets and XLS


On the Jquery side, tableknife takes a `<TABLE>` element with `class=tableknife_TABLE` and provides a few interesting functions.

1. It allows exporting of the TABLE to TSV, Google Sheets-friendly paste, or XLS friendly past
2. It allows hovering using the class "hoveri"

On the PHP side, tableknife allows the formatting of TABLES based on their incoming data. Each field is rendered via an `rfield` object using the `process(array $row):string` function. The $row is generally a mysqli_fetch_assoc but it can take any sort of array-like data.

Predefined types:

| Class Name      | Description                     |
|-----------------|---------------------------------|
| rfield          | General class                  |
| rfield_db       | Takes data from the database   |
| rfield_fixed  | Has a static value             |
| rfield_dec    | takes a decimal value and represents it with that number of decimals |
| rfield_rank   | creates a ranked field -- which will paste fine and resolve with JS |
| rfield_concat | takes a multi-part field and organizes it with a DIV inside the TD |
| rfield_numeric | uses numerica values exposing simple analytics |
| rfield_date | for dates (no special funcitonality yet) |
| rfield_link | for exposing a link using a `sprintf` |
| rfield_else | uses a link except when the value is blank in which case  it uses the value of $this->else |
| rfield_options | displays the value as part of an option set |


to create a new tableknife in php:

```
<?php
require_once('tableknife.php');
	$gradable_data = new \tableknife\report_web(
		array(	'Class Name'		=> new \tableknife\rfield_db('class_name'), 
			'Gradable Name'		=> new \tableknife\rfield_db('gradable_name'), 
			'# of Entries'	 	=> new \tableknife\rfield_num('gradable_count'),
			'Edit'			=> new \tableknife\rfield_link('g_id')
		));
		
		$data_rows = mysqli_query('SELECT 
				 class_name, , gradable_name,   gradable_count
				FROM gradables  ');
			
		$gradable_data->fast_show($data_rows,true,true);

?>
```

In general, extend the rfield_db class to do further manipulation to match what you need.

# Hover Items

Items can also be hovered using a hook to create the hover code.
(1) In the cell add `class="hoveri" htype="pday" `
(2) In the JavaScript, add the hover handler:
```
$(document).ready(function() {
	gkpt.h['att'] = new att_help();
	gkpt.h['att'].first_init();
	
    var checkInterval = setInterval(function() {
        if (typeof tableknife_manager !== 'undefined') {
            clearInterval(checkInterval);
         		tableknife_manager.hovers['pday'] = function(me,ptd,h_id) {
					
				const student_id = $(ptd).parent().attr('student_id');
				if (student_id == 0) { return false; }
				const pieces = $(ptd).attr('parts').split(',');
				var piece_out = [];
				pieces.forEach(function(value){
					piece_out.push('<div class="pi_DIV" value="' + value + '">' + value + '</div>');
				});
				return ' ><div class="pday_summary">' +  $(ptd).attr('fmla') +  '</div>' + piece_out.join('');
	};
    }
    }, 300); 

	

});
```
(3) Add CSS to style

This will now make it so that the items hover

