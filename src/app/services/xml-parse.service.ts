import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class XmlParseService {
  constructor() {}

  async parseFiles(files: File[] | FileList | any): Promise<{ activities:any[]; subgroups:any[]; teachers:any[] }> {
    const farr: File[] = Array.from(files as any) as File[];
    const activities: any[] = [];
    const subgroups: any[] = [];
    const teachers: any[] = [];

    for (const f of farr) {
      const file = f as File;
      const text = await this.readFileAsText(file);
      const doc = new DOMParser().parseFromString(text, 'application/xml');
      const root = doc.documentElement?.nodeName || '';

      // Handle .fet files with <fet> root
      if (root === 'fet') {
        // Extract from Activities_List, Students_List, Teachers_List
        const activitiesListEl = doc.getElementsByTagName('Activities_List')[0];
        const fetActivities = activitiesListEl ? this.parseFetActivities(activitiesListEl) : [];
        
        // Extract time constraints to get day/hour assignments
        const timeConstraintsEl = doc.getElementsByTagName('Time_Constraints_List')[0];
        const timeConstraints = timeConstraintsEl ? this.parseFetTimeConstraints(timeConstraintsEl) : [];
        
        // Extract room constraints
        const spaceConstraintsEl = doc.getElementsByTagName('Space_Constraints_List')[0];
        const roomConstraints = spaceConstraintsEl ? this.parseFetRoomConstraints(spaceConstraintsEl) : [];
        
        // Merge constraints into activities
        for (const activity of fetActivities) {
          const timeConst = timeConstraints.find((tc: any) => tc.activityId === activity.id);
          if (timeConst) {
            activity.day = timeConst.day;
            activity.hour = timeConst.hour;
          }
          const roomConst = roomConstraints.find((rc: any) => rc.activityId === activity.id);
          if (roomConst) {
            activity.room = roomConst.room;
          }
        }
        
        activities.push(...fetActivities);
        
        const studentsListEl = doc.getElementsByTagName('Students_List')[0];
        if (studentsListEl) {
          const fetSubgroups = this.parseFetStudents(studentsListEl);
          // Build timetables for subgroups from activities
          this.buildSubgroupTimetables(fetSubgroups, fetActivities);
          subgroups.push(...fetSubgroups);
        }
        
        const teachersListEl = doc.getElementsByTagName('Teachers_List')[0];
        if (teachersListEl) {
          const fetTeachers = this.parseFetTeachers(teachersListEl);
          // Build timetables for teachers from activities
          this.buildTeacherTimetables(fetTeachers, fetActivities);
          teachers.push(...fetTeachers);
        }

        // Extract rooms from Rooms_List
        const roomsListEl = doc.getElementsByTagName('Rooms_List')[0];
        if (roomsListEl) {
          const rooms = this.parseFetRooms(roomsListEl);
          // Add rooms to activities so they can be used in the app
          for (const room of rooms) {
            activities.push({ id: null, teacher: '', subject: '', students: '', day: '', hour: '', room: room.name });
          }
        }
      }
      // Handle individual timetable XML files
      else if (root === 'Activities_Timetable') {
        activities.push(...this.parseActivities(doc));
      } else if (root === 'Students_Timetable') {
        const xmlSubgroups = this.parseSubgroups(doc);
        subgroups.push(...xmlSubgroups);
        // Extract activities from subgroups for grouping purposes
        activities.push(...this.extractActivitiesFromSubgroups(xmlSubgroups));
      } else if (root === 'Teachers_Timetable') {
        const xmlTeachers = this.parseTeachers(doc);
        teachers.push(...xmlTeachers);
        // Extract activities from teachers for grouping purposes
        activities.push(...this.extractActivitiesFromTeachers(xmlTeachers));
      } else {
        // some .fet files may embed multiple roots — try to detect children
        if (doc.getElementsByTagName('Activities_Timetable').length) {
          activities.push(...this.parseActivities(doc.getElementsByTagName('Activities_Timetable')[0] as Element));
        }
        if (doc.getElementsByTagName('Students_Timetable').length) {
          const xmlSubgroups = this.parseSubgroups(doc.getElementsByTagName('Students_Timetable')[0] as Element);
          subgroups.push(...xmlSubgroups);
          activities.push(...this.extractActivitiesFromSubgroups(xmlSubgroups));
        }
        if (doc.getElementsByTagName('Teachers_Timetable').length) {
          const xmlTeachers = this.parseTeachers(doc.getElementsByTagName('Teachers_Timetable')[0] as Element);
          teachers.push(...xmlTeachers);
          activities.push(...this.extractActivitiesFromTeachers(xmlTeachers));
        }
      }
    }

    return { activities, subgroups, teachers };
  }

  private readFileAsText(f: File): Promise<string> {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result || ''));
      r.onerror = rej;
      r.readAsText(f, 'utf-8');
    });
  }

  private parseActivities(rootDoc: Document | Element) {
    const out: any[] = [];
    const nodes = (rootDoc as Element).getElementsByTagName('Activity');
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      const id = Number(this.textOf(el, 'Id')) || null;
      const day = this.textOf(el, 'Day') || '';
      const hour = this.textOf(el, 'Hour') || '';
      // Room may be an element with text content or an attribute
      const roomEl = el.getElementsByTagName('Room')[0];
      const room = roomEl?.getAttribute('name') || roomEl?.textContent?.trim() || this.textOf(el, 'Room') || '';
      out.push({ id, day, hour, room });
    }
    return out;
  }

  private parseSubgroups(rootDoc: Document | Element) {
    const out: any[] = [];
    const sgs = (rootDoc as Element).getElementsByTagName('Subgroup');
    for (let i = 0; i < sgs.length; i++) {
      const sg = sgs[i];
      const name = sg.getAttribute('name') || '';
      const days = [] as any[];
      const dayNodes = sg.getElementsByTagName('Day');
      for (let d = 0; d < dayNodes.length; d++) {
        const dayEl = dayNodes[d];
        const dayName = dayEl.getAttribute('name') || '';
        const hours = [] as any[];
        const hourNodes = dayEl.getElementsByTagName('Hour');
        for (let h = 0; h < hourNodes.length; h++) {
          const hEl = hourNodes[h];
          const hourName = hEl.getAttribute('name') || '';
          const teacherEl = hEl.getElementsByTagName('Teacher')[0];
          const subjectEl = hEl.getElementsByTagName('Subject')[0];
          const roomEl = hEl.getElementsByTagName('Room')[0];
          const teacher = teacherEl?.getAttribute('name') || '';
          const subject = subjectEl?.getAttribute('name') || subjectEl?.textContent?.trim() || '';
          // Room may be an attribute or element text
          const room = roomEl?.getAttribute('name') || roomEl?.textContent?.trim() || '';
          
          // Only add hours that have content
          if (teacher || subject || room) {
            hours.push({ hour: hourName, teacher, subject, room });
          }
        }
        days.push({ day: dayName, hours });
      }
      out.push({ name, days });
    }
    return out;
  }

  private parseTeachers(rootDoc: Document | Element) {
    const out: any[] = [];
    const teachers = (rootDoc as Element).getElementsByTagName('Teacher');
    for (let i = 0; i < teachers.length; i++) {
      const t = teachers[i];
      const name = t.getAttribute('name') || '';
      const days: any[] = [];
      const dayNodes = t.getElementsByTagName('Day');
      for (let d = 0; d < dayNodes.length; d++) {
        const dayEl = dayNodes[d];
        const dayName = dayEl.getAttribute('name') || '';
        const hours: any[] = [];
        const hourNodes = dayEl.getElementsByTagName('Hour');
        for (let h = 0; h < hourNodes.length; h++) {
          const hEl = hourNodes[h];
          const hourName = hEl.getAttribute('name') || '';
          const subj = hEl.getElementsByTagName('Subject')[0]?.getAttribute('name') || '';
          const students = hEl.getElementsByTagName('Students')[0]?.getAttribute('name') || '';
          const room = hEl.getElementsByTagName('Room')[0]?.getAttribute('name') || hEl.getElementsByTagName('Room')[0]?.textContent?.trim() || '';
          
          // Only add hours that have content
          if (subj || students || room) {
            hours.push({ hour: hourName, subject: subj, students, room });
          }
        }
        days.push({ day: dayName, hours });
      }
      out.push({ name, days });
    }
    return out;
  }

  private textOf(parent: Element, tag: string) {
    const el = parent.getElementsByTagName(tag)[0];
    return el?.textContent?.trim() || '';
  }

  // Parse .fet file Activities_List (not the generated timetable)
  private parseFetActivities(activitiesListEl: Element) {
    const out: any[] = [];
    const activityNodes = activitiesListEl.getElementsByTagName('Activity');
    for (let i = 0; i < activityNodes.length; i++) {
      const act = activityNodes[i];
      const id = Number(this.textOf(act, 'Id')) || null;
      const teacher = this.textOf(act, 'Teacher') || '';
      const subject = this.textOf(act, 'Subject') || '';
      const students = this.textOf(act, 'Students') || '';
      const duration = Number(this.textOf(act, 'Duration')) || 1;
      // Note: .fet activities don't have day/hour/room assigned yet
      // They will be in ConstraintActivityPreferredRoom constraints
      out.push({ id, teacher, subject, students, duration, day: '', hour: '', room: '' });
    }
    return out;
  }

  // Parse .fet file Students_List
  private parseFetStudents(studentsListEl: Element) {
    const out: any[] = [];
    const yearNodes = studentsListEl.getElementsByTagName('Year');
    
    for (let i = 0; i < yearNodes.length; i++) {
      const year = yearNodes[i];
      const yearName = this.textOf(year, 'Name') || '';
      
      const groupNodes = year.getElementsByTagName('Group');
      for (let g = 0; g < groupNodes.length; g++) {
        const group = groupNodes[g];
        const groupName = this.textOf(group, 'Name') || '';
        
        // Check for subgroups
        const subgroupNodes = group.getElementsByTagName('Subgroup');
        if (subgroupNodes.length > 0) {
          for (let s = 0; s < subgroupNodes.length; s++) {
            const subgroup = subgroupNodes[s];
            const subgroupName = this.textOf(subgroup, 'Name') || '';
            out.push({ name: subgroupName, days: [] });
          }
        } else {
          // No subgroups, use group name
          out.push({ name: groupName, days: [] });
        }
      }
    }
    return out;
  }

  // Parse .fet file Teachers_List
  private parseFetTeachers(teachersListEl: Element) {
    const out: any[] = [];
    const teacherNodes = teachersListEl.getElementsByTagName('Teacher');
    
    for (let i = 0; i < teacherNodes.length; i++) {
      const teacher = teacherNodes[i];
      const name = this.textOf(teacher, 'Name') || '';
      out.push({ name, days: [] });
    }
    return out;
  }

  // Parse .fet file Rooms_List
  private parseFetRooms(roomsListEl: Element) {
    const out: any[] = [];
    const roomNodes = roomsListEl.getElementsByTagName('Room');
    
    for (let i = 0; i < roomNodes.length; i++) {
      const room = roomNodes[i];
      const name = this.textOf(room, 'Name') || '';
      const building = this.textOf(room, 'Building') || '';
      const capacity = this.textOf(room, 'Capacity') || '';
      out.push({ name, building, capacity });
    }
    return out;
  }

  // Parse time constraints from .fet file
  private parseFetTimeConstraints(timeConstraintsEl: Element) {
    const out: any[] = [];
    const constraintNodes = timeConstraintsEl.getElementsByTagName('ConstraintActivityPreferredStartingTime');
    
    for (let i = 0; i < constraintNodes.length; i++) {
      const constraint = constraintNodes[i];
      const activityId = Number(this.textOf(constraint, 'Activity_Id')) || null;
      const day = this.textOf(constraint, 'Preferred_Day') || '';
      const hour = this.textOf(constraint, 'Preferred_Hour') || '';
      const active = this.textOf(constraint, 'Active') === 'true';
      
      if (active && activityId && day && hour) {
        out.push({ activityId, day, hour });
      }
    }
    return out;
  }

  // Parse room constraints from .fet file
  private parseFetRoomConstraints(spaceConstraintsEl: Element) {
    const out: any[] = [];
    const constraintNodes = spaceConstraintsEl.getElementsByTagName('ConstraintActivityPreferredRoom');
    
    for (let i = 0; i < constraintNodes.length; i++) {
      const constraint = constraintNodes[i];
      const activityId = Number(this.textOf(constraint, 'Activity_Id')) || null;
      const room = this.textOf(constraint, 'Room') || '';
      const active = this.textOf(constraint, 'Active') === 'true';
      
      if (active && activityId && room) {
        out.push({ activityId, room });
      }
    }
    return out;
  }

  // Build timetables for subgroups from activities
  private buildSubgroupTimetables(subgroups: any[], activities: any[]) {
    for (const subgroup of subgroups) {
      const dayMap = new Map<string, any[]>();
      
      // Extract parent class name (e.g., "3APIC-3:G1" -> "3APIC-3")
      const parentClass = subgroup.name.includes(':') 
        ? subgroup.name.split(':')[0] 
        : subgroup.name;
      
      // Find all activities for this subgroup
      for (const activity of activities) {
        // Match activities for this specific subgroup OR for the parent class (common courses)
        const matchesSubgroup = activity.students === subgroup.name;
        const matchesParentClass = activity.students === parentClass && subgroup.name.includes(':');
        
        if ((matchesSubgroup || matchesParentClass) && activity.day && activity.hour) {
          if (!dayMap.has(activity.day)) {
            dayMap.set(activity.day, []);
          }
          
          // Handle activity duration: add entry for each hour
          const duration = activity.duration || 1;
          const startHour = activity.hour; // e.g., 'H1'
          const hourNum = parseInt(startHour.substring(1)); // Extract number from 'H1' -> 1
          
          for (let h = 0; h < duration; h++) {
            const currentHour = `H${hourNum + h}`;
            dayMap.get(activity.day)!.push({
              hour: currentHour,
              subject: activity.subject,
              teacher: activity.teacher,
              room: activity.room
            });
          }
        }
      }
      
      // Convert map to days array
      subgroup.days = Array.from(dayMap.entries()).map(([day, hours]) => ({
        day,
        hours
      }));
    }
  }

  // Build timetables for teachers from activities
  private buildTeacherTimetables(teachers: any[], activities: any[]) {
    for (const teacher of teachers) {
      const dayMap = new Map<string, any[]>();
      
      // Find all activities for this teacher
      for (const activity of activities) {
        if (activity.teacher === teacher.name && activity.day && activity.hour) {
          if (!dayMap.has(activity.day)) {
            dayMap.set(activity.day, []);
          }
          
          // Handle activity duration: add entry for each hour
          const duration = activity.duration || 1;
          const startHour = activity.hour; // e.g., 'H1'
          const hourNum = parseInt(startHour.substring(1)); // Extract number from 'H1' -> 1
          
          for (let h = 0; h < duration; h++) {
            const currentHour = `H${hourNum + h}`;
            dayMap.get(activity.day)!.push({
              hour: currentHour,
              subject: activity.subject,
              students: activity.students,
              room: activity.room
            });
          }
        }
      }
      
      // Convert map to days array
      teacher.days = Array.from(dayMap.entries()).map(([day, hours]) => ({
        day,
        hours
      }));
    }
  }

  // Extract activities from teachers XML data for grouping purposes
  private extractActivitiesFromTeachers(teachers: any[]): any[] {
    const activities: any[] = [];
    for (const teacher of teachers) {
      for (const day of teacher.days) {
        for (const hour of day.hours) {
          activities.push({
            id: null,
            teacher: teacher.name,
            subject: hour.subject,
            students: hour.students,
            day: day.day,
            hour: hour.hour,
            room: hour.room
          });
        }
      }
    }
    return activities;
  }

  // Extract activities from subgroups XML data for grouping purposes
  private extractActivitiesFromSubgroups(subgroups: any[]): any[] {
    const activities: any[] = [];
    for (const subgroup of subgroups) {
      for (const day of subgroup.days) {
        for (const hour of day.hours) {
          activities.push({
            id: null,
            teacher: hour.teacher,
            subject: hour.subject,
            students: subgroup.name,
            day: day.day,
            hour: hour.hour,
            room: hour.room
          });
        }
      }
    }
    return activities;
  }
}
