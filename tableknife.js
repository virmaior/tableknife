class tn_grandpa 
{
	me;
	context = "";
	url = "";
	set_me(x)
	{
		this.log(' me set');
		this.me = x;
	}
	get_me()
	{
		return this.me;
	}
		
	log(x)	
	{
		console.log( this.context + ' - ' + x)
	}
}

class tn_dad extends tn_grandpa
{
		sb()
		{
			const ho = this.get_me();
			ho.log('binding');
		}
		eb() {
			const ho = this.get_me();
			ho.log('bound');
		}
		first_init()
		{
			this.set_me(this);
			this.init();
		}
		init()
		{
			const ho = super.get_me();
			ho.log('initialized ' + ho.context);
			ho.bind();
		}
}

class table_knife extends tn_dad {
	la = [];
	output = '';
	col_names = [];
	rt_id = 0;
	columns = [];
	rt_obj = false;
	csp = false;
	manager = false;
	context="tableknife"
	
	first_init()
	{
		this.set_me(this);
		this.init();
	}
	
	init()
	{
		const ho = super.get_me();
		ho.log('initialized ' + ho.context);
		ho.bind();
	}

	first_hide() 
	{
		const ho = super.get_me();
		if (ho.csp.length == 0) { ho.log("no hide columns in " + ho.rt_id); return false; }
		const my_string = ho.manager.readCookie('rt_' + ho.rt_id);
		if (my_string == null) { return false; }
		if (my_string == '') { return false; }
		ho.columns = my_string.split(',');
		var parts = "";
		for (var col_id in ho.columns) {
			parts = col_id.split("=")
			if (parts[1] == 1) {
				ho.rt_obj.find('TR > TD:nth-child(' + parts[0] + '	)').prop('checked', false);
				ho.set_column(1, parts[0], true);
			}
		}
		if (ho.csp.find('.csp_show_ctype').length != 0) { return false; }
		const ctypes = ho.csp.find('.csp_top_DIV').attr('ctypes').split(',');
		var hidden_ctypes = ho.csp.find('.csp_top_DIV').attr('hidden_ctypes').split(',');
		var top_divs = [];
		ctypes.forEach(function(item) {
			if (item == 'rfield_db') { return false; }
			var my_state = 'show';
			if (hidden_ctypes.indexOf(item) != -1) { my_state = 'hide'; }
			top_divs.push('<div class="csp_show_ctype" ctype="' + item + '" state="' + my_state + '"> ' + item + '</div>');
		});
		$('.csp_top_DIV').html(top_divs.join(''));

		//expand the ctypes onto each TD and to the analysis rows if existent
		ho.rt_obj.find('.header_TR TD DIV').each(function() {
			if ($(this).attr('ctype')) {
				var ctype = $(this).attr('ctype');
				var my_td = $(this).parent();
				my_td.attr('ctype', ctype);
				var index = $(this).parent().index();
				ho.rt_obj.find('.analysis_TR').each(
					function() {
						$(this).find('> TD').eq(index).attr('ctype', ctype);
					}
				);
			}
		});
		//hide the hidden ctypes in the table
		hidden_ctypes.forEach(function(item) {
			ho.rt_obj.find('TD[ctype=' + item + ']').attr('state', 'hide');
		});
		ho.csp.find('.csp_show_ctype').off('click').on('click', function(e) {
			e.preventDefault();
			var my_state = 'show';
			if ($(this).attr('state') == 'show') {
				my_state = 'hide';
			}
			$(this).attr('state', my_state);
			ho.rt_obj.find('TD[ctype=' + $(this).attr('ctype') + ']').attr('state', my_state)
		});
	}

	set_column(col_id, my_value) 
	{
		const ho = super.get_me();
		var my_state = 'show';
		if (my_value == false) {
			ho.columns[col_id] = col_id + "=" + 1;
			my_state = 'hide';
		} else {
			ho.columns[col_id] = col_id + "=" + 0;
		}
		ho.rt_obj.find('td:nth-child(' + col_id + ')').attr('state', my_state);
		ho.manager.createCookie('rt_' + ho.rt_id, ho.columns.join());
	}
	show_only_row(row_id) 
	{
		const ho = super.get_me();
		ho.log('showing only row ' + row_id);
		ho.rt_obj.find("TR[id^=row_" + ho.rt_id + "]").addClass('hide_ROW');
		ho.rt_obj.find("TR[id=row_" + ho.rt_id + "_" + row_id + "]").removeClass('hide_ROW');
	}
	show_all_rows() 
	{
		const ho = super.get_me();
		ho.log('showing all rows');
		ho.rt_obj.find('TR').removeClass("hide_ROW");
	}
	show_all() 
	{
		const ho = super.get_me();
		ho.log('showing all columns');
		$(ho.csp).find('.csp_column_DIV').attr('state', 'show');
		ho.rt_obj.find('TD').attr('state', 'show');
	}

	hide_many(many_string) 
	{
		const ho = super.get_me();
		const many = many_string.split(',');
		for (var i = 0; i < many.length; i++) {
			ho.set_column(many[i], false);
		}
	}

	rload() {
		window.location.href = window.location.href;
	}

	bind(report_id, rt_manager) 
	{
		const ho = super.get_me();
		ho.sb();
		ho.manager = rt_manager;
		ho.rt_id = report_id;

		ho.rt_obj = $('.tableknife_TABLE[report_id=' + ho.rt_id + ']');
		ho.csp = $('.csp_DIV[report_id="' + ho.rt_id + '"]');
		ho.dsr = $('.dsr_outer[rt_id=' + ho.rt_id + ']');

		var row = 0;
		ho.rt_obj.find('>TBODY>TR').each(function() {
			row++;
			var col = 0;
			$(this).attr('arow', row);
			$(this).children('TD').each(function() {
				col++;
				$(this).attr('row', row).attr('col', col).attr('cella', ho.make_column_letter(col) + row);
			})
		});

		ho.csp.find('.csp_show_all').off('click').on('click', function(e) {
			e.preventDefault();
			ho.show_all();
		});
		ho.csp.find(".csp_column_DIV").off('click').on('click', function() {
			var show = true;
			if ($(this).attr('state') == 'show') {
				$(this).attr('state', 'hide');
				show = false;
			} else {
				$(this).attr('state', 'show');
			}
			ho.set_column($(this).attr('column'), show);
		});

		if (ho.rt_obj.find('.rank_TD')) {
			ho.rank_column();
		}
		ho.rt_obj.off('rload').on('rload', function() {
			ho.rload();
		});

		ho.first_hide();

		ho.dsr.find('.rt_view_SELECT[report_id=' + ho.rt_id + ']').off('change').on('change', function() {
			const show_row = $(this).val();
			if (show_row > 0) {
				ho.show_only_row(show_row);
			}
			else { ho.show_all_rows(); }
		});

		ho.dsr.find('.dsr_button_BOX BUTTON').off('click').on('click', function(e) {
			e.preventDefault();
			const $btn = $(this);
			ho.process();
			switch ($btn.attr('pastetype')) {
				case 'XLS': ho.paste_xls(); break;
				case 'G': ho.paste_g(); break;
				case 'TSV': ho.save_tsv(); break;
			}
			ho.dsr.attr('state','done');

		});

		ho.dsr.find('.obs_SELECT').off('change').one('change', function(e) {
			e.preventDefault();
			document.cookie = 'obsjump=' + $(this).attr('hash');
			document.cookie = $(this).attr('hash') + "=" + $(this).find("option:selected").text();
			ho.rt_obj.trigger('rload');
		});

		ho.rt_obj.find('.hoveri').off('mouseenter').on('mouseenter', function(e) {
			e.preventDefault();
			if ($(this).find('.hoveri_DIV').length > 0) { return false; }
			ho.manager.compose_hoveri($(this));
		});

		ho.eb();
	}

	make_column_letter(oval) 
	{
		const ho = super.get_me();
		if (ho.col_names[oval]) { return ho.col_names[oval]; }
		function upshiftAZ(match, offset) {
			var shift = 0;
			if (offset > 0) { shift = 1; }
			return String.fromCharCode(match.toUpperCase().charCodeAt(0) + 9 + shift);
		}
		function upshift09(match, offset) {
			var shift = 0;
			if (offset > 0) { shift = 1; }
			return String.fromCharCode(match.charCodeAt(0) + 16 + shift);
		}

		const out_val = oval.toString(27).replace(/[A-Za-z]/g, upshiftAZ).replace(/[0-9]/g, upshift09);
		ho.col_names[oval] = out_val;
		return out_val;
	}

	process_inner_table(that) 
	{
		var pieces = []
		that.find('>*>tr>td, >tr>td').each(function() { pieces.push($(this).text()); });
		that.replaceWith(pieces.join(' '));
	}

	decode_fmla(fmla, x) {
		const ho = super.get_me();
		var run_count = 0;
		let action="";
		while (fmla.indexOf(String.fromCharCode(189)) > -1) {
			run_count++;
			var instruction_start = fmla.indexOf(String.fromCharCode(189));
			var instruction_end = fmla.indexOf(String.fromCharCode(190));
			if (instruction_end <= -1) {
				ho.log("invalid magic formula length");
				return false;
			}
			instruction_end = instruction_end + 1; //correct to express inclusion
			const instruction = fmla.substring(instruction_start, instruction_end);
			const parts = instruction.split("");
		
			ho.log('magic instuction: ' + instruction + ' found. Length = ' + instruction.length + ' (=  ' + (instruction_end - instruction_start) + ') command = ' + parts[0] + ' mode = ' + parts[1] + instruction.substr(3, instruction.length - 4));
			{
				action = parts[2];
				switch (action) {
					case 'A':
						//if (x == 21) { ho.log('instruction:' + instruction + ' from ' + fmla); }
						const target = instruction.substr(3, instruction.length - 4);
						const targ_bits = target.split('_');

						const target_id = 'TD[row=' + targ_bits[1] + '][col=' + targ_bits[2] + ']';
						ho.log(target + " \n" + targ_bits + "\n" + target_id);
						const target_x = $(target_id).parent().children(':visible').index($(target_id)) + 1;
						var xletter = ho.make_column_letter(target_x);
						break;
					case '-':
					case '+': var xletter = ho.make_column_letter(x - parts[3]); break;
					default: console.log('unknown parse action ' + action + ' in fmla');

				}
				fmla = fmla.split(instruction).join(xletter);
			}
			if (run_count > 50) {
				ho.log('parse loop for fmla. dying due to inability to parse in 50 attempts.');
				return false;
			}
		}
		ho.log("resolved to " + fmla);
		return fmla;
	}

	decode_td_fmla(me) {
		const ho = super.get_me();
		const fmla = $(me).attr('fmla');
		const x = $(me).closest('TR').children(':visible').index($(me)) + 1; //convert to start at 1
		ho.log("considering formula " + fmla + " at x " + x);
		return ho.decode_fmla(fmla, x);
	}

	process() 
	{
		const ho = super.get_me();
		ho.log("copy action fired for rt_id = " + ho.rt_id);
		if (ho.dsr.attr('state') == 'processing') {
			alert('already in progress.');
			return false;
		}
		ho.dsr.attr('state', 'processing');

		var $simplify = $('<table class="tableknife_TABLE">' + ho.rt_obj.html() + '</table>');
		$simplify.find('TABLE:not(.tableknife_TABLE)').each(function() { ho.process_inner_table($(this)); });

		$simplify.find('[state=hide] , [nopaste]').each(function() { $(this).remove() });
		$simplify.find('.split_column').each(function() {
			const my_TD = $(this).parent();
			var afters = [];

			var col_count = 1;
			var next_col;
			while ((next_col = $(this).attr('col' + col_count)) !== undefined) {
				afters.push('<td>' + next_col + ' </td>');
				col_count++;
			}
			my_TD.after(afters.join(''));
			if (my_TD.attr('row') == 1) {
				var al = '.analysis_TR > TD[col=' + my_TD.attr('col') + ']';
				$simplify.find(al).after('<td></td>'.repeat(col_count - 2));
			}
			my_TD.remove();
		});
		$simplify.find('.alt_column').each(function() {
			$(this).html($(this).attr('alt'));
		});
		$simplify.find('[fmla]').each(function() {
			ho.rt_obj.attr('wcell', $(this).attr('cella'));
			const x = $(this).closest('TR').find("TD").index(this) + 1;
			const fmla = ho.decode_fmla($(this).attr('fmla'), x);
			$(this).html(fmla).attr('fmla', '');
		});

		ho.output = $simplify.html();
		ho.dsr.attr('state', '');
		ho.dsr.find('.dsr_paste_BIN').html();
	}
	paste_xls() {
		const ho = super.get_me();
		ho.log('pasted to clipboard in XLS mode');

		navigator.clipboard.writeText('<x:Workbook ' +
			' xmlns="urn:schemas-microsoft-com:office:spreadsheet" ' +
			' xmlns:o="urn:schemas-microsoft-com:office:office" ' +
			' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ' +
			' xmlns:x="urn:schemas-microsoft-com:office:excel" ' +
			'><Worksheet ss:Name="Test"><table >' + ho.output + '</table></Worksheet></Workbook>');
	}
	paste_g() {
		const ho = super.get_me();
		var output = ho.output.replace('<tr', '<tx').replace('<td', '<ty'). //remove first offset
			replaceAll('<td', String.fromCharCode(9) + '<td'). //replace all <td with control character
			replaceAll('<tr', String.fromCharCode(13) + String.fromCharCode(10) + '<tr'). //replace all <TR with control character
			replaceAll('&nbsp;', ' '). //replace space entity with space
			replaceAll('&amp;', '&');
		var output = output.replace(/<[^>]*>?/gm, '').replaceAll(String.fromCharCode(13) + String.fromCharCode(10) + String.fromCharCode(9), String.fromCharCode(13) + String.fromCharCode(10));
		ho.log('pasted to clipboard in Sheets mode: ' + output);
		navigator.clipboard.writeText(output);
	}
	save_tsv() {
		const ho = super.get_me();
		var o_trs = [];

		$(ho.output).find('TR').each(function() {
			var o_tds = [];
			$(this).find('TD').each(function() {
				var me = $(this).text();
				if (me.indexOf(',') !== -1) { me = '"' + me + '"'; }
				if (me == "") { me = " "; }
				o_tds.push('' + me + '');
			})
			o_trs.push(o_tds.join(','));
		});

		var output = o_trs.join(String.fromCharCode(13) + String.fromCharCode(10));

		const blob = new Blob([
			new Uint8Array([0xEF, 0xBB, 0xBF]), // UTF-8 BOM
			output
		],
			{ type: "text/plain;charset=utf-8" });

		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');  // Create a new anchor element
		a.href = url;
		a.download = 'table.tsv';
		a.click();
	}

	rank_column() {
		const ho = super.get_me();
		var ranks = ho.rt_obj.find(".rank_TD");
		ho.log('rt_ ' + ho.rt_id + ' has ' + ranks.length + ' ranks');
		ranks.each(function() {
			const x = $(this).attr('col');
			const y = $(this).attr('row');
			$(this).attr('grand_total', ho.rt_obj.find('TD[col=' + ((x * 1) - 1) + '][row=' + y + ']').html());
		});
		var sorted_ranks = ranks.sort((a, b) => parseFloat($(b).attr('grand_total')) - parseFloat($(a).attr('grand_total')));
		var rank_count = 1;
		var equals = 1;
		var current_value = 0;
		sorted_ranks.each(function() {
			$(this).html(rank_count);
			if ($(this).attr('grand_total') > current_value) {
				rank_count += equals;
				equals = 1;
			} else { equals++; }
		});
		ho.log('rank_column ran on rt id ' + ho.rt_id);
	}

	log(x) 
	{
		this.la.push(x);
	}
}


var tableknife_manager = {
	tts: [],
	report_id: 100,
	createCookie: function(name, value, days) {
		var expires = "";
		if (days) {
			var date = new Date();
			date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
			expires = "; expires=" + date.toGMTString();
		}
		document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + expires + "; path=/";
	},
	readCookie: function(name) {
		var nameEQ = encodeURIComponent(name) + "=";
		var ca = document.cookie.split(';');
		for (var i = 0; i < ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0) === ' ') c = c.substring(1, c.length);
			if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
		}
		return null;
	},
	up_id: function() {
		return this.report_id++;
	},
	h_id: 0,
	new_h_id() {
		this.h_id++;
		return this.h_id;

	},
	hovers: {
		"val": function(me, ptd, h_id) { return ' >' + $(ptd).attr('fmla'); },
		"fmla": function(me, ptd, h_id) {
			const my_rt = $(ptd).closest('.tableknife_TABLE');
			const rt_id = $(my_rt).attr('report_id');
			var fmla = me.tts[rt_id].decode_td_fmla(ptd);
			return ' >' + fmla;
		}
	},
	compose_hoveri: function(ptd) {
		const h_id = this.new_h_id();
		const htype = $(ptd).attr('htype');
		if (typeof (this.hovers[htype]) !== "undefined") {

			const hout = this.hovers[htype](this, ptd, h_id);
			$(ptd).append('<div class="hoveri_DIV" h_id="' + h_id + '" htype="' + htype + '" ' + hout + '</div>');
		}

		$(ptd).on('mouseleave', function(e) {
			e.preventDefault();
			$('.hoveri_DIV[h_id=' + h_id + ']').remove();
		});
	},

	initialize: function() {
		var me = this;
		$('.tableknife_TABLE').each(function() {
			var report_id = $(this).attr('report_id');
			if (report_id === undefined) {
				report_id = me.up_id();
				$(this).attr('report_id', report_id);
			}
			var y = new table_knife();
			y.first_init();
			y.bind(report_id, me);
			me.tts[report_id] = y;
		});

		//jump to location if we have a jump cookie
		obs_location = me.readCookie('obsjump')
		if (obs_location) {
			var obs = $(".obs_SELECT[hash=" + obs_location + ']');
			if (obs.length > 0) {
				$(document).scrollTop(obs.offset().top - 100);
				document.cookie = 'obsjump' + '=; expires=Thu, 01-Jan-70 00:00:01 GMT;';
			}
		}
	}
}

$(document).ready(function() {
	tableknife_manager.initialize();
});