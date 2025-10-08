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

class TableKnife extends tn_dad {
	la = [];
	output = '';
	col_names = [];
	rt_id = 0;
	columns = [];
	rt_obj = false;
	csp = false;
	manager = false;
	context="tableknife"
	
	first_init(report_id, rt_manager)
	{
		this.set_me(this);
		this.bind(report_id, rt_manager) 
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
		const $top_DIV =  ho.csp.find('.csp_top_DIV');
		const ctypes = $top_DIV.attr('ctypes').split(',');
		const hidden_ctypes = $top_DIV.attr('hidden_ctypes').split(',');
		var top_divs = [];
		ctypes.forEach(function(item) {
			if (item == 'rfield_db') { return false; }
			var my_state = 'show';
			if (hidden_ctypes.indexOf(item) != -1) { my_state = 'hide'; }
			top_divs.push('<div class="csp_show_ctype" ctype="' + item + '" state="' + my_state + '"> ' + item + '</div>');
		});
		$top_DIV.html(top_divs.join(''));

		//expand the ctypes onto each TD and to the analysis rows if existent
		ho.rt_obj.find('.header_TR td div').each((index, div) => {
		  const ctype = $(div).attr('ctype');
		  if (ctype) {
		    const $parentTd = $(div).parent();
		    $parentTd.attr('ctype', ctype);
		    const tdIndex = $parentTd.index();
		    ho.rt_obj.find('.analysis_TR').each((i, analysisTr) => {
		      $(analysisTr).find('> td').eq(tdIndex).attr('ctype', ctype);
		    });
		  }
		});
		//hide the hidden ctypes in the table
		hidden_ctypes.forEach(function(item) {
			ho.rt_obj.find('TD[ctype=' + item + ']').attr('state', 'hide');
		});
		ho.csp.find('.csp_show_ctype').off('click').on('click', (e) => {
			e.preventDefault();
			const $t = $(e.currentTarget);
			let my_state = 'show';
			if ($t.attr('state') == 'show') {
				my_state = 'hide';
			}
			$t.attr('state', my_state);
			ho.rt_obj.find('TD[ctype=' + $t.attr('ctype') + ']').attr('state', my_state)
		});
	}

	set_column(col_id, my_value) 
	{
		const ho = super.get_me();
		let my_state = 'show';
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
		ho.csp.find('.csp_column_DIV').attr('state', 'show');
		ho.rt_obj.find('TD').attr('state', 'show');
	}

	hide_many(many_string) 
	{
		const ho = super.get_me();
		const many = many_string.split(',');
		for (let i = 0; i < many.length; i++) {
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
			const $r = $(this);
			row++;
			let col = 0;
			$r.attr('arow', row);
			$r.children('TD').each(function() {
				col++;
				$(this).attr('row', row).attr('col', col).attr('cella', ho.make_column_letter(col) + row);
			})
		});

		ho.csp.find('.csp_show_all').off('click').on('click', (e) => {
			e.preventDefault();
			ho.show_all();
		});
		ho.csp.find(".csp_column_DIV").off('click').on('click', (e) => {
			let show = true;
			const $c = $(e.currentTarget);
			if ($c.attr('state') == 'show') {
				$c.attr('state', 'hide');
				show = false;
			} else {
				$c.attr('state', 'show');
			}
			ho.set_column($c.attr('column'), show);
		});

		if (ho.rt_obj.find('.rank_TD')) {
			ho.rank_column();
		}
		ho.rt_obj.off('rload').on('rload', function() {
			ho.rload();
		});

		ho.first_hide();

		ho.dsr.find('.rt_view_SELECT[report_id=' + ho.rt_id + ']').off('change').on('change', (e) => {
			const show_row = $(e.currentTarget).val();
			if (show_row > 0) {
				ho.show_only_row(show_row);
			}
			else { ho.show_all_rows(); }
		});

		ho.dsr.find('.dsr_button_BOX BUTTON').off('click').on('click', (e) => {
			e.preventDefault();
			const $btn = $(e.currentTarget);
			ho.process();
			switch ($btn.attr('pastetype')) {
				case 'XLS': ho.paste_xls(); break;
				case 'G': ho.paste_g(); break;
				case 'TSV': ho.save_tsv(); break;
			}
			ho.dsr.attr('state','done');

		});

		ho.dsr.find('.obs_SELECT').off('change').one('change', (e) => {
			const $t = $(e.currentTarget);
			e.preventDefault();
			document.cookie = 'obsjump=' + $t.attr('hash');
			document.cookie = $t.attr('hash') + "=" + $t.find("option:selected").text();
			ho.rt_obj.trigger('rload');
		});

		ho.rt_obj.find('.hoveri').off('mouseenter').on('mouseenter', (e) => {
			e.preventDefault();
			const $t = $(e.currentTarget);
			if ($t.find('.hoveri_DIV').length > 0) { return false; }
			ho.manager.compose_hoveri($t);
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
			const $t = $(this);
			const my_TD = $t.parent();
			var afters = [];

			var col_count = 1;
			var next_col;
			while ((next_col = $t.attr('col' + col_count)) !== undefined) {
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
			const $t = $(this);
			ho.rt_obj.attr('wcell', $t.attr('cella'));
			const x = $t.closest('TR').find("TD").index(this) + 1;
			const fmla = ho.decode_fmla($t.attr('fmla'), x);
			$t.html(fmla).attr('fmla', '');
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
		const rtObj = ho.rt_obj[0]; // Convert jQuery object to DOM element
		const ranks = rtObj.querySelectorAll('.rank_TD');
		ho.log(`rt_${ho.rt_id} has ${ranks.length} ranks`);

		ranks.forEach(element => {
		  const col = element.getAttribute('col');
		  const row = element.getAttribute('row');
		  const targetTd = rtObj.querySelector(`td[col="${Number(col) - 1}"][row="${row}"]`);
		  const grandTotal = targetTd ? targetTd.innerHTML : '';
		  element.setAttribute('grand_total', grandTotal);
		});

		const sortedRanks = Array.from(ranks).sort((a, b) => {
		  const grandTotalA = parseFloat(a.getAttribute('grand_total')) || 0;
		  const grandTotalB = parseFloat(b.getAttribute('grand_total')) || 0;
		  return grandTotalB - grandTotalA;
		});

		let rankCount = 1;
		let equals = 1;
		let currentValue = 0;

		sortedRanks.forEach(element => {
		  element.innerHTML = rankCount;
		  const grandTotal = parseFloat(element.getAttribute('grand_total')) || 0;
		  if (grandTotal > currentValue) {
		    rankCount += equals;
		    equals = 1;
		  } else {
		    equals++;
		  }
		});

		ho.log(`rank_column ran on rt id ${ho.rt_id}`);
	}

	log(x) 
	{
		this.la.push(x);
	}
}


const tableknife_manager = {
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
		const $ptd = $(ptd);
		const htype = $ptd.attr('htype');
		if (typeof (this.hovers[htype]) !== "undefined") {

			const hout = this.hovers[htype](this, ptd, h_id);
			$ptd.append('<div class="hoveri_DIV" h_id="' + h_id + '" htype="' + htype + '" ' + hout + '</div>');
		}

		$ptd.on('mouseleave', (e) =>  {
			e.preventDefault();
			document.querySelectorAll(`.hoveri_DIV[h_id="${h_id}"]`).forEach(element => element.remove());
		});
	},

	initialize: function() {
		const tables = document.querySelectorAll('.tableknife_TABLE');
		tables.forEach(table => {
		  let reportId = table.getAttribute('report_id');
		  if (reportId === null) {
		    reportId = this.up_id();
		    table.setAttribute('report_id', reportId);
		  }
		  const y = new TableKnife();
		  y.first_init(reportId, this);
		  this.tts[reportId] = y;
		});

		//jump to location if we have a jump cookie
		let obs_location = this.readCookie('obsjump');
		if (obs_location) {
		  const obs = document.querySelector(`.obs_SELECT[hash="${obs_location}"]`);
		  if (obs) {
		    window.scrollTo({ top: obs.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' });
		    document.cookie = 'obsjump=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
		  }
		}
	}
}

document.addEventListener('DOMContentLoaded', () => {
  tableknife_manager.initialize();
});