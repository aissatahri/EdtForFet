import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-timetable-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timetable-grid.component.html',
  styleUrls: ['./timetable-grid.component.css']
})
export class TimetableGridComponent {
  @Input() days = null; // array of { day, hours: [...] }
  @Input() hours = [];

  roomLabel(r) { return r || ''; }

  getCell(day, hour) {
    if (!day || !Array.isArray(day.hours)) return null;
    for (let i = 0; i < day.hours.length; i++) {
      const h = day.hours[i];
      if (h && h.hour === hour) return h;
    }
    return null;
  }

  processedDays = [];

  ngOnChanges(changes) {
    if (changes && (changes['days'] || changes['hours'])) {
      this.processGrid();
    }
  }

  processGrid() {
    this.processedDays = [];
    const hrs = this.hours || [];
    if (!this.days || !this.days.length || !hrs.length) return;

    const keyOf = (c) => (c ? `${c.subject || ''}::${c.room || ''}::${c.teacher || ''}` : '__EMPTY__');

    for (const d of this.days) {
      const map = new Map();
      for (const h of (d.hours || [])) {
        if (h && h.hour) map.set(h.hour, h);
      }

      const cells = [];
      let i = 0;
      while (i < hrs.length) {
        const h = hrs[i];
        const cell = map.get(h) || null;
        if (!cell) {
          cells.push({ cell: null, colspan: 1 });
          i++;
          continue;
        }

        let colspan = 1;
        const baseKey = keyOf(cell);
        let j = i + 1;
        while (j < hrs.length) {
          const next = map.get(hrs[j]) || null;
          if (!next) break;
          if (keyOf(next) !== baseKey) break;
          colspan++;
          j++;
        }

        cells.push({ cell, colspan });
        i = j;
      }

      this.processedDays.push({ day: d.day, cells });
    }
  }

}
import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-timetable-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timetable-grid.component.html',
  styleUrls: ['./timetable-grid.component.css']
})
export class TimetableGridComponent {
  @Input() days: any[] | null = null; // array of { day, hours: [{hour, subject, teacher, room}] }
  @Input() hours: string[] = [];

  // helper to format room label
  roomLabel(r: string) { return r || ''; }

  getCell(day: any, hour: string) {
    if (!day || !Array.isArray(day.hours)) return null;
    return day.hours.find((h: any) => h.hour === hour) || null;
  }

}
  
  // processed structure used by the template: for each day a list of cells with colspan
  processedDays: any[] = [];

  ngOnChanges(changes: any) {
    if (changes && (changes['days'] || changes['hours'])) {
      this.processGrid();
    }
  }

  private processGrid() {
    this.processedDays = [];
    const hrs = this.hours || [];
    if (!this.days || !this.days.length || !hrs.length) return;

    const keyOf = (c: any) => (c ? `${c.subject || ''}::${c.room || ''}::${c.teacher || ''}` : '__EMPTY__');

    for (const d of this.days) {
      const map = new Map<string, any>();
      for (const h of d.hours || []) {
        map.set(h.hour, h);
      }

      const cells: any[] = [];
      let i = 0;
      while (i < hrs.length) {
        const h = hrs[i];
        const cell = map.get(h) || null;
        if (!cell) {
          cells.push({ cell: null, colspan: 1 });
          i++;
          continue;
        }

        // compute colspan: how many consecutive hours have same key
        let colspan = 1;
        const baseKey = keyOf(cell);
        let j = i + 1;
        while (j < hrs.length) {
          const next = map.get(hrs[j]) || null;
          if (!next) break;
          if (keyOf(next) !== baseKey) break;
          colspan++;
          j++;
        }

        cells.push({ cell, colspan });
        i = j;
      }

      this.processedDays.push({ day: d.day, cells });
    }
  }

