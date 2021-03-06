var URL = 'http://localhost:9999/test/acceptance/simulate-noscript.html';

// Given a customer visits the tool
// when they have javascript disabled
// then they will see a helpful message
casper.test.begin( 'test noscript experience (js disabled)', 2, function suite( test ) {
	casper.options.pageSettings.javascriptEnabled = false;
	casper.start( URL )
	.then(function() {
		// Note: the casperjs test API relies on PhantomJS javascript being enabled
		// these methods are reliable when testing title and page content with js disabled
		test.assertEquals( casper.page.title, 'Simulate noscript', 'loaded test page' );
		test.assertMatch( casper.page.plainText, /We can still help with resolving your neighbourhood dispute/, 'noscript message is shown with js disabled' );
	})

	.run(function() {
		test.done();
		// reset js
		casper.options.pageSettings.javascriptEnabled = true;
	});
});
