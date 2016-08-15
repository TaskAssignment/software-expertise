'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/** Events are the story of an Issue on GitHub. They show when that issue had
* labels added or removed, when commits referenced that issue or when a user was
* assigned or unassigned, between other things.
*
* @class Event
* @property {teste} testeNome - testando
* @requires mongoose
* @see {@link https://developer.github.com/v3/issues/events/ | API on Events}
**/
var EventSchema = new Schema({
    /** The id of this event on GitHub.
    *
    * @inner
    * @memberof Event
    * @type {Number}
    **/
    _id: Number,

    /** The project where this event happened.
    *
    * @inner
    * @memberof Event
    * @type {Number}
    **/
    projectId: {
        type: Number,
        ref: 'Project',
    },

    /** The id of the issue that this event refers to.
    *
    * @inner
    * @memberof Event
    * @type {Number}
    **/
    issueId: {
        type: Number,
        ref: 'Issue',
    },

    /** The number of the issue that this event refers to.
    *
    * @inner
    * @memberof Event
    * @type {Number}
    **/
    issueNumber: Number,

    /** The username of the person that generated this event.
    *
    * @inner
    * @memberof Event
    * @type {Number}
    **/
    actor: String,

    /** If this event is merge or a commit referencing an issue, the event will
    * have a commit sha. That's the commit id.
    *
    * @inner
    * @memberof Event
    * @type {String}
    **/
    commitId: String,

    /** What was the event? Possible values, according to the GitHub API: closed,
    * reopened, subscribed, merged, referenced, mentioned, assigned, unassigned,
    * labeled, unlabeled, milestoned, demilestoned, renamed, locked, unlocked,
    * head_ref_deleted, head_ref_restored
    * @inner
    * @memberof Event
    * @type {String}
    **/
    typeOfEvent: String,

    /** If this event is 'assigned' or 'unassigned' the user this is the username
    * of the new (or old) assignee.
    *
    * @inner
    * @memberof Event
    * @type {String}
    **/
    assigneeId: String,

    /** The date that this event was created on GitHub.
    *
    * @inner
    * @memberof Event
    * @type {Date}
    **/
    createdAt: Date,

    /** This shows if the event is related to a Pull Request (PR) or a regular issue.
    *
    * @inner
    * @memberof Event
    * @type {Boolean}
    * @default false
    **/
    isPrEvent: {
        type: Boolean,
        default: false, //IssueEvent or Pull Request Event
    },
});

mongoose.model('Event', EventSchema);
