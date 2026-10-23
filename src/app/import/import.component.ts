import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { XmlParseService } from '../services/xml-parse.service';
import { TimetableService } from '../services/timetable.service';

@Component({
  selector: 'app-import',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './import.component.html',
  styleUrls: ['./import.component.css']
})
export class ImportComponent {
  selectedFiles: File[] = [];
  message = '';
  parsed: any = null;
  vacantRooms: Record<string, string[]> = {};
  showModal = false;
  @Output() parsedChange = new EventEmitter<any>();

  constructor(private xmlParse: XmlParseService, private timetable: TimetableService) {}

  onFileChange(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (!input.files) return;
    this.selectedFiles = Array.from(input.files);
    this.message = `تم تحديد ${this.selectedFiles.length} ملف/ملفات`;
    // Auto-parse when files are selected
    this.parseFiles();
  }

  async parseFiles() {
    if (!this.selectedFiles.length) {
      this.message = 'لم يتم تحديد أي ملف';
      return;
    }
    this.message = 'جاري التحليل...';
    try {
      this.parsed = await this.xmlParse.parseFiles(this.selectedFiles);
      // emit parsed result to parent
      this.parsedChange.emit(this.parsed);
      this.message = 'اكتمل التحليل — ' +
        `الأنشطة=${this.parsed.activities.length}, المجموعات=${this.parsed.subgroups.length}, المعلمون=${this.parsed.teachers.length}`;
      // Show modal on success
      this.showModal = true;
    } catch (err:any) {
      this.message = 'خطأ أثناء التحليل: ' + (err?.message || err);
    }
  }

  closeModal() {
    this.showModal = false;
  }

  computeVacant() {
    if (!this.parsed) {
      this.message = 'يرجى استيراد الملفات أولاً.';
      return;
    }
    this.vacantRooms = this.timetable.computeVacantRooms(this.parsed.activities, this.parsed.subgroups);
  }

  getSelectedNames() {
    return this.selectedFiles.map(f => f.name).join(', ');
  }
}

export interface ParsedResult {
  activities: any[];
  subgroups: any[];
  teachers: any[];
}
