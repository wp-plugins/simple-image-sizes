// Functions for the regenerating of images
var regenerate = {
	post_types : '',
	thumbnails : '',
	list : '',
	cur : 0,
	timeScript: new Array,
	dateScript: '',
	percent : '' ,
	getThumbnails : function() {
		var _self = this;
		var inputs = jQuery( 'input.thumbnails:checked' );
		
		// Get the checked thumbnails inputs
		if (inputs.length != jQuery( 'input.thumbnails[type="checkbox"]' ).length) {
			inputs.each( function( i ) {
				_self.thumbnails += '&thumbnails[]=' + jQuery( this ).val();
			});
		}	
	},
	getPostTypes : function() {
		var _self = this;
		var inputs = jQuery( 'input.post_types:checked' );
	
		// Get the checked post Types inputs
		if ( inputs.length != jQuery( 'input.post_types[type="checkbox"]' ).length ) {
			inputs.each( function() {
				_self.post_types += '&post_types[]=' + jQuery( this ).val();
			} );
		}
	},
	setMessage : function( msg ) {
		// Display the message
		jQuery("#regenerate_message").html( "<p>" + msg + "</p>" ).addClass( 'updated' ).addClass( 'fade' ).show();
		this.refreshProgressBar();
	},
	setTimeMessage : function ( msg ) {
		jQuery("#time p span.time_message").html( msg );
	},
	refreshProgressBar: function(){
		// Refresh the progress Bar
		jQuery(".progress").progressbar();
	},
	startRegenerating : function( ) {
		var _self = this;
		
		this.dateScript = new Date();
		
		// Start ajax
		jQuery.ajax( {
			url: sis.ajaxUrl,
			type: "POST",
			dataType: 'json',
			data: "action=sis_ajax_thumbnail_rebuild&do=getlist" + _self.post_types,
			beforeSend: function() {
				
				// Disable the button
				jQuery( "#ajax_thumbnail_rebuild" ).attr( "disabled", true );
				jQuery("#time").show();
				// Display the message
				_self.setMessage(  sis.reading );
				
				// Get the humbnails and post types
				_self.getThumbnails();
				_self.getPostTypes();
			},
			success: function( r ) {
				// Eval the response
				_self.list = r ;
				
				// Set the current to 0
				_self.curr = 0;
				
				// Display the progress Bar
				jQuery( '.progress' ).show();
				
				// Start Regenerating
				_self.regenItem();
			}
		});
	},
	regenItem : function( ) {
		var _self = this;
		
		// If the list is empty display the message of emptyness and reinitialize the form
		if ( !this.list ) {
			this.reInit();
			this.setMessage( sis.noMedia );
			return false;
		}
		
		// If we have finished the regeneration display message and init again
		if ( this.curr >= this.list.length ) {
			var now = new Date();
			this.reInit();
			this.setMessage( sis.done+this.curr+' '+sis.messageRegenerated+' finished at :'+now.getHours()+":"+now.getMinutes()+":"+now.getSeconds() );
			return;
		}
		
		// Set the message of current image regenerating
		this.setMessage( sis.regenerating + ( this.curr + 1 ) + sis.of + this.list.length + " (" + this.list[this.curr].title + ")...");

		jQuery.ajax( {
			url: sis.ajaxUrl,
			type: "POST",
			dataType: 'json',
			data: "action=sis_ajax_thumbnail_rebuild&do=regen&id=" + this.list[this.curr].id + this.thumbnails,
			beforeSend : function() {
				// Calculate the percentage of regeneration
				_self.percent = ( _self.curr / _self.list.length ) * 100;
				
				// Change the progression
				jQuery( ".progress" ).progressbar( "value", _self.percent );
				
				// Change the text of progression
				jQuery( ".progress-percent span.text" ).html( Math.round( _self.percent ) + "%").closest( '.progress-percent' ).animate( { left: Math.round( _self.percent )-2.5 + "%" }, 500 );
			},
			success: function( r ) {
				
				// Check if error or a message in response
				if( ( !r.src || !r.time ) && r.error ) {
					jQuery( '#error_messages' ).addClass( 'error message' );
					jQuery( '#error_messages ul.messages' ).append( '<li>'+r.error+'</li>' );
				} else {
					
					// Append a message if needed
					if( r.message )
						jQuery( '#time ul.messages' ).append( '<li>'+r.message+'</li>' );
						
					// Actual time
					var dateEnd = new Date();
					var curDate = new Date();
					
					// Display the image
					jQuery( "#thumb" ).show();
					
					// Change his attribute
					jQuery( "#thumb-img" ).attr("src", r.src);
					
					// Add the regenerating time to the array
					_self.timeScript.push(r.time);
					
					// Get the number of elements in array
					var num = _self.timeScript.length;
					var sum = 0;

					// Make the sum of the times
					for( var i=0; i<num ;i++ ) {
						sum += _self.timeScript[i];
					}

					// Make the average value of the regenerating time
					var ave = sum/num;
					
					// Round the value in miliseconds and add 25% or error
					var t = Math.round( ( ( ave *_self.list.length ) * 1000 ) );

					// Set the predicted time
					dateEnd.setTime( _self.dateScript.getTime() + t );
					
					// Get the difference between the two dates
					var time = _self.s2t( ( dateEnd.getTime() - curDate.getTime() ) / 1000 );

					// Set the message in the notice box
					_self.setTimeMessage( dateEnd.getHours()+":"+dateEnd.getMinutes()+":"+dateEnd.getSeconds()+sis.or+time+sis.beforeEnd );
				}
				
				// Inscrease the counter and regene the next item
				_self.curr++;
				_self.regenItem();
			}
		});

	},
	s2t : function (secs) {
		secs = secs % 86400;
		var t = new Date(1970,0,1);
		t.setSeconds(secs);
		var s = t.toTimeString().substr(0,8);
		if(secs > 86399)
		s = Math.floor((t - Date.parse("1/1/70")) / 3600000) + s.substr(2);
		return s;
	}
	,
	reInit: function() {
		// Re initilize the form
		jQuery( "#ajax_thumbnail_rebuild" ).removeAttr( "disabled" );
		jQuery( ".progress, #thumb" ).hide();
	}
}

var sizes = {
	i: 0,
	add: function(e,el) {
		e.preventDefault();
		
		// Create the template
		var elTr = jQuery( '<tr />' ).attr( 'valign', 'top' ).addClass( 'new_size_' + this.i );
		jQuery( '<th />' ).attr( 'scope', 'row' ).append( 
								jQuery( '<input />' )
									.attr( { 	
										type: 'text',
										id: 'new_size_'+this.i
									}
								 )
								 .val( 'thumbnail-name' )
							).appendTo( elTr );
		
		jQuery( '<td />' ).append( jQuery( '<input />' )
									.attr( { 	
										type: 'button',
										id: 'validate_'+this.i
									}
								 )
								 .val( sis.validate )
								 .addClass('button-secondary action add_size_name')
							).appendTo( elTr );

		// Add the form for editing
		jQuery(el).closest( 'tr' ).before( elTr );
		
		// Inscrease the identifier
		this.i++;
	},
	register: function( e, el ) {
		// Stop propagation
		e.preventDefault();
		
		// Get name and id
		var name = jQuery(el).closest('tr').children( 'th' ).find( 'input' ).val();
		var id = jQuery(el).closest('tr').children('th').find( 'input' ).attr( 'id' );
		
		// Get the number of elements with this name
		var checkPresent = jQuery( el ).closest('tbody').find( 'input[value="'+name+'"]' ).length;
		
		// Check if not basic size or already present, display message
		if( name == 'thumbnail' || name == "medium" || name == "large" ) {
			alert( sis.notOriginal );
			return false;
		} else if( checkPresent !=0 ) {
			alert( sis.alreadyPresent );
			return false;		
		}
		
		// Create td and th elements fo the row
		var thEl = jQuery( '<th />' ).attr( 'scope', 'row' ).text( sis.size + ' ' + name );
		var tdEl = jQuery( '<td />' );
		
		jQuery( '<input />' ).attr( { type: 'hidden', name: 'image_name' } ).val( name ).appendTo( tdEl ) ;
		jQuery( '<input />' ).attr( { type :'hidden', name : 'custom_image_sizes[' + name + '][custom]' } ).val( "1" ).appendTo( tdEl );
		
		jQuery( '<label />' ).attr( 'for', 'custom_image_sizes[' + name + '][w]' ).text(sis.maximumWidth).append( 
			jQuery( '<input />' ).attr( { 	type: 'number', 
											name: 'custom_image_sizes[' + name + '][w]',
											step: 1,
											min: 0,
											id: 'custom_image_sizes[' + name + '][w]'
										}
										).val( "0" ).addClass( "w" )
		).appendTo( tdEl );
		
		jQuery( '<label />' ).attr( 'for', 'custom_image_sizes[' + name + '][h]' ).text(sis.maximumHeight).append( 
			jQuery( '<input />' ).attr( { 	type: 'number', 
											name: 'custom_image_sizes[' + name + '][h]',
											step: 1,
											min: 0,
											id: 'custom_image_sizes[' + name + '][h]'
										}
										).val( "0" ).addClass( "h" )
		).appendTo( tdEl );
		
		jQuery( '<div />' )
			.addClass( 'crop' )
				.append( 
					jQuery( '<input />' )
						.attr( { 	
									type: 'checkbox', 
									name: 'custom_image_sizes[' + name + '][c]',
									id: 'custom_image_sizes[' + name + '][c]'
								} )
						.val( "1" )
						.addClass( 'c' )
				)
				.append(
					jQuery( '<label />' )
						.attr( { 	
									'for': 'checkbox', 
									id: 'custom_image_sizes[' + name + '][c]'
								} )
						.text( sis.crop ) 
				).appendTo( tdEl );
		jQuery( '<div />' )
			.addClass( 'show' )
				.append( 
					jQuery( '<input />' )
						.attr( { 	
									type: 'checkbox', 
									name: 'custom_image_sizes[' + name + '][s]',
									id: 'custom_image_sizes[' + name + '][s]'
								} )
						.val( "1" )
						.addClass( 's' )
				)
				.append(
					jQuery( '<label />' )
						.attr( { 	
									'for': 'checkbox', 
									id: 'custom_image_sizes[' + name + '][s]'
								} )
						.text( sis.show ) 
				).appendTo( tdEl );
		
		jQuery( '<div />' ).text( sis.deleteImage ).addClass('delete_size').appendTo( tdEl );
		jQuery( '<div />' ).text( sis.validateButton ).addClass('add_size validate_size').appendTo( tdEl );
		
		// Add the row to the current list
		jQuery('#' + id).closest( 'tr' ).html( thEl.after( tdEl ) );
		
		// Refresh the buttons
		this.setButtons();
	},
	deleteSize: function( e, el ) {
		e.preventDefault();
		// Check if user want to delete or not
		var confirmation = confirm( sis.confirmDelete );
		
		// Delete if ok else not delete
		if( confirmation == true ) {
			// Remove from the list and the array
			jQuery( el ).closest( 'tr' ).remove();
			this.ajaxUnregister( el );
		}
	},
	getPhp : function( e, el ) {
		e.preventDefault();
		// Get parent element
		var parent = jQuery( el ).closest( 'tr' );
		
		jQuery.ajax( {
			url: sis.ajaxUrl,
			type: "POST",
			data: { action : "get_sizes" },
			beforeSend: function() {
				// Remove classes of status
				parent.removeClass( 'addPending' );
				parent.addClass( 'addPending' );
			},
			success: function( result ) {
				// Add the classes for the status
				jQuery( '#get_php' ).nextAll( 'code' ).html( '<br />' + result).show().css( { 'display' : 'block' } );
				parent.removeClass( 'addPending' );
			}
		} );
	},
	ajaxRegister: function( e, el ) {
		e.preventDefault();
		
		// Get the vars
		var _self = this;
		var parentTable = jQuery( el ).closest( 'table' );
		var timer;
		var parent = jQuery( el ).closest( 'tr' );
		var n = parent.find( 'input[name="image_name"]' ).val();
		var c = parent.find( 'input.c' ).attr( 'checked' );
		var s = parent.find( 'input.s' ).attr( 'checked' );

		if( c == false || c == undefined ) {
			c = false;
		} else {
			c = true;
		}
		
		if( s == false || s == undefined ) {
			s = false;
		} else {
			s = true;
		}
		
		var w = parseInt( parent.find( 'input.w' ).val() );
		var h = parseInt( parent.find( 'input.h' ).val() );
		
		if( !parentTable.hasClass( 'ajaxing' ) ) {
			jQuery.ajax({
				url: sis.ajaxUrl,
				type: "POST",
				dataType :'json',
				data: { action : "add_size", width: w, height: h, crop: c, name: n, show: s },
				beforeSend: function() {
					// Remove status and set pending
					parent.removeClass( 'errorAdding notChangedAdding successAdding' );
					parent.addClass( 'addPending' );
					parentTable.addClass( 'ajaxing' );
				},
				success: function(result) {
					// Set basic class and remove pending
					var classTr = '';
					parent.removeClass( 'addPending' );
					parentTable.removeClass( 'ajaxing' )
					
					// Check the result for the different messages
					if( result == 0 ) {
						classTr = 'errorAdding';
					} else if( result == 2 ) {
						classTr = 'notChangedAdding';
						
						// add/update to the array with the status class
						_self.addToArray( n, w, h, c, classTr );
					} else {
						classTr = 'successAdding';
						
						// add/update to the array with the status class
						_self.addToArray( n, w, h, c, classTr );
					}
					
					// Add the generated class
					parent.addClass( classTr );
					
					// Change the button text
					parent.find( '.add_size .ui-button-text' ).text( sis.update ) ;
					
					clearTimeout( timer );
					// Remove classes after 3 seconds
					timer = setTimeout(function() {
						parent.removeClass( 'errorAdding notChangedAdding successAdding' );
					}, 3 * 1000  );
				}
			});
		}	
	},
	ajaxUnregister: function( el ) {
		// Get name and _self object
		var _self = this;
		var n =  jQuery( el ).closest('tr').find( 'input[name="image_name"]' ).val();
		
		// Make the ajax call
		jQuery.ajax({
			url: sis.ajaxUrl,
			type: "POST",
			data: { action : "remove_size", name: n },
			success: function(result) {
				_self.removeFromArray( el );
			}
		});	
	},
	addToArray: function( n, w, h, c, s ) {
		// Get the row for editing or updating
		var testRow = jQuery( '#sis-regen .wrapper > table > tbody input[value="'+n+'"]' );
		var newRow = '';
		var timer;
		
		// Get the right newRow, updating or adding ?
		if( testRow.length != 0 )
			newRow = testRow.closest( 'tr' );
		else
			newRow = jQuery( '#sis-regen .wrapper > table > tbody > tr:first' ).clone();
		
		if( c == true )
			c = sis.tr;
		else
			c = sis.fl;
		
		// Set the datas with the given datas
		newRow.find( 'td > label' ).attr( 'for', n )
		.end()
		.find( 'input.thumbnails' ).val( n ).attr( 'id', n ).end()
		.find( 'td:nth-child(2) > label' ).text( n )
		.end()
		.find( 'td:nth-child(3) > label' ).text( w+'px' )
		.end()
		.find( 'td:nth-child(4) > label' ).text( h+'px' )
		.end()
		.find( 'td:nth-child(5) > label' ).text( c );
		
		// If new then add the row
		if( testRow.length == 0 )
			newRow.appendTo( '#sis-regen .wrapper > table > tbody' );
		
		// Remove the previous status classes and add the status class
		newRow.removeClass( 'errorAdding notChangedAdding successAdding' ).addClass( s );
		
		clearTimeout( timer );
		// Remove the statuses classes
		timer = setTimeout(function() {
			newRow.removeClass( 'errorAdding notChangedAdding successAdding' );
		}, 3 * 1000 );
	},
	removeFromArray: function( el ) {
		// get the name
		var n = jQuery( el ).closest( 'tr' ).find( 'input[name=image_name]' ).val();
		
		// Remove the given name from the array
		jQuery( '#sis-regen .wrapper > table > tbody input[value="'+n+'"]' ).closest( 'tr' ).remove();
	},
	setButtons: function() {
		// UI for delete,crop and add buttons
		jQuery(".delete_size").button( {
			icons: {
				primary: 'ui-icon-circle-close'
			}
		} );
		jQuery(".add_size").button( {
			icons: {
				primary: 'ui-icon-circle-check'
			}
		} );
		jQuery(".crop,.show").button();
	}
}
jQuery(function() {
	
	// Regeneration listener
	jQuery( '#ajax_thumbnail_rebuild' ).click( function() { regenerate.startRegenerating(); } );
	
	// Add size button listener
	jQuery('#add_size').click(function( e ){ sizes.add( e, this ); });
	
	// Registering a new size listener
	jQuery('.add_size_name').live( 'click',function( e ) { sizes.register( e, this ); } );
	
	// Delete and Adding buttons
	jQuery('.delete_size').live( 'click', function( e ) { sizes.deleteSize( e, this ); } );
	jQuery('.validate_size').live( 'click', function( e ) { sizes.ajaxRegister( e, this ); } );
	
	// Seup the getphp
	jQuery('#get_php').click( function( e ){ sizes.getPhp( e, this ) } );
	jQuery('#get_php').nextAll('code').hide();
	
	// Colors for the theme / custom sizes
	jQuery('span.custom_size').closest('tr').children('th').css( {
		'color': '#89D76A'
	} );
	jQuery('span.theme_size').closest('tr').children('th').css( {
		'color': '#F2A13A'
	} );	

	// Set the buttons
	sizes.setButtons();

	// Error ajax handler
	jQuery( '<div class="ui-widget" id="msg"><div class="ui-state-error ui-corner-all" style="padding: 0 .7em;"><p><span class="ui-icon ui-icon-alert" style="float: left; margin-right: .3em;"></span><strong>Alert:</strong> <ul class="msg" ></ul></p></div></div>').prependTo( "div#wpwrap" ).slideUp( 0 );
	
	// Display the errors of ajax queries
	jQuery("#msg").ajaxError( function(event, request, settings ) {
		jQuery( this ).find( '.msg' ).append( "<li>"+sis.ajaxErrorHandler+" " + settings.url + ", status "+request.status+" : "+request.statusText+"</li>" ).end().stop( false, false ).slideDown( 200 ).delay( 5000 ).slideUp( 200 );
	});
});