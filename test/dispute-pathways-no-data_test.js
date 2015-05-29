var URL = 'http://localhost:9999/test/acceptance/simulate-data-error.html';

// Given a customer visits the tool,
// when the data cannot be loaded
// then they will see a helpful message
casper.test.begin( 'data error', 2, function suite( test ) {
	casper.start( URL )
	.then(function() {
		var options;

		test.assertTitle( 'Simulate no data', 'loaded neighbourhood dispute page' );
		test.assertSelectorHasText( '#dispute-pathways-view', 'A server error has prevented the requested resource from being displayed', 'error message is shown' );
	});

	casper.run(function() {
		test.done();
	});
});
