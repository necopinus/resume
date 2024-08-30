var fs = require("fs");
var path = require("path");
var Handlebars = require("handlebars");

// Define custom render() function.
//
function render(resume) {
	var normalize = fs.readFileSync(__dirname + "/normalize.css", "utf-8");
	var printcss = fs.readFileSync(__dirname + "/print.css", "utf-8");
	var css = fs.readFileSync(__dirname + "/style.css", "utf-8");
	var tpl = fs.readFileSync(__dirname + "/resume.hbs", "utf-8");

	// Load partials & register with Handlebars.
	//
	var partialsDir = path.join(__dirname, 'partials');
	var filenames = fs.readdirSync(partialsDir);

	filenames.forEach(function (filename) {
		var matches = /^([^.]+).hbs$/.exec(filename);

		if (!matches) {
			return;
		}

		var name = matches[1];
		var filepath = path.join(partialsDir, filename)
		var template = fs.readFileSync(filepath, 'utf8');

		Handlebars.registerPartial(name, template);
	});

	// Walk over the resume.skills array, extracting the "Topline
	// Skills" and "Areas of Expertise" clusters if they exist,
	// inserting these into resume.basics, and then deleting the
	// corresponding clusters in resume.skills.
	//
	if ("skills" in resume) {
		var newSkills = [];

		resume.skills.forEach(function(skill) {
			if (skill.name === "Topline Skills") {
				resume.basics.topline = skill.keywords;
			} else if (skill.name === "Areas of Expertise") {
				resume.basics.expertise = skill.keywords;
			} else {
				newSkills.push(skill)
			}
		});

		resume.skills = newSkills;
	}

	// Calculate "recent" and "previous" year cut-offs.
	//
	var today = new Date();
	var thisYear = today.getFullYear()
	var lastRecentYear = thisYear - 10;
	var lastPreviousYear = thisYear - 15;

	// Walk over the resume.work array and determine if each
	// position should be classified as "recent", "previous", or
	// neither.
	//
	// Also note whether the start and end year are the same.
	//
	// Also, construct an alternate resume.workByOrganization object
	// that aggregates work entries by organizational information.
	//
	if ("work" in resume) {
		var workByOrganization = [];
		var currentOrg = {};

		currentOrg.endDate = "1970-01-01";
		currentOrg.recent = false;
		currentOrg.previous = false;
		currentOrg.include = false;
		currentOrg.singleDate = false;
		currentOrg.positions = [];

		resume.work.forEach(function(position, index, workArray) {
			var isRecent = false;
			var isPrevious = false;
			var sameYear = false;

			if (position.endDate) {
				var theStartDate = new Date(position.startDate);
				var startYear = theStartDate.getFullYear();

				var theEndDate = new Date(position.endDate);
				var endYear = theEndDate.getFullYear();

				if (endYear >= lastRecentYear) {
					isRecent = true;
				} else if (endYear >= lastPreviousYear) {
					isPrevious = true;
				}

				if (endYear === startYear) {
					sameYear = true;
				}
			} else {
				isRecent = true;
			}

			position.recent = isRecent;
			position.previous = isPrevious;
			position.include = isRecent || isPrevious;
			position.singleDate = sameYear;

			if ((((! "name" in position) && (! "name" in currentOrg)) || (currentOrg.name === position.name))
			    && (((! "location" in position) && (! "location" in currentOrg)) || (currentOrg.location === position.location))
			    && (((! "description" in position) && (! "description" in currentOrg)) || (currentOrg.description === position.description))
			    && (((! "url" in position) && (! "url" in currentOrg)) || (currentOrg.url === position.url))) {

				if ("startDate" in position) {
					if ("startDate" in currentOrg) {
						var positionStartDate = new Date(position.startDate);
						var orgStartDate = new Date(currentOrg.startDate);
						if (positionStartDate < orgStartDate) {
							currentOrg.startDate = position.startDate;
						}
					} else {
						currentOrg.startDate = position.startDate;
					}
				}

				if ("endDate" in currentOrg) {
					if ("endDate" in position) {
						var positionEndDate = new Date(position.endDate);
						var orgEndDate = new Date(currentOrg.endDate);
						if (positionEndDate > orgEndDate) {
							currentOrg.endDate = position.endDate;
						}
					} else {
						delete currentOrg.endDate;
					}
				}

				if (!currentOrg.recent && position.recent) {
					currentOrg.recent = true;
					currentOrg.previous = false;
				}
				if (!currentOrg.recent && !currentOrg.previous && position.previous) {
					currentOrg.previous = true;
				}
				currentOrg.include = currentOrg.recent || currentOrg.previous;

				if (("startDate" in currentOrg) && ("endDate" in currentOrg)) {
					var theStartDate = new Date(currentOrg.startDate);
					var theEndDate = new Date(currentOrg.endDate);

					if (theStartDate.getFullYear() === theEndDate.getFullYear()) {
						currentOrg.singleDate = true;
					}
				} else {
					currentOrg.singleDate = false;
				}
			} else {
				if (currentOrg.positions.length > 0) {
					workByOrganization.push(currentOrg);
				}

				currentOrg = {};
				currentOrg.positions = [];

				if ("name" in position) {
					currentOrg.name = position.name;
				}
				if ("location" in position) {
					currentOrg.location = position.location;
				}
				if ("description" in position) {
					currentOrg.description = position.description;
				}
				if ("url" in position) {
					currentOrg.url = position.url;
				}
				if ("startDate" in position) {
					currentOrg.startDate = position.startDate;
				}
				if ("endDate" in position) {
					currentOrg.endDate = position.endDate;
				}

				currentOrg.recent = position.recent;
				currentOrg.previous = position.previous;
				currentOrg.include = position.include;
				currentOrg.singleDate = position.singleDate;
			}
			currentOrg.positions.push(position);

			// Make sure that the final currentOrg is pushed into workByOrganization.
			//
			if (index === workArray.length - 1) {
				workByOrganization.push(currentOrg);
			}
		});

		resume.workByOrganization = workByOrganization;
	}

	// We need to further break up the workByOrganization array by
	// recent and previous organizations, as Handlebars is not quite
	// smart enough to handle the "previous employment" formatting
	// otherwise.
	//
	if ("workByOrganization" in resume) {
		var workRecent = [];
		var workPrevious = [];

		resume.workByOrganization.forEach(function(organization) {
			if (organization.recent) {
				workRecent.push(organization);
			} else if (organization.previous) {
				workPrevious.push(organization);
			}
		});

		resume.workRecent = workRecent;
		resume.workPrevious = workPrevious;

		if ((workRecent.length > 0) || workPrevious.length > 0) {
			resume.workExists = true;
		} else {
			resume.workExists = false;
		}
	}

	// Walk over the resume.volunteer array and determine if each
	// position should be classified as "recent", "previous", or
	// neither.
	//
	// Also note whether the start and end year are the same.
	//
	if ("volunteer" in resume) {
		resume.volunteer.forEach(function(position) {
			var isRecent = false;
			var isPrevious = false;
			var sameYear = false;

			if (position.endDate) {
				var theStartDate = new Date(position.startDate);
				var startYear = theStartDate.getFullYear();

				var theEndDate = new Date(position.endDate);
				var endYear = theEndDate.getFullYear();

				if (endYear >= lastRecentYear) {
					isRecent = true;
				} else if (endYear >= lastPreviousYear) {
					isPrevious = true;
				}

				if (endYear === startYear) {
					sameYear = true;
				}
			} else {
				isRecent = true;
			}

			position.recent = isRecent;
			position.previous = isPrevious;
			position.include = (isRecent || isPrevious) && (position.organization !== "Colorado Indymedia");
			position.singleDate = sameYear;
		});
	}

	// Walk over the resume.education array and determine if each
	// degree should be classified as "recent", "previous", or
	// neither.
	//
	// Also note whether the start and end year are the same.
	//
	if ("education" in resume) {
		resume.education.forEach(function(degree) {
			var isRecent = false;
			var isPrevious = false;
			var sameYear = false;

			if (degree.endDate) {
				var theStartDate = new Date(degree.startDate);
				var startYear = theStartDate.getFullYear();

				var theEndDate = new Date(degree.endDate);
				var endYear = theEndDate.getFullYear();

				if (endYear >= lastRecentYear) {
					isRecent = true;
				} else if (endYear >= lastPreviousYear) {
					isPrevious = true;
				}

				if (endYear === startYear) {
					sameYear = true;
				}
			} else {
				isRecent = true;
			}

			degree.recent = isRecent;
			degree.previous = isPrevious;
			degree.include = isRecent || isPrevious || "studyType" in degree;
			degree.singleDate = sameYear;
		});
	}

	// Walk over the resume.awards array and determine if each award
	// should be classified as "recent", "previous", or neither.
	//
	if ("awards" in resume) {
		resume.awards.forEach(function(award) {
			var isRecent = false;
			var isPrevious = false;

			if (award.date) {
				var theDate = new Date(award.date);
				var endYear = theDate.getFullYear();

				if (endYear >= lastRecentYear) {
					isRecent = true;
				} else if (endYear >= lastPreviousYear) {
					isPrevious = true;
				}
			} else {
				isRecent = true;
			}

			award.recent = isRecent;
			award.previous = isPrevious;
			award.include = isRecent || isPrevious;
		});
	}

	// Walk over the resume.publications array and determine if
	// each publication should be classified as "recent",
	// "previous", or neither.
	//
	if ("publications" in resume) {
		resume.publications.forEach(function(publication) {
			var isRecent = false;
			var isPrevious = false;

			if (publication.releaseDate) {
				var theDate = new Date(publication.releaseDate);
				var endYear = theDate.getFullYear();

				if (endYear >= lastRecentYear) {
					isRecent = true;
				} else if (endYear >= lastPreviousYear) {
					isPrevious = true;
				}
			} else {
				isRecent = true;
			}

			publication.recent = isRecent;
			publication.previous = isPrevious;
			publication.include = isRecent || isPrevious;
		});
	}

	// Walk over the resume.projects array and determine if each
	// project should be classified as "recent", "previous", or
	// neither.
	//
	// Also note whether the start and end year are the same.
	//
	if ("projects" in resume) {
		resume.projects.forEach(function(project) {
			var isRecent = false;
			var isPrevious = false;
			var sameYear = false;

			if (project.endDate) {
				var theStartDate = new Date(project.startDate);
				var startYear = theStartDate.getFullYear();

				var theEndDate = new Date(project.endDate);
				var endYear = theEndDate.getFullYear();

				if (endYear >= lastRecentYear) {
					isRecent = true;
				} else if (endYear >= lastPreviousYear) {
					isPrevious = true;
				}

				if (endYear === startYear) {
					sameYear = true;
				}
			} else {
				isRecent = true;
			}

			project.recent = isRecent;
			project.previous = isPrevious;
			project.include = isRecent || isPrevious;
			project.singleDate = sameYear;
		});
	}

	// Compile and return resume.
	//
	return Handlebars.compile(tpl)({
		normalize: normalize,
		printcss: printcss,
		css: css,
		resume: resume
	});
}

// Register Handlebars helper to turn multi-line strings into proper
// paragraphs. Stolen from:
//
//     https://github.com/jackkeller/jsonresume-theme-full/blob/main/index.js
//
Handlebars.registerHelper('paragraphSplit', function(plaintext) {
	var i;
	var output = '';
	var lines = plaintext.split(/\r|\r\n|\n/g);

	for (i = 0; i < lines.length; i++) {
		if(lines[i].trim().length > 0) {
			output += '<p>' + lines[i].trim() + '</p>';
		}
	}

	return new Handlebars.SafeString(output);
});

// Register Handlebars helper to turn multi-line strings into list
// items. More-or-less duplicates the above block.
//
Handlebars.registerHelper('itemSplit', function(plaintext) {
	var i;
	var output = '';
	var lines = plaintext.split(/\r|\r\n|\n/g);

	for (i = 0; i < lines.length; i++) {
		if(lines[i].trim().length > 0) {
			output += '<li>' + lines[i].trim() + '</li>';
		}
	}

	return new Handlebars.SafeString(output);
});

// Register Handlebars helper to reduce dates down to their year.
// Modeled after:
//
//     https://github.com/jackkeller/jsonresume-theme-full/blob/main/index.js
//
Handlebars.registerHelper('onlyYear', function(date) {
	const theDate = new Date(date);
	return `${theDate.getFullYear()}`;
});

// Export custom render() function.
//
module.exports = {
	render: render
};
