changed Courses -> instructorId: Int (had object, but prof said the schema blurb meant that it should be an int or string )
changed Courses -> id: Int (had string but other ids are ints)

for the binary field (submissions)
const base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";
const buffer = Buffer.from(base64, 'base64');


## json templates

courses.json
[
    {
        "id": 0,
        "subject": "blank",
        "number": "000",
        "title": "blank",
        "term": "blank",
        "instructorid": 0
    }
    {
        "id": 0,
        "subject": "CS",
        "number": "493",
        "title": "Cloud Application Development",
        "term": "sp22",
        "instructorid": 0
    }
]

assignments.json
[
    {
        "id": 0,
        "courseid": 0,
        "title": "blank",
        "points": 0,
        "due": "blank"
    }
    {
        "id": 0,
        "courseid": 0,
        "title": "Assignment 0",
        "points": 100,
        "due": "2022-06-14T17:00:00-07:00"
    }
]

submissions.json

[
    {
        "id": 0,
        "assignmentid": 0,
        "studentid": 0,
        "timestamp": "2022-06-14T17:00:00-07:00",
        "grade": 100.0,
        "file": ""
    }
]

users.json
[
    {
        "id": 0,
        "name": "blank",
        "email": "blank@oregonstate.edu",
        "password": "blank",
        "role": "blank"
    }
    {
        "id": 0,
        "name": "Marty Jenkins",
        "email": "JenkinsM@oregonstate.edu",
        "password": "password1234",
        "role": "student"
    }
]




