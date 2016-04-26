// pure node js file
// can be run via 'node formulas.js' from the software-expertise folder
// small test are commented out below each function

//var tsv = require("node-tsv-json");
var fs = require("fs");

// Bug or Developer object has an array with tags. 
// eg. B = ["java", "javascript"];

//var occTags = require('./oOccSmall.json');
var occTags = require('./output.json');
var tags = require('./output1.json');

////////////////////////////////////////////////////////////////////////////////////////////////////

// helper function to make an array of strings get rid of duplicates
// commonly used on an array that represents a developer or bug to get the unique tags for that bug or dev
function uniq(a)
{
   return Array.from(new Set(a));
}

////////////////////////////////////////////////////////////////////////////////////////////////////

// Occurrence of a tag in Stack Overflow Questions
// returns an integer 'n' which is a count of the number of times the tag 'tag' is in the text of all the stack overflow questions
function occurrenceSO(tag)
{
	// search for tag in output1.json to see the Count of 'tag'
	for(var i = 0; i < tags.length; i++)
	{
		if(tags[i].TagName === tag)
		{
			return tags[i].Count;
		}
	}
	// couldn't find the tag
    return 0; // optionally could use -1 to specify tag not found
}
// test
// var num = 0;
// var taggy = 'json';
// num = occurrenceSO(taggy);
// console.log(num);

////////////////////////////////////////////////////////////////////////////////////////////////////

// Occurrence of a tag in text
// returns an integer 'n' which is a count of the number of times tag 'tag' is in the text 'txt' (for any given block of text)
// eg. Bi is occurrence(i, B) where B is the text for bug B. (the body?)
function occurrence(tag, txt)
{
//     var n = 0;

//     // number of times tag 'tag' is in text 'txt'
//     while(there is text, take it a word at a time)
//     {
//         if (word == 'tag')
//         {
//             n++;
//         }
//     }
//     return n;

// doesn't differentiate between java and javascript when searching with 'java'
  return txt.split(tag).length - 1;
}
// test for keyword in arbitrary string
// var filename = './pText.txt';
// fs.readFile(filename, 'utf8', function(err, data)
// {
// 	if (err) throw err;
// 	var tText = data.toLowerCase(); // our SO keywords are lowercase
// 	console.log(occurrence("json", tText));
// });

////////////////////////////////////////////////////////////////////////////////////////////////////

// Occurrence of a tag in a Vector of tags
// returns an integer 'n' which is a count of the number of times tag 'tag' is in the vector 'v' (for any given block of text)
// eg. Bi is occurrence(i, B) where B is the text for bug B. (the body?)
function occurrenceV(tag, v)
{
	var n = 0;

	for(var i = 0; i < v.length; i++)
	{
		if(v[i] === tag)
		{
			n++;
		}
	}

	return n;
}
// test for keyword in vector
// var testVector = ['java', 'javascript', 'html', '.a', 'python', 'java'];
// console.log(occurrenceV('java', testVector));

////////////////////////////////////////////////////////////////////////////////////////////////////

// Weight of a node based on StackOverflow Tag Weight
// returns a number 'n' which is 1 / sqrt(occurence(i, SO))
// which means it's in the range of (0,1]
// Relies on occurrenceSO fuction
// OPTION 3.a.1
function weightSO(tag)
{
     var n = 0;

     // use our tag.tsv value to compute
     if ( (Math.sqrt(occurrenceSO(tag))) !== 0)
     {
     	n = 1/(Math.sqrt(occurrenceSO(tag)));
     }

     return n;
}
// test
//var myDecimalNumber = weightSO("html");
//console.log(myDecimalNumber);

////////////////////////////////////////////////////////////////////////////////////////////////////

// Weight of a node based on abitrary text & StackOverflow Tag Weight
// returns a number 'n' which is a modified version of weightSO
// Relies on weightSO function
// OPTION 3.b.1
function weight(tag, txt) // eg. weight(tag, B) // the weight of a tag for B
{
    var n = 0;

    if ( occurrence(tag, txt) != 0 ) // don't divide by 0
    {
        n = 1 - ( (1 - weightSO(tag)) / (occurrence(tag, txt)) );
    }

    return n;
}
// test
// myDecimalNumber = weight("java", "java is love, java is life, java is what I make for my wife! When times are tough and full of strife, I've had too much java, java 4 lyfe!")
// console.log(myDecimalNumber);

////////////////////////////////////////////////////////////////////////////////////////////////////

// Weight of a node based on abitrary vector of strings & StackOverflow Tag Weight
// returns a number 'n' which is a modified version of weightSO
// Relies on weightSO function & occurrence function
// OPTION 3.b.1
function weightV(tag, v) // eg. weight(tag, B) // the weight of a tag for B
{
    var n = 0;

    if ( occurrenceV(tag, v) != 0 ) // don't divide by 0
    {
        n = 1 - ( (1 - weightSO(tag)) / (occurrenceV(tag, v)) );
    }

    return n;
}
// test
// myDecimalNumber = weight("java", "java is love, java is life, java is what I make for my wife! When times are tough and full of strife, I've had too much java, java 4 lyfe!")
// console.log(myDecimalNumber);

////////////////////////////////////////////////////////////////////////////////////////////////////
// B is a vector of tags that make up the bug we have selected
// D is a vector of tags that make up the developers history of work
// returns q: a number that is a Cosine similarity between B and D
// Relies on occurrence function
// Option 3.a
function cosineSimilarity(B, D)
{
    var nSum = 0;
    var o = 0;
    var q = 0;
    var diSum = 0;
    var biSum = 0;
    var sqBiSum = 0;
    var sqDiSum = 0;
    var BDtags;

	// can make the numerator portion easier to compute by only using tags that are in both B and D
    BDtags = B.filter(function(c) {
	  return D.indexOf(c) > -1;
	});
    //console.log(BDtags);

    for(var i = 0; i < BDtags.length; i++)
    {
        // Sum of Di * Bi
        //nSum += occurrence(tags[i], D.text) * occurrence(tags[i], B.text);
        nSum += occurrenceV(BDtags[i], D) * occurrenceV(BDtags[i], B);
    }

    var uniqueD = uniq(D);
    var uniqueB = uniq(B);
    //console.log(uniqueD);

    for(var i = 0; i < uniqueD.length; i++)
    {
        diSum += occurrenceV(uniqueD[i], D);
        sqDiSum += diSum * diSum;
    }

    for(var i = 0; i < uniqueB.length; i++)
    {
        biSum += occurrenceV(uniqueB[i], B);
        sqBiSum += biSum * biSum;
    }

    //n = diSum * biSum; // numerator
    o = Math.sqrt(sqDiSum) * Math.sqrt(sqBiSum); // denomenator
    
    if (o !== 0) // double check no divide by zero
    {
    	q = nSum/o;
    }

    return q;
}
// Test
// var Bug = ['java', 'javascript', 'html', '.a', 'java'];
// var Dev = ['java', 'java', 'python', 'html', 'css', '.net', 'c#', 'php'];
// console.log(cosineSimilarity(Bug, Dev));

////////////////////////////////////////////////////////////////////////////////////////////////////

// B is a vector of tags that make up the bug we have selected
// D is a vector of tags that make up the developers history of work
// returns q: a number that is a Cosine similarity between B and D
// Relies on WeightSO
// Returns a number for similarity
// Option 3.a.1
function cosineSimilarityWeighted(B, D)
{
    var n = 0;
    var o = 0;
    var q = 0;
    var diSum = 0;
    var biSum = 0;
    var sqBiSum = 0;
    var sqDiSum = 0;

    uniqueD = uniq(D);
    uniqueB = uniq(B);

    for(var i = 1; i < uniqueD.length; i++)
    {
        diSum += weightSO(uniqueD[i]);
        sqDiSum += diSum * diSum;
    }

    for(var i = 1; i < uniqueB.length; i++)
    {
        biSum += weightSO(uniqueB[i]);
        sqBiSum += biSum * biSum;
    }

    n = diSum * biSum; // numerator
    o = Math.sqrt(sqDiSum) * Math.sqrt(sqBiSum); // denomenator

    if (o !== 0) // check for zero in denominator
    {
    	q = n/o;
    }
    
    return q;
}
// Test
//var Bug = ['java', 'javascript', 'html', '.a', 'java'];
//var Dev = ['java', 'java', 'python', 'html', 'css', '.net', 'c#', 'php'];
//console.log(cosineSimilarityWeighted(Bug, Dev));

////////////////////////////////////////////////////////////////////////////////////////////////////

// Returns a number for similarity when given B which is a vector of terms for bug
// and D which is a vector of terms for a developer
// Relies on weight function
// Option 3.b
function jaccardSimilarity(B, D)
{
	var n = 0;
	var o = 0;
    // For all the tags in tags.tsv
    for(var i = 0; i < tags.length; i++)
    {
        // search the text of B and D to find the weight for a stack overflow tag 'i'
        n += Math.min( weightV(tags[i].TagName, B), weightV(tags[i].TagName, D) );
        o += weightV(tags[i].TagName, B);
    }

    if (o !== 0)
    {
    	return n/o;
    }

    return 0;
}
// Test
//var Bug = ['java', 'javascript', 'html', '.a', 'java'];
//var Dev = ['java', 'java', 'python', 'html', 'css', '.net', 'c#', 'php'];
//console.log(jaccardSimilarity(Bug, Dev));

////////////////////////////////////////////////////////////////////////////////////////////////////

// Relies on weight function
// Returns a number for similarity
// Option 3.b.1
function jaccardSimilarityWeighted(B, D, txt)
{
	var n = 0;
	var o = 0;
	uniqueD = uniq(D);
    uniqueB = uniq(B);
    // For all the tags in tags.tsv
    for(var i = 0; i < tags.length; i++)
    {
        // search the arbitrary text 'txt' to find a weight for the tags that relate to B and D
        n += Math.min( weight(uniqueB[i], txt), weight(uniqueD[i], txt));
        o += weightV(tags[i].TagName, B);
    }
    return n/o;
}
// Test
// var Bug = ['java', 'javascript', 'html', '.a', 'java'];
// var Dev = ['java', 'java', 'python', 'html', 'css', '.net', 'c#', 'php'];
// var javaString = "java is love, java is life, java is what I make for my wife! When times are tough and full of strife, I've had too much java, java 4 lyfe!";
// console.log(jaccardSimilarityWeighted(Bug, Dev, javaString));

////////////////////////////////////////////////////////////////////////////////////////////////////
//console.log(occTags);

// CoOccurrence of a tag in Stack Overflow Questions
// returns an integer 'n' which is a count of the number of times tag1 and tag2 have been seen together in the text of all the stack overflow questions
function coOccurrence(tag1, tag2)
{
	for(var i = 0; i < occTags.length; i++)
	{
		if( (occTags[i].Tag1 === tag1 && occTags[i].Tag2 === tag2) || (occTags[i].Tag1 === tag2 && occTags[i].Tag2 === tag1) )
		{
			return occTags[i].CoOccurrence;
		}
	}
}
// Test
// console.log(coOccurrence(".a",".lib"));

////////////////////////////////////////////////////////////////////////////////////////////////////

// Given an edge 'tag1' & 'tag2' and an vector 'v', return what the weight of that edge is as a number
// only if both tags 'tag1' & 'tag2' are in vector v; otherwise return 0.
// eg. var v = ["java", "javascript", "html", ".a", ".lib"]
// 'graphType' is 1 for directed and 0 for undirected
// relies on coOccurence function and occurrenceSO function
function edgeWeight(tag1, tag2, v, txt, graphType)
{
	var yesTag1 = false;
	var yesTag2 = false;

	// does 'v' have both tags in it?
	for(var i = 0; i < v.length; i++)
	{
		if(v[i] === tag1 )
		{
			yesTag1 = true;
		}

		if(v[i] === tag2 )
		{
			yesTag2 = true;
		}

	}
	if ( yesTag1 && yesTag2 )
	{
		if (graphType === 0)
		{
			if ( ( occurrence(tag1, txt) + occurrence(tag2, txt)) !== 0) // check div by zero
			{
				return ( (2 * coOccurrence(tag1, tag2)) / ( occurrence(tag1, txt) + occurrence(tag2, txt) ) );
			}
			else
			{
				return 0;
			}
		}

		if ( occurrence(tag1, txt) !== 0) // check div by zero
		{
			return coOccurrence(tag1, tag2) / occurrence(tag1, txt);
		}
		else
		{
			return 0;
		}
	}

    return 0; // no edge between tag1 & tag2
}
// Test
// var testEdgeWeightVector = [".a", ".lib", "java", "html", "json"];
// console.log(edgeWeightV(".a", ".lib", testEdgeWeightVector, 0));

////////////////////////////////////////////////////////////////////////////////////////////////////

// Given an edge 'tag1' & 'tag2' and an vector 'v', return what the weight of that edge is as a number
// only if both tags 'tag1' & 'tag2' are in vector v; otherwise return 0.
// eg. var v = ["java", "javascript", "html", ".a", ".lib"]
// 'graphType' is 1 for directed and 0 for undirected
// relies on coOccurence function and occurrenceSO function
function edgeWeightV(tag1, tag2, v, graphType)
{
	var yesTag1 = false;
	var yesTag2 = false;

	// does 'v' have both tags in it?
	for(var i = 0; i < v.length; i++)
	{
		if(v[i] === tag1 )
		{
			yesTag1 = true;
		}

		if(v[i] === tag2 )
		{
			yesTag2 = true;
		}

	}
	if ( yesTag1 && yesTag2 )
	{
		if (graphType === 0)
		{
			if ( (occurrenceSO(tag1) + occurrenceSO(tag2)) !== 0) // no div by zero
			{
				return ( (2 * coOccurrence(tag1, tag2)) / (occurrenceSO(tag1) + occurrenceSO(tag2)) );
			}
			
			return 0;
		}

		if (occurrenceSO(tag1) !== 0) // no div by zero
		{
			return coOccurrence(tag1, tag2) / occurrenceSO(tag1);
		}
		return 0;
	}
    
    return 0; // no edge between tag1 & tag2
}
// Test
// var testEdgeWeightVector = [".a", ".lib", "java", "html", "json"];
// console.log(edgeWeightV(".a", ".lib", testEdgeWeightVector, 0));

////////////////////////////////////////////////////////////////////////////////////////////////////

// will fill and return an array with two arrays each having edge pairs for 'a'
// see test below for how to use the arrays returned.
// it will make duplicate pairs, but we need them because only one of those pairs
// is in the SO coOccurrences tags and we want to find it!
function buildEdges(a)
{
	var d = [];
	var z = [];
	for (var i = 0; i < a.length; i++)
	{
		for (var k = 0; k < a.length; k++)
		{
			if (a[i] !== a[k])
			{
				z.push(a[i] + "&" + a[k]);
			}
		}
	}
	d.push(z);
	return d;
}
// test
//var aBuildEdgesTest = ["java", "html", ".lib", ".a"];
//var e = buildEdges(aBuildEdgesTest);
//console.log( e[2]);
//console.log( e[0][0] );
//console.log( e[0][1] );

// console.log( e[0][1] );
// console.log( e[1][1] );

// console.log( e[0][2] );
// console.log( e[1][2] );

////////////////////////////////////////////////////////////////////////////////////////////////////

// Relies on weight function
// Returns a number for similarity
// Option 3.b.2
// 'graphType' is 1 for directed and 0 for undirected
function jaccardSimilarityWithEdgeSimilarity(B, D, graphType)
{
	var n = 0;
	var o = 0;
	var p = 0;
	var q = 0;

	var uniqueD = uniq(D);
    var uniqueB = uniq(B);

    // build edges for B
    var bEdges = buildEdges(B);
    // build edges for D
    var dEdges = buildEdges(D);

	var BDEdges;
	// filter out edges that are duplicate
     BDEdges = bEdges[0].filter(function(c) {
	  return dEdges[0].indexOf(c) > -1;
	});
	//console.log(BDEdges);

	var uniqBDEdges = uniq(BDEdges);
	//console.log(uniqBDEdges);

	var e1 = []; // our bd unique edges
	for(var i = 0; i < uniqBDEdges.length; i++)
	{
		e1.push(uniqBDEdges[i].split("&"));
	}
	// console.log(e1);
	// console.log(e1.length);
	// console.log(e1[0]);
	// console.log(e1[0][0]);
	// console.log(e1[0][1]);

    // For all the tags in tags.tsv
    for(var i = 0; i < tags.length; i++)
    {
        // search the text of B and D to find the weight for a stack overflow tag 'i'
        n += Math.min( weightV(tags[i].TagName, B), weightV(tags[i].TagName, D) );
        o += weightV(tags[i].TagName, B);
    }

    // For all the similar edges in B and D
    for(var i = 0; i < e1.length; i++)
    {
        p += Math.min( edgeWeightV(e1[i][0], e1[i][1], B, graphType), edgeWeightV(e1[i][0], e1[i][1], D, graphType) );
        q += edgeWeightV(e1[i][0], e1[i][1], B, graphType);
	}

    if (o !== 0 && q !== 0) // don't divide by zero
    {
    	return ( ( (n/o) + (p/q) ) / (2) );
    }

    return 0;
}
// Test
// var Bug = ['java', 'javascript', 'html', '.a', 'java'];
// var Dev = ['java', 'java', 'python', 'html', 'css', '.net', 'c#', 'php'];
// console.log(jaccardSimilarityWithEdgeSimilarity(Bug, Dev));

////////////////////////////////////////////////////////////////////////////////////////////////////

// Relies on weight & edgeWeight functions
// Returns a number for similarity which may be bugged right now as it's a very large number
// Option 3.b.2
// 'graphType' is 1 for directed and 0 for undirected
function jaccardSimilarityWeightedWithEdgeSimilarity(B, D, txt, graphType)
{
	var n = 0;
	var o = 0;
	var p = 0;
	var q = 0;

	var uniqueD = uniq(D);
    var uniqueB = uniq(B);

    // build edges for B
    var bEdges = buildEdges(B);
    // build edges for D
    var dEdges = buildEdges(D);

	var BDEdges;
	// filter out edges that are duplicate
     BDEdges = bEdges[0].filter(function(c) {
	  return dEdges[0].indexOf(c) > -1;
	});
	//console.log(BDEdges);

	var uniqBDEdges = uniq(BDEdges);
	//console.log(uniqBDEdges);

	var e1 = []; // our bd unique edges
	for(var i = 0; i < uniqBDEdges.length; i++)
	{
		e1.push(uniqBDEdges[i].split("&"));
	}

    // For all the tags in tags.tsv
    for(var i = 0; i < tags.length; i++)
    {
        // search the arbitrary text 'txt' to find a weight for the tags that relate to B and D
        n += Math.min( weight(uniqueB[i], txt), weight(uniqueD[i], txt));
        o += weightV(tags[i].TagName, B);
    }

    // For all the similar edges in B and D
    for(var i = 0; i < e1.length; i++)
    {
        p += Math.min( edgeWeight(e1[i][0], e1[i][1], B, txt, graphType), edgeWeight(e1[i][0], e1[i][1], D, txt, graphType) );
        q += edgeWeightV(e1[i][0], e1[i][1], B, txt, graphType);
	}

    if (o !== 0 && q !== 0) // don't divide by zero
    {
    	return ( ( (n/o) + (p/q) ) / (2) );
    }

    return 0;
}
// Test
// var Bug = ['java', 'javascript', 'html', '.a', 'java'];
// var Dev = ['java', 'java', 'python', 'html', 'css', '.net', 'c#', 'php'];
// var testText = "java is love, java is life, java is what I make for my wife! When times are tough and full of strife, I've had too much java, java 4 lyfe!";
// console.log(jaccardSimilarityWeightedWithEdgeSimilarity(Bug, Dev, testText, 0));

////////////////////////////////////////////////////////////////////////////////////////////////////

