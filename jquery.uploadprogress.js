/*	
	jQuery uploadprogress v 0.2
	copyright (c) 2008,2009 Jolyon Terwilliger
	
	requires a web server running PHP 5.2.x with the 
	PHP uploadprogress module compiled in or enabled as a shared object:
	http://pecl.php.net/package/uploadprogress

	Dual licensed under the MIT and GPL licenses:
	http://www.opensource.org/licenses/mit-license.php
	http://www.gnu.org/licenses/gpl.html

basic description:

	enhances file upload forms with hidden field and method on submit to 
	perform a JSON post request to a PHP servlet that uses the 
	PHP uploadprogress module methods to send back transfer progress
	information.

usage:

	jQuery('form#upload_form').uploadProgress({ id:'uniqueid' | keyLength:11 });

	if no id is passed, a key of keyLength or 11 characters is generated and applied to the target form as a hidden field to key the upload session.


additional parameters:

	dataFormat - default: 'json' - only viable option at this point would be jsonp (qv.)

	progressURL - default: none - this is the relative or absolute URL used for the uploadprogress update post request.

	progressInterval - default: 1000 - in milliseconds - how long between uploadprogress requests.  regardless how low this interval is set, the previous info request must finish before the next will be sent.  This is for stability and performance.

	debugDisplay - default: none - if set, used as a selector for DOM element to display debug output.

	progressDisplay - default: .upload-progress - selector for DOM element to target output container ( used to calculate meter constraints and any displayFields specified return data )

	progressMeter - default: .meter - selector for DOM element that will be horizontally resized against inner width of progressDisplay minus 10 pixels as upload progress changes. To disable meter updates, set this to false.

	fieldPrefix - default: . (class selector) - selector prefix for jQuery DOM capture of displayField sub-elements of progressDisplay selector.

	displayFields - default (Array): ['est_sec'] - array of fields to parse from return ajax request data and target on to DOM elements prefixed by fieldPrefix.  See demo and example php servlet for details.

*/

var uploadProgressSettings = new Array();
var uploadProgressInterval = new Array();
var uploadProgressWait = new Array();

jQuery.fn.extend({

	uploadProgress: function(o) {
		uploadTag = jQuery('input[name="UPLOAD_IDENTIFIER"]',this);
		if (!o.id && uploadTag.length)
			o.id = uploadTag.val();
		if (!o.id)
			o.id = genUploadKey(o.keyLength);
		
		if (uploadTag.length)
			uploadTag.val(o.id);
		else
			jQuery('<input type="hidden" name="UPLOAD_IDENTIFIER"/>').val(o.id).prependTo(this);
		
		o = jQuery.extend({ dataFormat: 'json',
						    progressInterval: 1000,
							debugDisplay : '#upload-progress-debug',
							progressDisplay : '.upload-progress',
							progressMeter : '.meter',
							fieldPrefix: '.',
							displayFields : ['est_sec']},o);
		
		uploadProgressSettings[o.id] = o;
		
		
		// doesn't work with concurrent form post/upload on webkit/opera ... 
		jQuery(this).submit(function () { 
			uploadProgressInterval[o.id] = window.setTimeout("jQuery.uploadProgressUpdate('"+o.id+"')",o.progressInterval);
			return true;
		} );
		
		return this;

		function genUploadKey(len) {
			if (!len) len = 11;
			var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
			var key='';
			for (var i=0;i<len;i++) {
    			var charnum = Math.floor(Math.random()*(chars.length+1));
				key += chars.charAt(charnum);
			}
		    return key;
		}
	}
});

jQuery.extend({
	uploadProgressUpdate: function(id) {
		var o = uploadProgressSettings[id];
		if (uploadProgressWait[id]) return false;
		uploadProgressWait[id] = true;
		jQuery.ajax({url:o.progressURL, data:{'upload_id':id}, success: 
			function(data) { 
				if (data['error']) {
					alert(data['error']);
				}
				else {
					if (o.debugDisplay) {
						var q='';
						for (var prop in data) {
							q += prop + ': '+data[prop]+'<br />';
						}
						jQuery(o.debugDisplay).html(q);
					}
					if (o.progressMeter) {
						var factor = (jQuery(o.progressDisplay).width()-10)/data['bytes_total'];
						jQuery(o.progressMeter).width(data['bytes_uploaded']*factor);
					}
					for (var d = 0; d<o.displayFields.length; d++) {
						jQuery(o.fieldPrefix+o.displayFields[d], o.progressDisplay).html(data[o.displayFields[d]]);
					}
				}
				uploadProgressInterval[o.id] = window.setTimeout("jQuery.uploadProgressUpdate('"+o.id+"')",o.progressInterval);
				uploadProgressWait[id] = false;
			}, dataType:o.dataFormat, error:function(xhr, err, et) {
				alert(err);
			}
		);
	}
});
