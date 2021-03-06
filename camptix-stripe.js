
var CampTixStripe = new function() {
	var self = this;

	self.data = CampTixStripeData;
	self.form = false;

	self.init = function() {
		self.form = jQuery( '#tix form' );
		if (self.form.find( '#tix-pm-stripe' ).length) {
		    // Hook up on click on the stripe button if buttons are active
		    self.form.find( '#tix-pm-stripe' ).on( 'click', CampTixStripe.form_handler );
		} else {
		    // Hook up on submit of form otherwise
    		self.form.on( 'submit', CampTixStripe.form_handler );
		}

		// On a failed attendee data request, we'll have the previous stripe token
		if ( self.data.token ) {
			self.add_stripe_token_hidden_fields( self.data.token, self.data.receipt_email || '' );
		}
	}

	self.form_handler = function(e) {
		// Verify Stripe is the selected method.
		if (self.form.find( '#tix-pm-stripe' ).length === 0) {
    		var method = self.form.find('[name="tix_payment_method"]').val() || 'stripe';

    		if ( 'stripe' != method ) {
    			return;
    		}
		}

		// If the form already has a Stripe token, bail.
		var tokenised = self.form.find('input[name="tix_stripe_token"]');
		if ( tokenised.length ) {
			return;
		}

		// Check if the form is valid before allowing submission! -- NOTE: Requires updated camptix that adds proper required flags
        if (self.form[0].checkValidity()) {
            self.stripe_checkout();
		    e.preventDefault();
        }
	}

	self.stripe_checkout = function() {
        var emailopt = '';
        if (!(self.data.ask_email)) {
		    var emails = jQuery.unique(
		    	self.form.find('input[type="email"]')
		    	.filter( function () { return this.value.length; })
		    	.map( function() { return this.value; } )
		    );
            emailopt = ( emails.length == 1 ? emails[0] : '' ) || '';
        }

        var StripeHandler = StripeCheckout.configure({
			key: self.data.public_key,
			image: self.data.logo_url ? self.data.logo_url : 'https://stripe.com/img/documentation/checkout/marketplace.png',
			locale: 'auto',
			amount: parseInt( this.data.amount ),
			currency: self.data.currency,
			description: self.data.description,
			name: self.data.name,
			zipCode: true,
            billingAddress: self.data.ask_billing ? true : false,
            email: emailopt,
			token: self.stripe_token_callback
		});

		// Close the popup if they hit back.
		window.addEventListener('popstate', function() {
  			StripeHandler.close();
		});

		StripeHandler.open();
	};

	self.stripe_token_callback = function( token ) {
		self.add_stripe_token_hidden_fields( token.id, token.receipt_email || token.email );
		self.form.submit();
	}

	self.add_stripe_token_hidden_fields = function( token_id, email ) {
		jQuery('<input>').attr({
    			type: 'hidden',
    			id: 'tix_stripe_token',
    			name: 'tix_stripe_token',
    			value: token_id,
		}).appendTo( self.form );
	
        // Should only do this if the select doesn't exist:	
        jQuery('<input>').attr({
    			type: 'hidden',
    			id: 'tix_payment_method',
    			name: 'tix_payment_method',
    			value: 'stripe',
		}).appendTo( self.form );

		if ( email ) {
			jQuery('<input>').attr({
    				type: 'hidden',
    				id: 'tix_stripe_reciept_email',
    				name: 'tix_stripe_reciept_email',
    				value: email,
			}).appendTo( self.form );
		}

	}
};

jQuery(document).ready( function($) {
	CampTixStripe.init()
});
