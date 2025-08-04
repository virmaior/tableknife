<?php
namespace tableknife;

use web_widget, to_select;


if (!function_exists('array_key_first')) {
    function array_key_first(array $arr) {
        foreach($arr as $key => $unused) {
            return $key;
        }
        return NULL;
    }
}


trait multi_col
{
    function col_names()

    {
        $cols = array();
        $count = 0;
        foreach ($this->split_cols as $name)
        {
            $count++;
          $cols[] = sprintf( 'col%1$u="%2$s"',$count, $name);
        }
        return implode(' ',$cols);
        
    }
    function make_title(string $title):string {
        return sprintf('<div class="split_column" %2$s>%1$s</div>',$title,static::col_names());
    }
}

trait split_title
{
  function make_title(string $title):string
    {
        return sprintf('<div class="alt_column" alt="%1$s">%2$s</div>',$title,str_replace(' ','<br />',$title));
    }
}

class rfield_split extends rfield_db
{
    use split_title;
}

abstract class rfield {
	protected $source;
	public $special = false;
	function __construct($source = null) {
		$this->source = $source;
	}
	
	function ctype():string
	{
	    return static::class;
	}
	
	function calculate(array &$row):void
	{
	    //
	}
	
	abstract function process(array &$row):string ;
	

	function make_delimiter($row,$col,$special = ''):string 
	{
	    return sprintf('<td %1$s >',$special );

	}
	
	function predelimit_title($predelimiter): string
	{
	    return $predelimiter;
	}
	
	function make_title(string $title):string
	{
		return $title;	
	}
	
	function post_process():void
	{
	}
	
	
	public static function make(  $source,string  $type = 'db'): rfield {
	    
	    switch ($type) {
	        case 'fixed':   return new rfield_fixed (  $source );
	        case 'null':    return new rfield_fixed ( 'null' );
	        case 'db': 		return new rfield_db ( $source );
	        case 'numeric': return new rfield_numeric ( $source );
	        case 'calc':    return new rfield_calc ( $source );
	        case 'sum': 	return new rfield_sum (  $source );
	        case 'split':   return new rfield_split($source);
	    }
	    
	}
}


class color_coded_field extends rfield {
	public $color;
	
	function __construct($source,string $color)
	{
		parent::__construct($source);
		$this->color = $color;
	}
	
	function process(array &$row):string
	{
		$value = $row[$this->source];
		if ($value > 0) {
		    return sprintf('<div style="background-color:%1$s;color:#fff">%2$s</div>',$this->color, $value);
		} else  { return $value; }
	}
}

class rfield_fixed extends rfield 
{
	protected $value = '';
	function __construct(string $value = '') 
	{
		$this->value = $value;
	}
	function process(array &$row):string {
		return $this->value;
	}
}

class rfield_dec extends rfield_db 
{
	protected $decimals = 0;
	function __construct(string $source = '', $decimals = 0) {
		$this->source = $source;
		$this->decimals = $decimals;
	}
	function process(array &$row):string {
		return number_format ( $row [$this->source], $this->decimals );
	}
}

class rfield_rank extends rfield {
	protected $type = 'rank';
	static $rank_values = array();
	function __construct($source = array())
	{
		$this->source = $source;
	}

	function process(array &$row):string
	{
	    static::$rank_values[$row['row_number']] = $row[$this->source];
		return sprintf('<div id="row_rank_%1$u">&nbsp;</div>',$row['row_number']);
	}
	
	function post_process():void
	{
		arsort(static::$rank_values);
		$rank = 0;
		echo '<script type="text/javscript">';
		foreach (static::$rank_values as $key => $sequence)
		{
			$rank++;
			echo '$("#row_rank_' . $key . '").html("' . $rank . '")';
		}
		echo '</script>';
	}
}

class rfield_db extends rfield {
	function process(array &$row):string {
		return (string) $row [$this->source];
	}
}

trait diff_set 
{
    static $set_id_it = 0;
    protected $opts = array();
    protected $index = 0;
    protected $set_id;
    protected $run = 0;
    
    function set_set_id()
    {
        $this->set_id =   ++static::$set_id_it;
    }
    
    function get_set_id():int
    {
        return $this->set_id;
    }
    
    function get_opts():array
    {
        return $this->opts;
    }
    
    
    function make_test(string $x)
    {
        $cleaned =   rtrim(str_replace('"','',strip_tags($x)),'  .');
        $code = md5(strtolower($cleaned));
        if (!isset($this->opts[$code])) {
            $this->opts[$code] = array($this->run , ++$this->index, $x);
        }
        return $this->opts[$code];
    }
    
    function code_letter(int $item_id):string
    {
        $letter = '';
        
        while($item_id != 0){
            $p = ($item_id - 1) % 26;
            $item_id = intval(($item_id - $p) / 26);
            $letter = chr(65 + $p) . $letter;
        }
        return $letter;
    }
}



class rfield_concat extends rfield_db
{
    protected $base_class = 'rfc';
        
    function make_piece(array $parts)
    {
        switch (sizeof($parts)) {
            case 3:   return sprintf('<div class="%4$s_DIV %4$sm_DIV" instance="%1$u">%2$s<div class="%4$sm_explain">%3$s</div></div>',$parts[1],$parts[0],$parts[2],$this->base_class); break;
            case 2:   return sprintf('<div class="%3$s_DIV" instance="%1$u">%2$s</div>',$parts[1],$parts[0],$this->base_class); break;
            case 1:   return sprintf('<div class="%2$s_DIV" >%1$s</div>',$parts[0],$this->base_class); break;
        }
        return '';
    }
    
    function process(array &$row):string
    {
        $values = explode(',',$row[$this->source]);
        $plist = array();
        $pcounter = 0;
        foreach ($values as $value)
        {
            $pcounter++;
            $parts = explode(':',$value);
            $pi_div = static::make_piece($parts);
            if (in_array($parts[0],Array('Present','Absent'))) {
                $plist[0] = $pi_div;
            } else {
                $plist[$pcounter] = $pi_div;
            }
        }
        ksort($plist);
        return sprintf('<div class="%1$s_holder" style="--spot_size:%2$0.2f%%">',$this->base_class,static::spot_size()) .  implode('',$plist) . '</div>';
    }
    
    function spot_size()
    {
        return false;
    }
}

trait rfield_analytics {
    protected $values = array();
    
    function analysis():array
    {
        if (empty($this->values)) { return array(); }
        $this->val_sum = array_sum($this->values);
        return array(
            'ave' => number_format($this->val_sum / count($this->values),2),
            'max' => number_format(floatval(max($this->values)),2),
            'min' => number_format(floatval(min($this->values)),2),
            'tot' => number_format($this->val_sum,2));
    }
    
    function save_value($value)
    {
        $this->values[] = $value;
        return $value;
    }

    public $analysis_count = 0;
    public $val_sum = 0;
}

class rfield_numeric extends rfield_db
{
    use rfield_analytics;
	protected $type  = 'numeric';
	
	function process(array &$row):string
	{
		return (string) $this->save_value($row [$this->source]);
	}
			
	function ar_show(string $label, string $value)
	{
	    echo sprintf('<tr><td>%1$s</td><td>%2$s</td></tr>',$label,$value);
	    $this->analysis_count++;
	}
	
}

class rfield_numeric_s extends rfield_numeric
{
    use split_title;
}

class rfield_sum extends rfield_numeric {
	protected $type = 'sum';
	function __construct($source = array()) {
		$this->source = $source;
	}
	function process(array &$row):string {
		$value = 0;
		foreach ( $this->source as $element ) {
			
			$value = $value + $row [$element];
		}
		return $this->save_value($value);
	}
}

class rfield_calc extends rfield_numeric {
	protected $type = 'calc';
	function process(array &$row, $data = false):string {
		if (! $data) {
			$data = $this->source;
		}
		if (is_array ( $data [0] )) {
			$val1 = $this->process ( $row, $data [0] );
		} else {
			$val1 = $row [$data [0]];
		}
		$operator = $data [1];
		$val2 = $row [$data [2]];
		if ($operator == '/') {
			if ($val2 == 0) {
				return $this->save_value(0);
			}
			return $this->save_value(round($val1 / $val2  , 3));
		}
		if ($operator == '*') {   return $this->save_value($val1 * $val2);    }
		if ($operator == '-') {   return $this->save_value(($val1 - $val2));  }
		if ($operator == '+') {   return $this->save_value($val2 + $val1);    }	
	}
}

class rfield_date extends rfield_db
{
    protected $type = 'date';
}

class rfield_date_color extends rfield_date
{
    protected $type = 'date';
    public $base_date;    
    
    function smake(string $source, string $base_date)
    {
        $x = new self($source);
        $x->base_date = $base_date;
        return $x;
    }

    function process(array &$row):string
    {
        $date_class = '';
        if ($row[$this->source] > $this->base_date) { $date_class = 'future_date';  }
        if ($row[$this->source] < $this->base_date) { $date_class = 'past_date';  }
        return sprintf('<div class="%2$s">%1$s</div>',$row[$this->source],$date_class);
    }
}


class rfield_link extends rfield {
	protected $type = 'link';
	protected $text = '<a href="%s">Link</a>';
	protected $else = 'N/A';
	
	
	function __construct($source,$link = '<a href="%s">Link</a>',$else = 'N/A')
	{
	    parent::__construct($source);
	    if ($link != '')
	    {
	        $this->text = $link;
	    }
	    $this->else  = $else;
	}
	
	function make_link(&$row, $text):string {
		return sprintf ( $text, $row [$this->source] );
	}
	function process(array &$row):string {
		return $this->make_link ( $row, $this->text );
	}

	function set_text($text):void
	{
		$this->text = $text;
	}
}

class rfield_link_else extends rfield_link
{
    function process(array &$row):string  {
        if (isset($this->source)) {
            if ($row[$this->source] != '') {
                return sprintf ( $this->text, $row [$this->source] );
            }
        }
        return $this->else;
    }
}

class rfield_options extends rfield_link {
	protected $type = 'option_box';
	public $options = array ();
	function process(array &$row):string {
		$returns = array();
		foreach ( $this->options as $pattern ) {
			$returns[] =  $this->make_link ( $row, $pattern ) ;
		}
		return implode(' ',$returns);
	}
}

class filter {
	function skip_row()
	{
		return false;
	}
}


class report {
	public static $report_count = 0;
	public static $rt_js = false;
	
	public $columns = array ();
	public $predelimiter = "";
	public $special_predelimeter = "";
	public $delimiter = "\t";
	public $row_predelimiter = "";
	public $firstrow_predelimeter = "";
	public $row_delimiter = "\n";
	public $filename, $mode, $blank_text;
	public $row_count = 0;
	
	
	protected $title = '';
	protected $order_by_hash = 0;
	public $order_by_array = array();
	public $order_by_option = '';
	protected $report_id = false;
	
	function debug(string $string): void
	{
	    return;
	}
	
	function set_title(string $title):void
	{
	    $this->title = $title;
	}
	
	function pre_delimit(int $row,int $col,&$field_obj):string
	{
    	return $this->predelimiter;
	}

	function fast_show(&$rows,bool $copyexport = false,bool $analysis = false)
	{
    	static::report_header($copyexport);
    	static::title_row();
    	static::data_rows($rows);
    	if ($analysis) { static::analysis_rows(); }
    	static::finalize_report();
	}
	
	function order_by_SELECT(array $options)
	{
	    $this->order_by_hash = md5(implode('',$this->order_by_array));
	    $cookie_option =false;
	    if (isset($_COOKIE[$this->order_by_hash])) {
	        $cookie_option = $_COOKIE[$this->order_by_hash];
	    }
	    if (isset($options[$cookie_option]))
	    {
	       $current_option = $cookie_option;  
	    } else {
	       $current_option = array_key_first($options);
	    }
	    
	    $this->order_by_array = $options;
	    $this->order_by_option = $current_option;
	    return $current_option;
	}
	
	
	function display_order_by()
	{
	    $select_options = array_keys($this->order_by_array);
	    $select_value = array_search($this->order_by_option,$select_options);
	    echo sprintf('<div class="dsr_option"><form class="obs_FORM" report_id="%1$u" method=POST action="" >Sort: %2$s</form></div>',self::$report_count,
	    to_select::make_object(
	        $select_options,'','ORDER_key','os_key_' . $this->get_report_id(),$select_value, sprintf('  class="obs_SELECT" hash="%1$s" ',$this->order_by_hash)));
	}
	
	function order_by_SQL($option = false,$pre_order = false): string
	{
        $base = ' ORDER BY ';
        if (!$option) { $option = $this->order_by_option; }
        if ($pre_order) { $base .= $pre_order . ' , '; }
        return  $base . $this->order_by_array[$option]; 
	}
	
	function column_show_picker($hide_ctypes)
	{
		$col_count = 0;
		$cols = array();
		$ctypes = array();
		foreach($this->columns as $title => $val)
		{
		    $ctype =  $val->ctype();
		    $ctypes[$ctype] = 1;
 		    $col_count++;
			if ($col_count > 2) {
			    $cols[] = sprintf('<div class="csp_column_DIV" ctype="%3$s"  column="%1$u" >&nbsp;%2$s</div>',$col_count,$title,$ctype);
			}
		}
		$ctypes = array_keys($ctypes);
		echo sprintf('<div class="csp_DIV" report_id="%1$u" >',$this->get_report_id()); //+1
		
		echo sprintf('<div class="csp_top_DIV" ctypes="%1$s" hidden_ctypes="%2$s">',implode(',',$ctypes),implode(',',$hide_ctypes)); //+1	
		echo '<div class="csp_title"><div state="show">Show</div><div state="hide">Hide</div></div>'; //+1+1-1+1-1-1 = 0
		echo '<div class="csp_show_all">Show All</div>'; // +1-1
		echo '</div>';                                   //   -1
		echo sprintf('<div class="csp_columns_DIV">%1$s</div>',implode("\n",$cols));            // +1-1
		
		echo '</div>';                                //-1
		
		self::load_report_js();		
		return '';
	}

	
	function get_report_id():int
	{
	   return $this->report_id;
	}
	
	function __construct(array $columns, string $blank_text ='No data found', string $delimiter = "\t", string $row_delimiter = "\n") {
		$this->report_id = ++self::$report_count;
		$this->columns = $columns;
		$this->blank_text = $blank_text;
		$this->delimiter = $delimiter;
		$this->row_delimiter = $row_delimiter;
	}
		
	function load_report_js()
	{
	    if (static::$rt_js == false) {
	        web_widget::load_js('/js/tableknife.js');
	        static::$rt_js = true;
	    }
	}
		
	/**
	 * this provides the HTML to show the copy button
	 */
	function copy_button(string $fmt)
	{
	   return sprintf('<button class="dsr_paste_button" pastetype="%1$s">%1$s</button>',$fmt);
	}
		
	function copy_buttons(array $x)
	{
	    $y = array();
	    foreach ($x as $fmt) {
	       $y[] = static::copy_button($fmt);
	    }
	    return implode('',$y);
	}
	
	/**
	 * manual row
	 */
	function manual_row(array $my_row):void {
		foreach ( $my_row as $val ) {
			echo $val . $this->delimiter;
		}
		echo $this->row_delimiter;
	}
	
	/*
	 * this function produces the title row
	 */
	function title_row():void 
	{
		echo $this->firstrow_predelimiter;
		foreach ( $this->columns as $title => $col ) {
			echo $col->predelimit_title($this->predelimiter) .  $col->make_title($title) . $this->delimiter;
		}
		echo $this->row_delimiter;
	}
	
	/**
	 * this delimits the beginning of a row
	 */
	
	function row_delimit(array $row):string
	{
       return sprintf($this->row_predelimiter,$this->row_count,2-($this->row_count %2));
    }   
	
	/*
	 * this function produces the data rows
	 */
	function data_rows(&$rows_query, &$filter = null) {
	    if (is_null($filter)) {
	        $filter = new \tableknife\filter();
	    }

		while ( $row = mysqli_fetch_assoc ( $rows_query ) ) {
			$row['row_number'] = $this->row_count;
			if ($filter->skip_row($row)) { continue; }
			echo static::row_delimit($row);
			++ $this->row_count;
			$col_count = 0;
			foreach ( $this->columns as &$field_obj ) {
				$col_count++;
				$field_obj->calculate($row);    //this function makes it so that we can do calculations before anything else on a field
				echo $this->pre_delimit($this->row_count,$col_count,$field_obj); 
				$return = $field_obj->process ( $row );
				if (is_array ( $return )) {
					$return_count = 0;
					foreach ( $return as $returns ) {
						$return_count ++;
						if ($return_count > 1) {
							echo $this->delimiter;
							echo $this->pre_delimit($this->row_count,$col_count,$field_obj);
						}
						echo $returns;
					}
				} else {
					echo $return;
				}
				echo $this->delimiter;
			}
			echo $this->row_delimiter;
		}

	}
	
	function analysis_rows($aps = array('ave','max','min'))
	{
	    $col = 0;
	    $col_analysis =array();
		foreach ($this->columns as &$my_column) 
		{
		    $col++;
			if (is_a($my_column,'tableknife\rfield_numeric')) {
		      $col_analysis[$col]	=	$my_column->analysis();
			}
		}
		
		if (!in_array('count',$aps)) {
		    $aps[] = 'count';
		    
		}
		$col_analysis[2]['count'] = sprintf('%1$u',$this->row_count); 
		
		$row_count = 0;
		foreach ($aps as $ap) {
		    $row_count++;
    		$go_col = 2;
    		$col_out = array();
    		$fname = strtoupper($ap);
    		if ($ap == 'ave') { $fname = 'AVERAGE'; }
    		while ($go_col <= $col) {
    		    //=SUM(INDIRECT(ADDRESS(2, COLUMN()) & ":" & ADDRESS(ROW() - 1, COLUMN())))
       		    if (isset($col_analysis[$go_col][$ap])) {
    		        $col_out[] = sprintf('<td class="hoveri" htype="fmla" fmla="=%1$s(INDIRECT(ADDRESS(2,COLUMN()) &amp; &quot;:&quot; &amp; ADDRESS(ROW() -%2$u,COLUMN())))" >%3$s</td>',
    		            $fname,$row_count,$col_analysis[$go_col][$ap]);
    		    } else { $col_out[] = '<td>&nbsp;</td>'; }
    		    $go_col++; 
		   }
		   echo sprintf('<tr class="analysis_TR" apart="%1$s"><td class="atype_TD">%2$s:</td>%3$s</tr>',$ap,ucfirst($ap),implode('',$col_out));
		}
	}
	

	
	function finalize_report($parameters = ''):bool
	{    
	    return true;
	}
}

class download_report extends report
{
    function report_header()
    {
        header ( "Pragma: public" ); // required
        header ( "Expires: 0" );
        header ( "Cache-Control: must-revalidate, post-check=0, pre-check=0" );
        header ( "Cache-Control: private", false );
        header ( "Content-Disposition: attachment; filename=\"" . $this->filename . "\";" );
    }
}

class file_report extends report
{
    public $contents = '';
    
    function report_header($copyexport = false)
    {
        ob_start ();
    }

    function finalize_report($parameters = ''): bool
    {
        if ($this->contents == '') {
            $this->contents = ob_get_contents ();
            ob_end_clean ();
            return true;
        }
    }
}

class report_web extends report {
    public $mode = 'web';
    
    function __construct($columns,string $blank_message = '')
    {
        parent::__construct($columns,$blank_message,'</td>','</tr>');
        $this->predelimiter = '<td>';
        $this->firstrow_predelimiter = '<tr class="header_TR">';
        $this->row_predelimiter = '<tr class="report_R%2$u" id="row_' . $this->get_report_id() . '_%1$d">';
    }
    
    static function table_class():string
    {
        return 'tableknife_TABLE';
    }
    
    function capsule_top()
    {
        echo sprintf('<div class="rt_DIV_inner"><TABLE report_id="%1$u" id="rt_%1$u" class="%2$s" >',self::$report_count, self::table_class());
    }
    
    function report_header($copyexport = false)
    {
            echo sprintf('<div class="dsr_outer" title="%1$s" rt_id="%2$u">',$this->title,$this->get_report_id()); //open outer
            echo '<div class="dsr_options" >'; //option top
            
            if (sizeof($this->order_by_array) > 0) {
                self::display_order_by();
            }
            
            if ($copyexport) {
                echo sprintf('<div class="dsr_paste_BOX" ></div>' .
                '<div class="dsr_button_BOX">Copy: %1$s</div>',  static::copy_buttons(array('XLS','G','TSV')));
            }
            echo '</div>';  //option_bottom
            self::capsule_top();
    }
    
    function pre_delimit(int $row,int $col,&$field_obj):string
    {
        return $field_obj->make_delimiter($row,$col);
    }
    
    function finalize_report($parameters = ''):bool
    {
        echo '</table>';
        if ($this->row_count == 0) {
            echo sprintf('<div class="dsr_empty_message">%1$s</div>',$this->blank_text);
        }
        echo '</div>';
        echo '</div>'; //close out wrapper
        foreach ($this->columns as $column)
        {
            $column->post_process();
        }
        return true;
    }
}

class report_email extends file_report
{
    public $mode = 'email';
}

class report_ftp  extends file_report
{
    public $mode = 'ftp';
    function finalize_report($parameters = ''):bool
    {
        $tmp_file = JUNK_DIR . '/' . $this->filename;
        parent::finalize_report($parameters);
        @chmod ($tmp_file, 0777 );
        $f_handle = fopen ( $tmp_file, 'w' );
        if (! $f_handle) { return false;  }
        if (! fwrite ( $f_handle, $this->contents )) {  return false; }
        fclose ( $f_handle );
        $conn_id = ftp_robust_connect ( $parameters ['host'], $parameters ['username'], $parameters ['password'] );
        ftp_put ( $conn_id, $parameters ['ftp_dir'] . $this->filename, $tmp_file, FTP_BINARY );
        @unlink ( $tmp_file );
        return true;
    }
}

?>
