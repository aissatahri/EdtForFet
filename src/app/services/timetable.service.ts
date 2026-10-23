import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TimetableService {
  constructor() {}

  /**
   * Compute vacant rooms per slot (day|hour).
   * activities: array of {id, day, hour, room}
   * subgroups: array of {name, days: [{day, hours: [{hour, teacher, subject, room}]}]}
   */
  computeVacantRooms(activities: any[], subgroups: any[]) {
    const allRooms = new Set<string>();
    for (const a of activities) {
      if (a.room) allRooms.add(a.room);
    }
    // also collect rooms from subgroups
    for (const sg of subgroups) {
      for (const d of sg.days || []) {
        for (const h of d.hours || []) {
          if (h.room) allRooms.add(h.room);
        }
      }
    }

    const usedMap = new Map<string, Set<string>>();
    const pushUsed = (day: string, hour: string, room: string) => {
      if (!room) return;
      const key = `${day}|${hour}`;
      if (!usedMap.has(key)) usedMap.set(key, new Set());
      usedMap.get(key)!.add(room);
    };

    for (const sg of subgroups) {
      for (const d of sg.days || []) {
        for (const h of d.hours || []) {
          if (h.room) pushUsed(d.day, h.hour, h.room);
        }
      }
    }

    // also consider activities room assignments
    for (const a of activities) {
      if (a.room) pushUsed(a.day, a.hour, a.room);
    }

    const result: Record<string, string[]> = {};
    const allRoomsArr = Array.from(allRooms).filter(r => r);
    // if no rooms known, return empty
    if (!allRoomsArr.length) return result;

    // gather all seen slots
    const slots = new Set<string>();
    for (const a of activities) slots.add(`${a.day}|${a.hour}`);
    for (const sg of subgroups) for (const d of sg.days || []) for (const h of d.hours || []) slots.add(`${d.day}|${h.hour}`);

    for (const slot of Array.from(slots)) {
      const used = usedMap.get(slot) || new Set();
      result[slot] = allRoomsArr.filter(r => !used.has(r));
    }

    return result;
  }
}
