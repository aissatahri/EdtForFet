import {Subject} from "rxjs";

export class Activity{
  activity_Id : number;
  day : string;
  hour : string;
  students_Sets : string;
  subject : string;
  teachers : string;
  activity_Tags : string;
  room : string;
  comments : string;


  constructor(day: string = '', hour: string = '', students_Sets: string = '', subject: string = '', teachers: string = '', activity_Tags: string = '', room: string = '', comments: string = '') {
    this.day = day;
    this.hour = hour;
    this.students_Sets = students_Sets;
    this.subject = subject;
    this.teachers = teachers;
    this.activity_Tags = activity_Tags;
    this.room = room;
    this.comments = comments;
  }
}


