describe('acceptance test', function(){


 it('should search a project' , function(){
 	console.log('\nStarting test suite "SPRINT 2"');
 	browser.get('http://localhost:3000');
 	browser.waitForAngular();

 	var searchbox = element(by.model('repoSearchBox'));
 	var searchboxtext = element(by.name('repoSearchBox'));

 	searchbox.clear();
 	expect(searchbox.getAttribute('value')).toEqual('');

 	searchbox.sendKeys('CMPUT404-project');
 	browser.sleep(1000);
 	expect(searchbox.getAttribute('value')).toEqual('CMPUT404-project');
 	searchbox.sendKeys(protractor.Key.ENTER);

 	var repos = element.all(by.repeater('repo in repos')).count();

 	expect(repos).toBeGreaterThan(0);

 	 browser.executeScript('window.sessionStorage.clear();');
    	browser.executeScript('window.localStorage.clear();');

 });

 it('should log an admin in and out', function(){
 		var loginButton = element(by.id('adminLoginButton')).click();
 		browser.waitForAngular();

 		expect(browser.getCurrentUrl()).toEqual('http://localhost:3000/auth/login');

 		var loginText = element(by.model('login.user.email'));
 		var passText = element(by.model('login.user.password'));
 		var subButton = element(by.id('submitLogin'));

 		loginText.sendKeys('test1234@gmail.com');
 		passText.sendKeys('test1234');
 		subButton.click();

 		expect(browser.getCurrentUrl()).toEqual('http://localhost:3000/');

 		var dropdownButton = element(by.id('usernameDrop')).click();
 		var logoutButton = element(by.id('logOutButton')).click();
 browser.executeScript('window.sessionStorage.clear();');
    browser.executeScript('window.localStorage.clear();');


 });

 it('should select a project that is not in database', function(){
 	browser.get('http://localhost:3000');
 	browser.waitForAngular();

 	var searchbox = element(by.model('repoSearchBox'));
 	var searchboxtext = element(by.name('repoSearchBox'));

 	searchbox.clear();
 	expect(searchbox.getAttribute('value')).toEqual('');

 	searchbox.sendKeys('CMPUT404-project');
 	browser.sleep(1000);
 	expect(searchbox.getAttribute('value')).toEqual('CMPUT404-project');
 	searchbox.sendKeys(protractor.Key.ENTER);
 	browser.sleep(1000);

 	var repos = element.all(by.repeater('repo in repos')).get(0);

 	repos.click();

  browser.executeScript('window.sessionStorage.clear();');
    browser.executeScript('window.localStorage.clear();');

 });



 it('should be able to upload files and download coOccurrences.tsv and tags.tsv', function(){

 		console.log('\nStarting test suite "SPRINT 3"');
 		browser.get('http://localhost:3000');
 		browser.waitForAngular();

 		var loginButton = element(by.id('adminLoginButton')).click();
 		browser.waitForAngular();

 		expect(browser.getCurrentUrl()).toEqual('http://localhost:3000/auth/login');

 		var loginText = element(by.model('login.user.email'));
 		var passText = element(by.model('login.user.password'));
 		var subButton = element(by.id('submitLogin'));

 		loginText.sendKeys('test1234@gmail.com');
 		passText.sendKeys('test1234');
 		subButton.click();

 		expect(browser.getCurrentUrl()).toEqual('http://localhost:3000/');

 		var uploadButton = element(by.id('mainnavbar')).all(By.tagName('a')).get(1).click();

 		var coOccurrences = element(by.id('coOccruenceDownload')).click();
 		browser.sleep(1000);
 		var sOtags = element(by.id('tagDownload')).click();
 		browser.sleep(1000);

 		var dropdownButton = element(by.id('usernameDrop')).click();
 		var logoutButton = element(by.id('logOutButton')).click();

  		browser.executeScript('window.sessionStorage.clear();');
    		browser.executeScript('window.localStorage.clear();');


 });

 it('should select a task/bug from project', function(){
 	browser.get('http://localhost:3000');
 	browser.waitForAngular();

 	var searchbox = element(by.model('repoSearchBox'));
 	var searchboxtext = element(by.name('repoSearchBox'));

 	searchbox.clear();
 	expect(searchbox.getAttribute('value')).toEqual('');

 	searchbox.sendKeys('angular');
 	browser.sleep(1000);
 	expect(searchbox.getAttribute('value')).toEqual('angular');
 	searchbox.sendKeys(protractor.Key.ENTER);
 	browser.sleep(3000);

 	var repos = element.all(by.repeater('repo in repos')).get(0);

 	repos.click();

 	var issue = element.all(by.repeater('issue in issues')).get(0);

 	issue.click();

 browser.executeScript('window.sessionStorage.clear();');
    browser.executeScript('window.localStorage.clear();');

 });


 it('should be able to click and drag the graph', function(){
 	browser.get('http://localhost:3000');
 	browser.waitForAngular();

 	var searchbox = element(by.model('repoSearchBox'));
 	var searchboxtext = element(by.name('repoSearchBox'));

 	searchbox.clear();
 	expect(searchbox.getAttribute('value')).toEqual('');

 	searchbox.sendKeys('blizzard');
 	browser.sleep(1000);
 	expect(searchbox.getAttribute('value')).toEqual('blizzard');
 	searchbox.sendKeys(protractor.Key.ENTER);
 	browser.sleep(3000);

 	var repos = element.all(by.repeater('repo in repos')).get(0);

 	repos.click();

 	var issue = element.all(by.repeater('issue in issues')).get(0);

 	issue.click();

 	browser.sleep(10000);

 	var nodes = element(by.id('outerGrouping')).all(By.tagName('circle')).get(4).click();

 	 browser.executeScript('window.sessionStorage.clear();');
    browser.executeScript('window.localStorage.clear();');

 });

 it('should be able to share a deeplink', function(){
 	console.log('\nStarting test suite "SPRINT 4"');
 	browser.get('http://localhost:3000');
 	browser.waitForAngular();

 	var searchbox = element(by.model('repoSearchBox'));
 	var searchboxtext = element(by.name('repoSearchBox'));

 	searchbox.clear();
 	expect(searchbox.getAttribute('value')).toEqual('');

 	searchbox.sendKeys('blizzard');
 	browser.sleep(1000);
 	expect(searchbox.getAttribute('value')).toEqual('blizzard');
 	searchbox.sendKeys(protractor.Key.ENTER);
 	browser.sleep(3000);

 	var repos = element.all(by.repeater('repo in repos')).get(0);

 	repos.click();

 	var issue = element.all(by.repeater('issue in issues')).get(0);

 	issue.click();

 	expect(browser.getCurrentUrl()).toEqual('http://localhost:3000/?directed&soWeight=log&userWeight=log&bugWeight=log&showDirectChildren=false&repoName=bachan%2Fblizzard&issueId=23550938');

 	 browser.executeScript('window.sessionStorage.clear();');
    browser.executeScript('window.localStorage.clear();');
 });

 it('should select a project member', function(){
 	browser.get('http://localhost:3000');
 	browser.waitForAngular();

 	var searchbox = element(by.model('repoSearchBox'));
 	var searchboxtext = element(by.name('repoSearchBox'));

 	searchbox.clear();
 	expect(searchbox.getAttribute('value')).toEqual('');

 	searchbox.sendKeys('blizzard');
 	browser.sleep(1000);
 	expect(searchbox.getAttribute('value')).toEqual('blizzard');
 	searchbox.sendKeys(protractor.Key.ENTER);
 	browser.sleep(3000);

 	var repos = element.all(by.repeater('repo in repos')).get(0);

 	repos.click();

 	var users = element.all(by.repeater('user in users')).get(0);

 	users.click();

 browser.executeScript('window.sessionStorage.clear();');
    browser.executeScript('window.localStorage.clear();');


 });

 it('should be able to change my directed graph options', function(){
 	browser.get('http://localhost:3000');
 	browser.waitForAngular();

 	var config = element(by.id('configImage'));

 	config.click();

 	var directionOptions = element(by.id('directionOptions')).all(By.tagName('p')).get(1).click();

 	browser.sleep(3000);

 	var closeNotes = element(by.id('closeNotes')).click();

 	var searchbox = element(by.model('repoSearchBox'));
 	var searchboxtext = element(by.name('repoSearchBox'));

 	searchbox.clear();
 	expect(searchbox.getAttribute('value')).toEqual('');

 	searchbox.sendKeys('blizzard');
 	browser.sleep(1000);
 	expect(searchbox.getAttribute('value')).toEqual('blizzard');
 	searchbox.sendKeys(protractor.Key.ENTER);
 	browser.sleep(3000);

 	var repos = element.all(by.repeater('repo in repos')).get(0);

 	repos.click();

 	var issue = element.all(by.repeater('issue in issues')).get(0);

 	issue.click();

 	browser.sleep(10000);

  	browser.executeScript('window.sessionStorage.clear();');
    	browser.executeScript('window.localStorage.clear();');


 });

 it('should have a loading screen for graph', function(){
 	console.log('\nStarting test suite "SPRINT 5"');
 	browser.get('http://localhost:3000');
 	browser.waitForAngular();

 	var searchbox = element(by.model('repoSearchBox'));
 	var searchboxtext = element(by.name('repoSearchBox'));

 	searchbox.clear();
 	expect(searchbox.getAttribute('value')).toEqual('');

 	searchbox.sendKeys('blizzard');
 	browser.sleep(1000);
 	expect(searchbox.getAttribute('value')).toEqual('blizzard');
 	searchbox.sendKeys(protractor.Key.ENTER);
 	browser.sleep(3000);

 	var repos = element.all(by.repeater('repo in repos')).get(0);

 	repos.click();

 	var issue = element.all(by.repeater('issue in issues')).get(0);

 	issue.click();

 	var loading = element(by.id('loadingImage'));
 	expect(loading.isPresent());
 });

 it('should log the admin out through the admin screen logout', function(){
 		browser.get('http://localhost:3000');
 		browser.waitForAngular();

 		var loginButton = element(by.id('adminLoginButton')).click();
 		browser.waitForAngular();

 		expect(browser.getCurrentUrl()).toEqual('http://localhost:3000/auth/login');

 		var loginText = element(by.model('login.user.email'));
 		var passText = element(by.model('login.user.password'));
 		var subButton = element(by.id('submitLogin'));

 		loginText.sendKeys('test1234@gmail.com');
 		passText.sendKeys('test1234');
 		subButton.click();

 		expect(browser.getCurrentUrl()).toEqual('http://localhost:3000/');

 		var logoutButton = element(by.id('adminLogOutPage'));

 		logoutButton.click();
 });

	it('should display the jacard sim', function(){
		browser.get('http://localhost:3000/?directed&soWeight=log&userWeight=log&bugWeight=log&showDirectChildren=false&repoName=mbostock%2Fd3&userName=mbostock&issueId=145030871&similarityType=jacard');
		browser.sleep(3000);

		// var valueOfSim = element(by.id('similarityValue'))getText();
		// console.log()
		expect(element(by.id('similarityValue')).getText()).toEqual('1.6051856476256467');
	})
	it('should display the jacard sim', function(){
		browser.get('http://localhost:3000/?directed&soWeight=log&userWeight=log&bugWeight=log&showDirectChildren=false&repoName=mbostock%2Fd3&userName=mbostock&issueId=145030871&similarityType=cosine');
		browser.sleep(3000);

		// var valueOfSim = element(by.id('similarityValue'))getText();
		// console.log()
		expect(element(by.id('similarityValue')).getText()).toEqual('0.04364340496245361');
	})


});
