import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImportComponent } from './import/import.component';
import { DonationComponent } from './donation/donation.component';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PdfFontsService } from './pdf-fonts.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ImportComponent, CommonModule, FormsModule, DonationComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'جدول الدروس (FET)';
  parsed: any = null;
  hoursList: string[] = [];
  daysList: any[] = [];
  teachersList: any[] = [];
  classesList: string[] = [];
  roomsList: string[] = [];
  teachersGroupedBySubject: any = {}; // { subject: [teachers] }
  vacantRoomsData: any[] = []; // Array of { name: roomName, slots: [{ isVacant: boolean }] }
  globalViewData: any[] = []; // Array for global view (teachers/days grid)
  globalViewOption: string = 'teachersByDay'; // 'teachersByDay' or 'daysByTeacher'
  selectedTeachersForGlobal: any[] = []; // For option 2, limit to selected teachers
  
  // Configuration and localStorage
  showConfigModal: boolean = false;
  configActiveTab: string = 'info'; // 'info', 'teachers', 'rooms', 'classes'
  config: any = {
    establishment: '',
    region: '',
    institution: '',
    schoolYear: '2025-2026',
    logo: '', // Base64 string of logo image
    logoSize: 140,
    dimensions: { width: 11, height: 2 },
    // Header lines for PDF
    headerLine1: 'المملكة المغربية',
    headerLine2: 'وزارة التربية الوطنية والتعليم الأولي والرياضة',
    headerLine3: '',
    headerLine4: 'جهة الشرق – مديرية وجدة – أنجاد – ثانوية عبد الرحمان حجيرة الإعدادية – وحدة',
    renames: {
      teachers: {} as any, // { oldName: newName }
      rooms: {} as any,
      classes: {} as any
    }
  };
  
  // unified selector state: entityMode controls which list is shown
  // entityMode: 'teacher' | 'class' | 'room'
  entityMode: string = 'teacher';
  selectedEntity = '';
  private _viewMode = 'teachers';
  
  get viewMode() {
    return this._viewMode;
  }
  
  set viewMode(value: string) {
    this._viewMode = value;
    // Synchronize entityMode based on viewMode
    if (value === 'teachers') {
      this.entityMode = 'teacher';
    } else if (value === 'subgroups') {
      this.entityMode = 'class';
    } else if (value === 'rooms') {
      this.entityMode = 'room';
    } else if (value === 'vacant') {
      this.entityMode = 'vacant';
      this.buildVacantRoomsData();
    } else if (value === 'global') {
      this.entityMode = 'global';
      this.buildGlobalView();
    }
    // Reset selected entity when changing mode
    this.selectedEntity = '';
    if (value !== 'vacant' && value !== 'global') {
      this.buildGridPreview();
    }
  }
  
  constructor(private pdfFontsService: PdfFontsService) {
    // Load configuration and data from localStorage on init
    this.loadFromLocalStorage();
  }

  onParsed(result: any) {
    this.parsed = result;
    // build a simple hours list + days for a preview from the first subgroup if available
    this.hoursList = [];
    this.daysList = [];
    const sg = this.parsed?.subgroups?.[0];
    if (sg && Array.isArray(sg.days)) {
      this.daysList = sg.days;
      const seen = new Set<string>();
      for (const d of sg.days) {
        for (const h of d.hours || []) {
          if (!seen.has(h.hour)) {
            seen.add(h.hour);
            this.hoursList.push(h.hour);
          }
        }
      }
    }
    // teachers - extract with their main subject
    // Collect all unique teacher names from both teachers and subgroups
    const allTeacherNames = new Set<string>();
    
    // Add teachers from parsed.teachers
    (this.parsed?.teachers || []).forEach((t: any) => {
      const teacherName = t.name || t['@name'] || t;
      if (teacherName) allTeacherNames.add(teacherName);
    });
    
    // Add teachers from parsed.subgroups (group activities)
    (this.parsed?.subgroups || []).forEach((subgroup: any) => {
      (subgroup.days || []).forEach((day: any) => {
        (day.hours || []).forEach((hour: any) => {
          if (hour.teacher) allTeacherNames.add(hour.teacher);
        });
      });
    });
    
    this.teachersList = Array.from(allTeacherNames)
      .filter(name => name && name.trim() !== '') // Filter out empty names
      .map((teacherName: string) => {
      // Find the most common subject taught by this teacher
      let mainSubject = '';
      if (this.parsed?.activities) {
        const subjects = new Map<string, number>();
        for (const activity of this.parsed.activities) {
          if (activity.teacher === teacherName && activity.subject) {
            subjects.set(activity.subject, (subjects.get(activity.subject) || 0) + 1);
          }
        }
        // Get the subject with highest count
        let maxCount = 0;
        for (const [subject, count] of subjects.entries()) {
          if (count > maxCount) {
            maxCount = count;
            mainSubject = subject;
          }
        }
      }
      return { name: teacherName, subject: mainSubject };
    });
    
    // Group teachers by subject
    this.teachersGroupedBySubject = {};
    for (const teacher of this.teachersList) {
      const subject = teacher.subject || 'أخرى'; // "Other" in Arabic
      if (!this.teachersGroupedBySubject[subject]) {
        this.teachersGroupedBySubject[subject] = [];
      }
      this.teachersGroupedBySubject[subject].push(teacher);
    }
    
    // classes (subgroups) - combine groups with same base name
    const classesSet = new Set<string>();
    for (const s of (this.parsed?.subgroups || [])) {
      const fullName = s.name || s['@name'] || '';
      if (fullName) {
        // Extract base name (remove :G1, :G2, etc.)
        const baseName = fullName.includes(':') ? fullName.split(':')[0] : fullName;
        classesSet.add(baseName);
      }
    }
    this.classesList = Array.from(classesSet).sort();
    // rooms: collect unique from activities, subgroups, and teachers
    const rooms = new Set<string>();
    for (const a of (this.parsed?.activities || [])) if (a.room) rooms.add(a.room);
    for (const sg of (this.parsed?.subgroups || [])) {
      for (const d of sg.days || []) {
        for (const h of d.hours || []) if (h.room) rooms.add(h.room);
      }
    }
    for (const t of (this.parsed?.teachers || [])) {
      for (const d of t.days || []) {
        for (const h of d.hours || []) if (h.room) rooms.add(h.room);
      }
    }
    this.roomsList = Array.from(rooms).sort();

    // build processed grid for preview (merge adjacent identical cells horizontally)
    this.buildGridPreview();
    
    // Save to localStorage after successful import
    this.saveToLocalStorage();
  }
  
  // LocalStorage methods
  saveToLocalStorage() {
    try {
      localStorage.setItem('fet_parsed_data', JSON.stringify(this.parsed));
      localStorage.setItem('fet_config', JSON.stringify(this.config));
      console.log('Data saved to localStorage');
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }
  
  loadFromLocalStorage() {
    try {
      const savedData = localStorage.getItem('fet_parsed_data');
      const savedConfig = localStorage.getItem('fet_config');
      
      if (savedConfig) {
        const loadedConfig = JSON.parse(savedConfig);
        // Merge with default config to ensure all properties exist
        this.config = {
          ...this.config,
          ...loadedConfig,
          renames: {
            teachers: loadedConfig.renames?.teachers || {},
            rooms: loadedConfig.renames?.rooms || {},
            classes: loadedConfig.renames?.classes || {}
          }
        };
      }
      
      if (savedData) {
        this.parsed = JSON.parse(savedData);
        // Rebuild all lists
        this.onParsed(this.parsed);
        console.log('Data loaded from localStorage');
      }
    } catch (e) {
      console.error('Error loading from localStorage:', e);
    }
  }
  
  clearLocalStorage() {
    if (confirm('هل أنت متأكد من حذف جميع البيانات المحفوظة؟')) {
      localStorage.removeItem('fet_parsed_data');
      localStorage.removeItem('fet_config');
      this.parsed = null;
      this.config = {
        establishment: '',
        region: '',
        institution: '',
        schoolYear: '2025-2026',
        logoSize: 140,
        dimensions: { width: 11, height: 2 },
        renames: {
          teachers: {},
          rooms: {},
          classes: {}
        }
      };
      console.log('localStorage cleared');
    }
  }
  
  // Configuration methods
  openConfig() {
    this.showConfigModal = true;
  }
  
  closeConfig() {
    this.showConfigModal = false;
  }
  
  saveConfig() {
    this.saveToLocalStorage();
    this.closeConfig();
    // Rebuild preview with renamed entities
    this.buildGridPreview();
    alert('تم حفظ الإعدادات');
  }
  
  getDisplayName(type: 'teacher' | 'room' | 'class', originalName: string): string {
    if (!this.config || !this.config.renames) {
      return originalName;
    }
    const renames = this.config.renames[type + 's'];
    if (!renames) {
      return originalName;
    }
    return renames[originalName] || originalName;
  }
  
  onLogoChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('الرجاء اختيار صورة صالحة');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.config.logo = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }
  
  removeLogo() {
    this.config.logo = '';
  }

  onFilterChange() {
    // rebuild preview with current filters
    this.buildGridPreview();
  }
  show() { console.log('show', this.viewMode, this.entityMode, this.selectedEntity); }
  
  print() { window.print(); }
  
  /**
   * Add header with logo and information to PDF
   */
  private async addPdfHeader(doc: jsPDF, entityName: string, entitySubject?: string): Promise<number> {
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 8;
    
    // Add logo if available (larger size)
    if (this.config.logo) {
      try {
        const logoWidth = 35;  // Increased from 25 to 35
        const logoHeight = 35; // Increased from 25 to 35
        const logoX = (pageWidth / 2) - (logoWidth / 2);
        doc.addImage(this.config.logo, 'PNG', logoX, yPosition, logoWidth, logoHeight);
        yPosition += logoHeight + 2;
      } catch (error) {
        console.error('Erreur lors de l\'ajout du logo:', error);
      }
    }
    
    // Académie – Direction – Établissement sur la même ligne
    doc.setFontSize(9);
    doc.setFont('Amiri', 'normal');
    
    const institutionLine: string[] = [];
    if (this.config.establishment) institutionLine.push(this.config.establishment);
    if (this.config.region) institutionLine.push(this.config.region);
    if (this.config.institution) institutionLine.push(this.config.institution);
    
    if (institutionLine.length > 0) {
      const fullLine = institutionLine.join(' – ');
      doc.text(fullLine, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 6;
    }
    
    // الموسم الدراسي (année scolaire) on the left
    if (this.config.schoolYear) {
      doc.setFontSize(10);
      doc.text(`الموسم الدراسي ${this.config.schoolYear}`, 10, yPosition);
    }
    
    // Title: جدول الحصص + Entity name + subject on the same line
    doc.setFontSize(14);
    doc.setFont('Amiri', 'bold');
    
    // Build the title line (RTL: start with title, then person, then subject)
    let titleLine = 'جدول الحصص';
    
    if (this.entityMode === 'teacher' && entitySubject) {
      // For teachers: جدول الحصص – الأستاذ)ة(: [اسم] – المادة: [المادة]
      titleLine = `جدول الحصص – الأستاذ)ة(: ${entityName} – المادة: ${entitySubject}`;
    } else if (this.entityMode === 'teacher') {
      // For teachers without subject: جدول الحصص – الأستاذ)ة(: [اسم]
      titleLine = `جدول الحصص – الأستاذ)ة(: ${entityName}`;
    } else {
      // For classes and rooms: جدول الحصص – [اسم]
      titleLine = `جدول الحصص – ${entityName}`;
    }
    
    doc.text(titleLine, pageWidth - 10, yPosition, { align: 'right' });
    yPosition += 8;
    
    return yPosition; // Return the Y position where content should start
  }
  
  async exportPdf() {
    // Check if we're in vacant rooms mode
    if (this.viewMode === 'vacant') {
      await this.exportVacantRoomsPdf();
      return;
    }
    
    if (!this.selectedEntity) {
      alert('الرجاء اختيار عنصر للتصدير');
      return;
    }

    const doc = new jsPDF('p', 'mm', 'a4'); // portrait, millimeters, A4
    
    // Load and set Arabic fonts
    await this.pdfFontsService.loadFonts(doc);
    doc.setFont('Amiri');
    
    // Get subject if teacher mode
    let entitySubject = '';
    let displayEntityName = this.selectedEntity;
    
    if (this.entityMode === 'teacher') {
      const teacher = this.teachersList.find(t => t.name === this.selectedEntity);
      entitySubject = teacher?.subject || '';
      displayEntityName = this.getDisplayName('teacher', this.selectedEntity);
    } else if (this.entityMode === 'class') {
      displayEntityName = this.getDisplayName('class', this.selectedEntity);
    } else if (this.entityMode === 'room') {
      displayEntityName = this.getDisplayName('room', this.selectedEntity);
    }
    
    // Add header with logo and information
    const startY = await this.addPdfHeader(doc, displayEntityName, entitySubject);
    
    // Prepare table data - RTL order (hours first, then day at the end)
    const reversedHours = [...this.hoursList].reverse();
    // Inverse hour format: 09:30-08:30 instead of 08:30-09:30
    const formattedHours = reversedHours.map(h => {
      const parts = h.split('-');
      if (parts.length === 2) {
        return `${parts[1]}-${parts[0]}`;
      }
      return h;
    });
    const headers = [[...formattedHours, 'اليوم']];
    const body: any[] = [];
    
    for (const pd of this.processedDays) {
      const row: any[] = [];
      
      // Process cells for this day
      const dayCells: any[] = [];
      let hourIndex = 0;
      
      for (const cellData of pd.cells) {
        const colspan = cellData.colspan || 1;
        
        // Prepare cell content
        let cellContent = '';
        if (cellData.cells && cellData.cells.length > 0) {
          // Deduplicate cells with same content (for classes with multiple groups)
          const uniqueCells = new Map<string, any>();
          for (const c of cellData.cells) {
            const key = `${c.subject}|${c.room || ''}|${c.teacher || ''}`;
            if (!uniqueCells.has(key)) {
              uniqueCells.set(key, c);
            }
          }
          
          cellContent = Array.from(uniqueCells.values()).map((c: any) => {
            let txt = c.subject || '';
            if (c.room && this.entityMode !== 'room') txt += '\n' + this.getDisplayName('room', c.room);
            if (c.students && (this.entityMode === 'teacher' || this.entityMode === 'room')) txt += '\n' + this.getDisplayName('class', c.students);
            if (c.teacher && (this.entityMode === 'class' || this.entityMode === 'room')) txt += '\n' + this.getDisplayName('teacher', c.teacher);
            return txt;
          }).join('\n---\n');
        } else if (cellData.cell) {
          let txt = cellData.cell.subject || '';
          if (cellData.cell.room && this.entityMode !== 'room') txt += '\n' + this.getDisplayName('room', cellData.cell.room);
          if (cellData.cell.students && (this.entityMode === 'teacher' || this.entityMode === 'room')) txt += '\n' + this.getDisplayName('class', cellData.cell.students);
          if (cellData.cell.teacher && (this.entityMode === 'class' || this.entityMode === 'room')) txt += '\n' + this.getDisplayName('teacher', cellData.cell.teacher);
          cellContent = txt;
        }
        
        // Add cell with colspan info
        const isEmpty = !cellContent || cellContent === '-' || cellContent.trim() === '';
        
        if (isEmpty && colspan > 1) {
          // Split empty cells with colspan > 1 into individual cells
          for (let k = 0; k < colspan; k++) {
            dayCells.push({
              content: '',
              colSpan: 1,
              isEmpty: true
            });
          }
        } else {
          // Keep non-empty cells with their original colspan
          dayCells.push({
            content: cellContent,
            colSpan: colspan,
            isEmpty: isEmpty
          });
        }
        
        hourIndex += colspan;
      }
      
      // Add cells in reverse order (RTL) with proper colspan
      for (let i = dayCells.length - 1; i >= 0; i--) {
        row.push({
          content: dayCells[i].content || '',
          colSpan: dayCells[i].colSpan,
          styles: dayCells[i].isEmpty ? { fillColor: [220, 220, 220] } : {}
        });
      }
      
      // Add day name at the end (rightmost column)
      row.push({
        content: String(pd.day || '').trim(),
        styles: { fontStyle: 'bold' }
      });
      
      body.push(row);
    }
    
    // Generate table
    autoTable(doc, {
      head: headers,
      body: body,
      startY: startY,
      styles: { 
        font: 'Amiri',
        fontSize: 8,
        cellPadding: 1.5,
        halign: 'center',
        valign: 'middle',
        lineWidth: 0.5,
        lineColor: [0, 0, 0],
        textColor: [0, 0, 0],
        fillColor: [255, 255, 255]
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 8,
        lineWidth: 0.5,
        lineColor: [0, 0, 0]
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        lineWidth: 0.5,
        lineColor: [0, 0, 0]
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255]
      },
      columnStyles: {
        [this.hoursList.length]: { // Last column (day name)
          fontStyle: 'bold', 
          fillColor: [255, 255, 255],
          fontSize: 11,
          font: 'Amiri',
          cellWidth: 20,
          overflow: 'visible',
          halign: 'center',
          lineWidth: 0.5,
          lineColor: [0, 0, 0],
          textColor: [0, 0, 0]
        }
      },
      tableLineWidth: 0.5,
      tableLineColor: [0, 0, 0],
      margin: { top: 35, left: 5, right: 5 },
      didDrawCell: function (data: any) {
        // Fill empty cells with gray
        if (data.section === 'body' && data.column.index < data.table.columns.length - 1) {
          const cellText = data.cell.text.join('').trim();
          if (!cellText || cellText === '' || cellText === '-') {
            doc.setFillColor(220, 220, 220);
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
          }
        }
      },
      didDrawPage: function (data: any) {
        // Disabled temporarily to avoid rect() errors
        // Will draw border after table is complete
      }
    });
    
    // Draw border around entire table AFTER autoTable is complete
    const autoTableFinalY = (doc as any).lastAutoTable?.finalY;
    if (autoTableFinalY && Number.isFinite(autoTableFinalY) && Number.isFinite(startY)) {
      const tableHeight = autoTableFinalY - startY;
      const tableWidth = (doc as any).lastAutoTable?.table?.width;
      const marginLeft = 5;
      
      if (Number.isFinite(tableWidth) && Number.isFinite(tableHeight) && 
          tableWidth > 0 && tableHeight > 0) {
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(marginLeft, startY, tableWidth, tableHeight);
      }
    }
    
    // Add supplementary info below the table
    let finalY = (doc as any).lastAutoTable.finalY + 10;
    const pageWidth = doc.internal.pageSize.width;
    
    if (this.entityMode === 'teacher') {
      const classes = this.getTeacherClasses(this.selectedEntity);
      if (classes.length > 0) {
        doc.setFontSize(12);
        doc.text('الأقسام المسندة:', pageWidth / 2, finalY, { align: 'center' });
        doc.setFontSize(10);
        // Apply renames to classes
        const renamedClasses = classes.map(cls => this.getDisplayName('class', cls));
        const classesText = renamedClasses.join('، ');
        const lines = doc.splitTextToSize(classesText, pageWidth - 20);
        doc.text(lines, pageWidth / 2, finalY + 7, { align: 'center' });
      }
    } else if (this.entityMode === 'class') {
      const subjects = this.getClassSubjectsAndTeachers(this.selectedEntity);
      
      if (subjects.length > 0) {
        doc.setFontSize(12);
        doc.text('المواد والأساتذة:', pageWidth / 2, finalY, { align: 'center' });
        
        // Create subjects table
        const subjectsHeaders = [['المادة', 'الأستاذ(ة)', 'المادة', 'الأستاذ(ة)', 'المادة', 'الأستاذ(ة)']];
        const subjectsBody: any[] = [];
        const rows = this.getClassSubjectsInRows(this.selectedEntity);
        
        for (const row of rows) {
          const pdfRow = [
            row[0]?.subject || '',
            row[0]?.teacher ? this.getDisplayName('teacher', row[0].teacher) : '',
            row[1]?.subject || '',
            row[1]?.teacher ? this.getDisplayName('teacher', row[1].teacher) : '',
            row[2]?.subject || '',
            row[2]?.teacher ? this.getDisplayName('teacher', row[2].teacher) : ''
          ];
          subjectsBody.push(pdfRow);
        }
        
        autoTable(doc, {
          head: subjectsHeaders,
          body: subjectsBody,
          startY: finalY + 8,
          styles: { 
            font: 'Amiri',
            fontSize: 8,
            cellPadding: 2,
            halign: 'center',
            lineWidth: 0.1,
            lineColor: [200, 200, 200]
          },
          headStyles: {
            fillColor: [102, 126, 234],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 9
          },
          alternateRowStyles: {
            fillColor: [248, 249, 250]
          },
          margin: { left: 10, right: 10 }
        });
      }
    }
    
    // Save PDF
    doc.save(`${this.selectedEntity}_جدول_الحصص.pdf`);
  }
  
  async exportAll() {
    if (!this.entityOptions || this.entityOptions.length === 0) {
      alert('لا توجد بيانات للتصدير');
      return;
    }

    const doc = new jsPDF('p', 'mm', 'a4'); // portrait
    await this.pdfFontsService.loadFonts(doc);
    doc.setFont('Amiri');
    
    for (let i = 0; i < this.entityOptions.length; i++) {
      const entity = this.entityOptions[i];
      
      if (i > 0) {
        doc.addPage();
      }
      
      // Temporarily set selected entity to generate data
      const originalEntity = this.selectedEntity;
      this.selectedEntity = entity;
      this.buildGridPreview();
      
      // Get subject if teacher mode
      let entitySubject = '';
      let displayEntityName = entity;
      
      if (this.entityMode === 'teacher') {
        const teacher = this.teachersList.find(t => t.name === entity);
        entitySubject = teacher?.subject || '';
        displayEntityName = this.getDisplayName('teacher', entity);
      } else if (this.entityMode === 'class') {
        displayEntityName = this.getDisplayName('class', entity);
      } else if (this.entityMode === 'room') {
        displayEntityName = this.getDisplayName('room', entity);
      }
      
      // Add header with logo and information
      const startY = await this.addPdfHeader(doc, displayEntityName, entitySubject);
      
      // Prepare table data - RTL order (hours first, then day at the end)
      const reversedHours = [...this.hoursList].reverse();
      // Inverse hour format: 09:30-08:30 instead of 08:30-09:30
      const formattedHours = reversedHours.map(h => {
        const parts = h.split('-');
        if (parts.length === 2) {
          return `${parts[1]}-${parts[0]}`;
        }
        return h;
      });
      const headers = [[...formattedHours, 'اليوم']];
      const body: any[] = [];
      
      for (const pd of this.processedDays) {
        const row: any[] = [];
        
        // Process cells for this day
        const dayCells: any[] = [];
        let hourIndex = 0;
        
        for (const cellData of pd.cells) {
          const colspan = cellData.colspan || 1;
          
          // Prepare cell content
          let cellContent = '';
          if (cellData.cells && cellData.cells.length > 0) {
            // Deduplicate cells with same content (for classes with multiple groups)
            const uniqueCells = new Map<string, any>();
            for (const c of cellData.cells) {
              const key = `${c.subject}|${c.room || ''}|${c.teacher || ''}`;
              if (!uniqueCells.has(key)) {
                uniqueCells.set(key, c);
              }
            }
            
            cellContent = Array.from(uniqueCells.values()).map((c: any) => {
              let txt = c.subject || '';
              if (c.room && this.entityMode !== 'room') txt += '\n' + this.getDisplayName('room', c.room);
              if (c.students && (this.entityMode === 'teacher' || this.entityMode === 'room')) txt += '\n' + this.getDisplayName('class', c.students);
              if (c.teacher && (this.entityMode === 'class' || this.entityMode === 'room')) txt += '\n' + this.getDisplayName('teacher', c.teacher);
              return txt;
            }).join('\n---\n');
          } else if (cellData.cell) {
            let txt = cellData.cell.subject || '';
            if (cellData.cell.room && this.entityMode !== 'room') txt += '\n' + this.getDisplayName('room', cellData.cell.room);
            if (cellData.cell.students && (this.entityMode === 'teacher' || this.entityMode === 'room')) txt += '\n' + this.getDisplayName('class', cellData.cell.students);
            if (cellData.cell.teacher && (this.entityMode === 'class' || this.entityMode === 'room')) txt += '\n' + this.getDisplayName('teacher', cellData.cell.teacher);
            cellContent = txt;
          }
          
          // Add cell with colspan info
          const isEmpty = !cellContent || cellContent === '-' || cellContent.trim() === '';
          
          if (isEmpty && colspan > 1) {
            // Split empty cells with colspan > 1 into individual cells
            for (let k = 0; k < colspan; k++) {
              dayCells.push({
                content: '',
                colSpan: 1,
                isEmpty: true
              });
            }
          } else {
            // Keep non-empty cells with their original colspan
            dayCells.push({
              content: cellContent,
              colSpan: colspan,
              isEmpty: isEmpty
            });
          }
          
          hourIndex += colspan;
        }
        
        // Add cells in reverse order (RTL) with proper colspan
        for (let i = dayCells.length - 1; i >= 0; i--) {
          row.push({
            content: dayCells[i].content || '',
            colSpan: dayCells[i].colSpan,
            styles: dayCells[i].isEmpty ? { fillColor: [220, 220, 220] } : {}
          });
        }
        
        // Add day name at the end (rightmost column)
        row.push({
          content: String(pd.day || '').trim(),
          styles: { fontStyle: 'bold' }
        });
        
        body.push(row);
      }

      // Generate table
      autoTable(doc, {
        head: headers,
        body: body,
        startY: startY,
        styles: { 
          font: 'Amiri',
          fontSize: 8,
          cellPadding: 1.5,
          halign: 'center',
          valign: 'middle',
          lineWidth: 0.5,
          lineColor: [0, 0, 0],
          textColor: [0, 0, 0],
          fillColor: [255, 255, 255]
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          fontSize: 8,
          lineWidth: 0.5,
          lineColor: [0, 0, 0]
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          lineWidth: 0.5,
          lineColor: [0, 0, 0]
        },
        alternateRowStyles: {
          fillColor: [255, 255, 255]
        },
        columnStyles: {
          [this.hoursList.length]: { // Last column (day name)
            fontStyle: 'bold', 
            fillColor: [255, 255, 255],
            fontSize: 11,
            font: 'Amiri',
            cellWidth: 20,
            overflow: 'visible',
            halign: 'center',
            lineWidth: 0.5,
            lineColor: [0, 0, 0],
            textColor: [0, 0, 0]
          }
        },
        tableLineWidth: 0.5,
        tableLineColor: [0, 0, 0],
        margin: { top: 35, left: 5, right: 5 },
        didDrawCell: function (data: any) {
          // Fill empty cells with gray
          if (data.section === 'body' && data.column.index < data.table.columns.length - 1) {
            const cellText = data.cell.text.join('').trim();
            if (!cellText || cellText === '' || cellText === '-') {
              doc.setFillColor(220, 220, 220);
              doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
            }
          }
        },
        didDrawPage: function (data: any) {
          // Disabled temporarily to avoid rect() errors
          // Will draw border after table is complete
        }
      });
      
      // Draw border around entire table AFTER autoTable is complete
      const autoTableFinalY = (doc as any).lastAutoTable?.finalY;
      if (autoTableFinalY && Number.isFinite(autoTableFinalY) && Number.isFinite(startY)) {
        const tableHeight = autoTableFinalY - startY;
        const tableWidth = (doc as any).lastAutoTable?.table?.width;
        const marginLeft = 5;
        
        if (Number.isFinite(tableWidth) && Number.isFinite(tableHeight) && 
            tableWidth > 0 && tableHeight > 0) {
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.5);
          doc.rect(marginLeft, startY, tableWidth, tableHeight);
        }
      }
      
      // Add supplementary info
      let finalY = (doc as any).lastAutoTable.finalY + 10;
      const pageWidth = doc.internal.pageSize.width;
      
      if (this.entityMode === 'teacher') {
        const classes = this.getTeacherClasses(entity);
        if (classes.length > 0) {
          doc.setFontSize(12);
          doc.text('الأقسام المسندة:', pageWidth / 2, finalY, { align: 'center' });
          doc.setFontSize(10);
          // Apply renames to classes
          const renamedClasses = classes.map(cls => this.getDisplayName('class', cls));
          const classesText = renamedClasses.join('، ');
          const lines = doc.splitTextToSize(classesText, pageWidth - 20);
          doc.text(lines, pageWidth / 2, finalY + 7, { align: 'center' });
        }
      } else if (this.entityMode === 'class') {
        const subjects = this.getClassSubjectsAndTeachers(entity);
        
        if (subjects.length > 0) {
          doc.setFontSize(12);
          doc.text('المواد والأساتذة:', pageWidth / 2, finalY, { align: 'center' });
          
          const subjectsHeaders = [['المادة', 'الأستاذ(ة)', 'المادة', 'الأستاذ(ة)', 'المادة', 'الأستاذ(ة)']];
          const subjectsBody: any[] = [];
          const rows = this.getClassSubjectsInRows(entity);
          
          for (const row of rows) {
            const pdfRow = [
              row[0]?.subject || '',
              row[0]?.teacher ? this.getDisplayName('teacher', row[0].teacher) : '',
              row[1]?.subject || '',
              row[1]?.teacher ? this.getDisplayName('teacher', row[1].teacher) : '',
              row[2]?.subject || '',
              row[2]?.teacher ? this.getDisplayName('teacher', row[2].teacher) : ''
            ];
            subjectsBody.push(pdfRow);
          }
          
          autoTable(doc, {
            head: subjectsHeaders,
            body: subjectsBody,
            startY: finalY + 8,
            styles: { 
              font: 'Amiri',
              fontSize: 8,
              cellPadding: 2,
              halign: 'center',
              lineWidth: 0.1,
              lineColor: [200, 200, 200]
            },
            headStyles: {
              fillColor: [102, 126, 234],
              textColor: 255,
              fontStyle: 'bold',
              fontSize: 9
            },
            alternateRowStyles: {
              fillColor: [248, 249, 250]
            },
            margin: { left: 10, right: 10 }
          });
        }
      }
      
      // Restore original entity
      this.selectedEntity = originalEntity;
    }
    
    this.buildGridPreview(); // Restore original view
    
    // Save PDF
    const modeLabel = this.entityMode === 'teacher' ? 'الأساتذة' : (this.entityMode === 'class' ? 'الأقسام' : 'القاعات');
    doc.save(`جداول_الحصص_${modeLabel}.pdf`);
  }
  
  async exportVacantRoomsPdf() {
    if (!this.vacantRoomsData || this.vacantRoomsData.length === 0) {
      alert('لا توجد بيانات القاعات الشاغرة');
      return;
    }
    
    const doc = new jsPDF('p', 'mm', 'a4'); // portrait, A4
    await this.pdfFontsService.loadFonts(doc);
    doc.setFont('Amiri');
    
    const pageWidth = doc.internal.pageSize.width;
    const margin = 5;
    
    // Title without logo/header
    doc.setFontSize(14);
    doc.setFont('Amiri', 'bold');
    doc.text('القاعات الشاغرة', pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(11);
    doc.text(`الموسم الدراسي ${this.config.schoolYear}`, pageWidth / 2, 22, { align: 'center' });
    
    // Prepare table data
    const reversedHours = [...this.hoursList].reverse();
    const formattedHours = reversedHours.map(h => {
      const parts = h.split('-');
      if (parts.length === 2) {
        return `${parts[1].trim()}-${parts[0].trim()}`;
      }
      return h;
    });
    
    const headers = [[...formattedHours, 'اليوم']];
    const body: any[] = [];
    
    // Build table body from vacantRoomsData
    for (const dayData of this.vacantRoomsData) {
      const row: any[] = [];
      
      // Reverse cells for RTL
      const reversedCells = [...dayData.cells].reverse();
      
      for (const cell of reversedCells) {
        let cellContent = '';
        let cellColor: number[] = [255, 255, 255]; // white by default
        
        if (cell.isFreeHalfDay) {
          cellContent = '---';
          cellColor = [230, 230, 230]; // light gray
        } else if (cell.count === -1) {
          // Half-day free
          cellContent = '---';
          cellColor = [230, 230, 230];
        } else if (cell.count === 0) {
          cellContent = '0';
          cellColor = [255, 200, 200]; // light red
        } else {
          // Show room names with renames applied
          const renamedRooms = (cell.rooms || []).map((room: string) => this.getDisplayName('room', room));
          cellContent = `${cell.count}\n${renamedRooms.join('\n')}`;
          cellColor = [200, 255, 200]; // light green
        }
        
        row.push({
          content: cellContent,
          colSpan: cell.colspan || 1,
          styles: { fillColor: cellColor }
        });
      }
      
      // Add day name at the end
      row.push({
        content: dayData.day,
        styles: { 
          fontStyle: 'bold', 
          fillColor: [255, 255, 255],
          halign: 'center',
          valign: 'middle'
        }
      });
      
      body.push(row);
    }
    
    // Generate table
    autoTable(doc, {
      head: headers,
      body: body,
      startY: 28,
      styles: {
        font: 'Amiri',
        fontSize: 7,
        cellPadding: 1,
        halign: 'center',
        valign: 'middle',
        lineWidth: 0.5,
        lineColor: [0, 0, 0],
        textColor: [0, 0, 0]
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 8,
        lineWidth: 0.5,
        lineColor: [0, 0, 0]
      },
      columnStyles: {
        [this.hoursList.length]: {
          fontStyle: 'bold',
          fillColor: [255, 255, 255],
          fontSize: 11,
          font: 'Amiri',
          cellWidth: 22,
          cellPadding: 2,
          halign: 'center',
          valign: 'middle',
          lineWidth: 0.5,
          lineColor: [0, 0, 0]
        }
      },
      tableLineWidth: 0.5,
      tableLineColor: [0, 0, 0],
      margin: { top: 28, left: margin, right: margin }
    });
    
    // Draw border around table
    const autoTableFinalY = (doc as any).lastAutoTable?.finalY;
    if (autoTableFinalY && Number.isFinite(autoTableFinalY)) {
      const tableHeight = autoTableFinalY - 28;
      const tableWidth = (doc as any).lastAutoTable?.table?.width;
      
      if (Number.isFinite(tableWidth) && tableWidth > 0 && tableHeight > 0) {
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(margin, 28, tableWidth, tableHeight);
      }
    }
    
    // Save PDF
    doc.save('القاعات_الشاغرة.pdf');
  }
  
  async exportPdfA3() {
    if (!this.globalViewData || this.globalViewData.length === 0) {
      alert('لا توجد بيانات للتصدير');
      return;
    }
    
    const doc = new jsPDF('l', 'mm', 'a3'); // landscape, A3
    await this.pdfFontsService.loadFonts(doc);
    doc.setFont('Amiri');
    
    const pageWidth = doc.internal.pageSize.width;
    const margin = 5;
    
    // Title
    doc.setFontSize(14);
    doc.setFont('Amiri', 'bold');
    const titleText = this.globalViewOption === 'teachersByDay' 
      ? 'جدول الحصص الشامل - الأساتذة حسب الأيام' 
      : 'جدول الحصص الشامل - الأيام حسب الأساتذة';
    doc.text(titleText, pageWidth / 2, 12, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`الموسم الدراسي ${this.config.schoolYear}`, pageWidth / 2, 18, { align: 'center' });
    
    if (this.globalViewOption === 'teachersByDay') {
      // Option 1: Teachers as rows, Days/Periods/Hours as columns
      await this.exportTeachersByDayA3(doc);
    } else {
      // Option 2: Days/Hours as rows, Teachers as columns
      await this.exportDaysByTeacherA3(doc);
    }
    
    // Save PDF
    doc.save('جدول_الحصص_الشامل_A3.pdf');
  }
  
  async exportTeachersByDayA3(doc: any) {
    const dayNames = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].reverse(); // RTL: right to left
    const periodNames = ['صباح', 'مساء'].reverse(); // Afternoon first (right), then morning (left)
    const hourNumbers = ['1', '2', '3', '4'].reverse(); // Hours reversed: 4, 3, 2, 1
    
    // Build headers - Teacher column moved to the RIGHT
    const headerRow1: any[] = [];
    const headerRow2: any[] = [];
    const headerRow3: any[] = [];
    
    // Add day headers (each day has 8 columns: 4 morning + 4 afternoon) - RTL order
    for (const day of dayNames) {
      headerRow1.push({ content: day, colSpan: 8, styles: { halign: 'center' } });
    }
    
    // Add period headers (each period has 4 hours) - RTL order
    for (let d = 0; d < 6; d++) {
      for (const period of periodNames) {
        headerRow2.push({ content: period, colSpan: 4, styles: { halign: 'center' } });
      }
    }
    
    // Add hour numbers (4, 3, 2, 1 repeated for each period) - RTL order
    for (let d = 0; d < 6; d++) {
      for (let p = 0; p < 2; p++) {
        for (const hour of hourNumbers) {
          headerRow3.push({ content: hour, styles: { halign: 'center' } });
        }
      }
    }
    
    // Add teacher column at the END (rightmost)
    headerRow1.push({ content: 'الأستاذ(ة)', rowSpan: 3, styles: { halign: 'center', valign: 'middle' } });
    
    const headers = [headerRow1, headerRow2, headerRow3];
    const body: any[] = [];
    
    // Build body: each teacher is a row
    for (const teacherData of this.globalViewData) {
      const row: any[] = [];
      
      // Add slots in REVERSE order for RTL (48 slots: 6 days × 8 hours)
      const reversedSlots = [...teacherData.slots].reverse();
      for (const slot of reversedSlots) {
        let cellContent = '';
        let cellColor: number[] = [255, 255, 255];
        
        if (slot.activity) {
          const parts: string[] = [];
          if (slot.activity.subject) parts.push(slot.activity.subject);
          if (slot.activity.students) parts.push(this.getDisplayName('class', slot.activity.students));
          if (slot.activity.room) parts.push(this.getDisplayName('room', slot.activity.room));
          cellContent = parts.join('\n');
          cellColor = [230, 240, 255]; // light blue
        }
        
        row.push({
          content: cellContent,
          colSpan: slot.colspan || 1,
          styles: { 
            fillColor: cellColor,
            fontSize: 6,
            cellPadding: 0.5,
            halign: 'center',
            valign: 'middle'
          }
        });
      }
      
      // Add teacher name at the END (rightmost column)
      const displayName = this.getDisplayName('teacher', teacherData.teacher);
      row.push({ content: displayName, styles: { fontStyle: 'bold', halign: 'center', valign: 'middle' } });
      
      body.push(row);
    }
    
    // Generate table
    autoTable(doc, {
      head: headers,
      body: body,
      startY: 22,
      styles: {
        font: 'Amiri',
        fontSize: 6,
        cellPadding: 0.5,
        halign: 'center',
        valign: 'middle',
        lineWidth: 0.3,
        lineColor: [0, 0, 0],
        textColor: [0, 0, 0]
      },
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 7,
        lineWidth: 0.3,
        lineColor: [0, 0, 0]
      },
      tableLineWidth: 0.5,
      tableLineColor: [0, 0, 0],
      margin: { top: 22, left: 5, right: 5 }
    });
  }
  
  async exportDaysByTeacherA3(doc: any) {
    const dayLabels: any = {
      'lundi': 'الاثنين',
      'mardi': 'الثلاثاء',
      'mercredi': 'الأربعاء',
      'jeudi': 'الخميس',
      'vendredi': 'الجمعة',
      'samedi': 'السبت'
    };
    
    // Build headers: Teachers first (RTL), then Day/Period/Hour at the right
    const headerRow: any[] = [];
    
    // Add teacher names in REVERSE order for RTL
    const reversedTeachers = [...this.selectedTeachersForGlobal].reverse();
    for (const teacher of reversedTeachers) {
      const displayName = this.getDisplayName('teacher', teacher.name);
      headerRow.push({ content: displayName, styles: { halign: 'center', fontSize: 7 } });
    }
    
    // Add Day/Period/Hour columns at the END (rightmost)
    headerRow.push({ content: 'اليوم', colSpan: 1, styles: { halign: 'center', valign: 'middle' } });
    headerRow.push({ content: 'الفترة', colSpan: 1, styles: { halign: 'center', valign: 'middle' } });
    headerRow.push({ content: 'الساعة', colSpan: 1, styles: { halign: 'center', valign: 'middle' } });
    
    const headers = [headerRow];
    const body: any[] = [];
    
    // Build body: each hour is a row
    for (const dayData of this.globalViewData) {
      for (const periodData of dayData.periods) {
        for (let hourIndex = 0; hourIndex < periodData.hours.length; hourIndex++) {
          const hourData = periodData.hours[hourIndex];
          const row: any[] = [];
          
          // Teacher activities FIRST (in REVERSE order for RTL)
          const reversedTeacherSlots = [...hourData.teachers].reverse();
          for (const slotData of reversedTeacherSlots) {
            if (slotData.hidden) continue;
            
            let cellContent = '';
            let cellColor: number[] = [255, 255, 255];
            
            if (slotData.activity) {
              const parts: string[] = [];
              if (slotData.activity.subject) parts.push(slotData.activity.subject);
              if (slotData.activity.students) parts.push(this.getDisplayName('class', slotData.activity.students));
              if (slotData.activity.room) parts.push(this.getDisplayName('room', slotData.activity.room));
              cellContent = parts.join('\n');
              cellColor = [230, 240, 255]; // light blue
            }
            
            row.push({
              content: cellContent,
              rowSpan: slotData.rowspan || 1,
              styles: { 
                fillColor: cellColor,
                fontSize: 6,
                cellPadding: 0.5,
                halign: 'center',
                valign: 'middle'
              }
            });
          }
          
          // Add Day/Period/Hour columns at the END (rightmost)
          // Day column (with rowspan for first hour of first period)
          if (periodData.periodIndex === 0 && hourIndex === 0) {
            row.push({ 
              content: dayLabels[dayData.day] || dayData.day, 
              rowSpan: 8, 
              styles: { fontStyle: 'bold', halign: 'center', valign: 'middle' } 
            });
          }
          
          // Period column (with rowspan for first hour of period)
          if (hourIndex === 0) {
            row.push({ 
              content: periodData.period === 'صباح' ? 'صباح' : 'مساء', 
              rowSpan: 4, 
              styles: { halign: 'center', valign: 'middle' } 
            });
          }
          
          // Hour number
          row.push({ content: `${hourIndex + 1}`, styles: { halign: 'center' } });
          
          body.push(row);
        }
      }
    }
    
    // Generate table
    autoTable(doc, {
      head: headers,
      body: body,
      startY: 22,
      styles: {
        font: 'Amiri',
        fontSize: 6,
        cellPadding: 0.5,
        halign: 'center',
        valign: 'middle',
        lineWidth: 0.3,
        lineColor: [0, 0, 0],
        textColor: [0, 0, 0]
      },
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 7,
        lineWidth: 0.3,
        lineColor: [0, 0, 0]
      },
      columnStyles: {
        // Day/Period/Hour columns are now at the END
        [this.selectedTeachersForGlobal.length]: { cellWidth: 15, fontStyle: 'bold' }, // Day column
        [this.selectedTeachersForGlobal.length + 1]: { cellWidth: 15 }, // Period column
        [this.selectedTeachersForGlobal.length + 2]: { cellWidth: 8 } // Hour column
      },
      tableLineWidth: 0.5,
      tableLineColor: [0, 0, 0],
      margin: { top: 22, left: 5, right: 5 }
    });
  }

  // Get classes taught by a teacher
  getTeacherClasses(teacherName: string): string[] {
    const teacher = this.parsed?.teachers?.find((t: any) => t.name === teacherName);
    if (!teacher) return [];
    
    const classesSet = new Set<string>();
    for (const day of teacher.days || []) {
      for (const hour of day.hours || []) {
        if (hour.students) {

          // Remove group suffix (:G1, :G2, _G1, _G2, etc.) to avoid duplicates
          let baseName = hour.students;
          
          // Check for :G pattern (like 2APIC-5:G1)
          if (baseName.includes(':G')) {
            baseName = baseName.substring(0, baseName.lastIndexOf(':G'));
          }
          // Check for _G pattern (like 2APIC-5_G1)
          else if (baseName.includes('_G')) {
            baseName = baseName.substring(0, baseName.lastIndexOf('_G'));
          }
          
          classesSet.add(baseName);
        }
      }
    }
    return Array.from(classesSet).sort();
  }
  
  // Get subjects and teachers for a class
  getClassSubjectsAndTeachers(className: string): { subject: string, teacher: string }[] {
    const subjectsMap = new Map<string, string>();
    
    // Search through all teachers
    for (const teacher of this.parsed?.teachers || []) {
      for (const day of teacher.days || []) {
        for (const hour of day.hours || []) {
          if (hour.students && hour.subject) {
            // Check if it's an exact match or a group (className:G1, className_G1, etc.)
            const matchesExact = hour.students === className;
            const matchesGroup = hour.students.startsWith(className + ':') || 
                                 hour.students.startsWith(className + '_');
            
            if (matchesExact || matchesGroup) {
              // Store unique subject-teacher pairs
              if (!subjectsMap.has(hour.subject)) {
                subjectsMap.set(hour.subject, teacher.name);
              }
            }
          }
        }
      }
    }
    
    return Array.from(subjectsMap.entries())
      .map(([subject, teacher]) => ({ subject, teacher }))
      .sort((a, b) => a.subject.localeCompare(b.subject, 'ar'));
  }
  
  // Get subjects and teachers chunked into groups for multi-column display
  getClassSubjectsChunked(className: string): { subject: string, teacher: string }[][] {
    const allSubjects = this.getClassSubjectsAndTeachers(className);
    const chunkSize = 4; // 4 rows per column to match reference image
    const chunks: { subject: string, teacher: string }[][] = [];
    
    for (let i = 0; i < allSubjects.length; i += chunkSize) {
      const chunk = allSubjects.slice(i, i + chunkSize);
      
      // Pad with empty rows to always have chunkSize rows
      while (chunk.length < chunkSize) {
        chunk.push({ subject: '', teacher: '' });
      }
      
      chunks.push(chunk);
    }
    
    return chunks;
  }
  
  // Get subjects and teachers organized in rows with 3 pairs per row
  getClassSubjectsInRows(className: string): Array<Array<{ subject: string, teacher: string } | null>> {
    const allSubjects = this.getClassSubjectsAndTeachers(className);
    const itemsPerRow = 3; // 3 pairs (teacher/subject) per row
    const rows: Array<Array<{ subject: string, teacher: string } | null>> = [];
    
    for (let i = 0; i < allSubjects.length; i += itemsPerRow) {
      const row: Array<{ subject: string, teacher: string } | null> = [];
      for (let j = 0; j < itemsPerRow; j++) {
        row.push(allSubjects[i + j] || null);
      }
      rows.push(row);
    }
    
    return rows;
  }

  // helper used by the template to find the hour cell for a given day
  getCell(day: any, hour: string) {
    if (!day || !Array.isArray(day.hours)) return null;
    return day.hours.find((h: any) => h.hour === hour) || null;
  }

  // processedDays: array of { day, cells: [{ cell|null, colspan }] }
  processedDays: any[] = [];

  // computed options for the single dynamic selector (for classes and rooms only)
  get entityOptions(): string[] {
    if (this.entityMode === 'teacher') {
      // Return original teacher names (not renamed) for processing
      return (this.teachersList || []).map(t => t.name);
    }
    if (this.entityMode === 'class') {
      // Return original class names (not renamed) for processing
      return this.classesList || [];
    }
    if (this.entityMode === 'room') {
      // Return original room names (not renamed) for processing
      return this.roomsList || [];
    }
    return [];
  }

  buildGridPreview() {
    this.processedDays = [];
    
    // If no entity selected, don't show anything
    if (!this.selectedEntity) {
      return;
    }

    let sourcesData: any[] = [];

    // Find the selected entity data based on mode
    if (this.entityMode === 'teacher') {
      // Extract teacher name from "Name - Subject" format
      const teacherName = this.selectedEntity.includes(' - ') 
        ? this.selectedEntity.split(' - ')[0] 
        : this.selectedEntity;
      
      const teacher = this.parsed?.teachers?.find((t: any) => 
        (t.name || t['@name'] || t) === teacherName
      );
      if (teacher) sourcesData = [teacher];
    } else if (this.entityMode === 'class') {
      // Find all subgroups that match the selected base name
      // e.g., if selectedEntity is "3APIC-3", find "3APIC-3", "3APIC-3:G1", "3APIC-3:G2"
      sourcesData = (this.parsed?.subgroups || []).filter((s: any) => {
        const fullName = s.name || s['@name'] || '';
        const baseName = fullName.includes(':') ? fullName.split(':')[0] : fullName;
        return baseName === this.selectedEntity;
      });
    } else if (this.entityMode === 'room') {
      // Build timetable for the selected room from all activities
      const roomTimetable = this.buildRoomTimetable(this.selectedEntity);
      if (roomTimetable) sourcesData = [roomTimetable];
    }

    if (!sourcesData || sourcesData.length === 0) {
      return;
    }

    // Define time slots with real hours
    // H1-H4 for morning (matin): 08:30-09:30, 09:30-10:30, 10:30-11:30, 11:30-12:30
    // H1-H4 for afternoon (soir): 14:30-15:30, 15:30-16:30, 16:30-17:30, 17:30-18:30
    const morningHours = [
      { code: 'H1', label: '08:30 - 09:30' },
      { code: 'H2', label: '09:30 - 10:30' },
      { code: 'H3', label: '10:30 - 11:30' },
      { code: 'H4', label: '11:30 - 12:30' }
    ];
    const afternoonHours = [
      { code: 'H1', label: '14:30 - 15:30' },
      { code: 'H2', label: '15:30 - 16:30' },
      { code: 'H3', label: '16:30 - 17:30' },
      { code: 'H4', label: '17:30 - 18:30' }
    ];
    
    // Combine all hours for display
    this.hoursList = [...morningHours.map(h => h.label), ...afternoonHours.map(h => h.label)];

    const keyOf = (c: any) => (c ? `${c.subject || ''}::${c.room || ''}::${c.teacher || ''}::${c.students || ''}` : '__EMPTY__');

    // Group days by base name (lundi_m + lundi_s = lundi)
    const dayGroups = new Map<string, { morning: any, afternoon: any }>();
    const dayOrder = ['lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const dayLabels: any = {
      'lundi': 'الإثنين',
      'Mardi': 'الثلاثاء',
      'Mercredi': 'الأربعاء',
      'Jeudi': 'الخميس',
      'Vendredi': 'الجمعة',
      'Samedi': 'السبت'
    };

    // Initialize all days (even if empty)
    for (const baseDayName of dayOrder) {
      dayGroups.set(baseDayName, { morning: null, afternoon: null });
    }

    // Merge days from all sources (for classes with multiple groups like G1, G2)
    for (const sourceData of sourcesData) {
      if (!sourceData.days || !sourceData.days.length) continue;
      
      const sourceName = sourceData.name || sourceData['@name'] || '';
      const groupSuffix = sourceName.includes(':') ? sourceName.split(':')[1] : '';
      
      for (const d of sourceData.days) {
        const dayName = d.day || '';
        let baseDay = '';
        let period = '';
        
        if (dayName.endsWith('_m')) {
          baseDay = dayName.replace('_m', '');
          period = 'morning';
        } else if (dayName.endsWith('_s')) {
          baseDay = dayName.replace('_s', '');
          period = 'afternoon';
        }
        if (!dayGroups.has(baseDay)) {
          dayGroups.set(baseDay, { morning: null, afternoon: null });
        }
        
        const group = dayGroups.get(baseDay)!;
        if (period === 'morning') {
          // Merge hours from multiple sources
          if (!group.morning) {
            group.morning = { day: dayName, hours: [] };
          }
          // Add group suffix to each hour if it exists
          const hoursWithGroup = (d.hours || []).map((h: any) => ({
            ...h,
            groupSuffix: groupSuffix || ''
          }));
          group.morning.hours.push(...hoursWithGroup);
        } else if (period === 'afternoon') {
          if (!group.afternoon) {
            group.afternoon = { day: dayName, hours: [] };
          }
          const hoursWithGroup = (d.hours || []).map((h: any) => ({
            ...h,
            groupSuffix: groupSuffix || ''
          }));
          group.afternoon.hours.push(...hoursWithGroup);
        }
      }
    }

    // Build grid for each day (all 6 days, even if empty)
    for (const baseDayName of dayOrder) {
      const group = dayGroups.get(baseDayName);
      // Always include the day even if no data
      if (!group) {
        // Create empty day with all cells empty
        const cells: any[] = [];
        for (let i = 0; i < 8; i++) { // 4 morning + 4 afternoon
          cells.push({ cell: null, colspan: 1 });
        }
        this.processedDays.push({ day: dayLabels[baseDayName] || baseDayName, cells });
        continue;
      }

      // Create maps for morning and afternoon hours (array of hours per time slot)
      const morningMap = new Map<string, any[]>();
      const afternoonMap = new Map<string, any[]>();
      
      if (group.morning) {
        for (const h of group.morning.hours || []) {
          if (h && h.hour) {
            if (!morningMap.has(h.hour)) {
              morningMap.set(h.hour, []);
            }
            morningMap.get(h.hour)!.push(h);
          }
        }
      }
      
      if (group.afternoon) {
        for (const h of group.afternoon.hours || []) {
          if (h && h.hour) {
            if (!afternoonMap.has(h.hour)) {
              afternoonMap.set(h.hour, []);
            }
            afternoonMap.get(h.hour)!.push(h);
          }
        }
      }

      const cells: any[] = [];
      
      // Process morning hours (H1-H4)
      let i = 0;
      while (i < morningHours.length) {
        const hourCode = morningHours[i].code;
        let cellsAtHour = morningMap.get(hourCode) || [];
        
        if (cellsAtHour.length === 0) {
          cells.push({ cell: null, cells: [], colspan: 1 });
          i++;
          continue;
        }

        // For now, use the first cell for colspan calculation
        // In the template, we'll display all cells
        let colspan = 1;
        const baseKey = keyOf(cellsAtHour[0]);
        let j = i + 1;
        while (j < morningHours.length) {
          const nextCode = morningHours[j].code;
          const nextCells = morningMap.get(nextCode) || [];
          if (nextCells.length === 0) break;
          if (keyOf(nextCells[0]) !== baseKey) break;
          colspan++;
          j++;
        }

        cells.push({ cell: cellsAtHour[0], cells: cellsAtHour, colspan });
        i = j;
      }
      
      // Process afternoon hours (H1-H4)
      i = 0;
      while (i < afternoonHours.length) {
        const hourCode = afternoonHours[i].code;
        let cellsAtHour = afternoonMap.get(hourCode) || [];
        
        if (cellsAtHour.length === 0) {
          cells.push({ cell: null, cells: [], colspan: 1 });
          i++;
          continue;
        }

        let colspan = 1;
        const baseKey = keyOf(cellsAtHour[0]);
        let j = i + 1;
        while (j < afternoonHours.length) {
          const nextCode = afternoonHours[j].code;
          const nextCells = afternoonMap.get(nextCode) || [];
          if (nextCells.length === 0) break;
          if (keyOf(nextCells[0]) !== baseKey) break;
          colspan++;
          j++;
        }

        cells.push({ cell: cellsAtHour[0], cells: cellsAtHour, colspan });
        i = j;
      }

      this.processedDays.push({ day: dayLabels[baseDayName] || baseDayName, cells });
    }
  }

  // Check if all cells in the array are identical (same subject, teacher, room)
  areAllCellsIdentical(cells: any[]): boolean {
    if (!cells || cells.length <= 1) return true;
    
    const first = cells[0];
    const firstKey = `${first.subject || ''}::${first.teacher || ''}::${first.room || ''}`;
    
    for (let i = 1; i < cells.length; i++) {
      const current = cells[i];
      const currentKey = `${current.subject || ''}::${current.teacher || ''}::${current.room || ''}`;
      if (currentKey !== firstKey) return false;
    }
    
    return true;
  }

  // Build timetable for a specific room from all activities
  buildRoomTimetable(roomName: string): any {
    const dayMap = new Map<string, any[]>();
    
    // Collect all activities from teachers
    for (const teacher of (this.parsed?.teachers || [])) {
      for (const day of (teacher.days || [])) {
        for (const hour of (day.hours || [])) {
          if (hour.room === roomName) {
            if (!dayMap.has(day.day)) {
              dayMap.set(day.day, []);
            }
            dayMap.get(day.day)!.push({
              hour: hour.hour,
              subject: hour.subject,
              teacher: teacher.name || teacher['@name'],
              students: hour.students,
              room: roomName
            });
          }
        }
      }
    }
    
    // Collect all activities from subgroups
    for (const subgroup of (this.parsed?.subgroups || [])) {
      for (const day of (subgroup.days || [])) {
        for (const hour of (day.hours || [])) {
          if (hour.room === roomName) {
            if (!dayMap.has(day.day)) {
              dayMap.set(day.day, []);
            }
            dayMap.get(day.day)!.push({
              hour: hour.hour,
              subject: hour.subject,
              teacher: hour.teacher,
              students: subgroup.name || subgroup['@name'],
              room: roomName
            });
          }
        }
      }
    }
    
    // Convert map to days array
    const days = Array.from(dayMap.entries()).map(([day, hours]) => ({
      day,
      hours
    }));
    
    return { name: roomName, days };
  }

  // Build vacant rooms data (days x hours with list of vacant rooms in each cell)
  buildVacantRoomsData() {
    this.vacantRoomsData = [];
    
    if (!this.parsed || !this.roomsList || this.roomsList.length === 0) {
      return;
    }
    
    // Define time slots with real hours
    const morningHours = [
      { code: 'H1', label: '08:30 - 09:30', start: '08:30', end: '09:30' },
      { code: 'H2', label: '09:30 - 10:30', start: '09:30', end: '10:30' },
      { code: 'H3', label: '10:30 - 11:30', start: '10:30', end: '11:30' },
      { code: 'H4', label: '11:30 - 12:30', start: '11:30', end: '12:30' }
    ];
    const afternoonHours = [
      { code: 'H1', label: '14:30 - 15:30', start: '14:30', end: '15:30' },
      { code: 'H2', label: '15:30 - 16:30', start: '15:30', end: '16:30' },
      { code: 'H3', label: '16:30 - 17:30', start: '16:30', end: '17:30' },
      { code: 'H4', label: '17:30 - 18:30', start: '17:30', end: '18:30' }
    ];
    
    this.hoursList = [...morningHours.map(h => h.label), ...afternoonHours.map(h => h.label)];
    
    const dayOrder = ['lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const dayLabels: any = {
      'lundi': 'الإثنين',
      'Mardi': 'الثلاثاء',
      'Mercredi': 'الأربعاء',
      'Jeudi': 'الخميس',
      'Vendredi': 'الجمعة',
      'Samedi': 'السبت'
    };
    
    // Build occupancy map: key = "day_period_hour", value = Set of occupied rooms
    const occupancyMap = new Map<string, Set<string>>();
    
    // Check all teachers
    for (const teacher of (this.parsed?.teachers || [])) {
      for (const day of (teacher.days || [])) {
        for (const hour of (day.hours || [])) {
          if (hour.room) {
            const key = `${day.day}_${hour.hour}`;
            if (!occupancyMap.has(key)) {
              occupancyMap.set(key, new Set());
            }
            occupancyMap.get(key)!.add(hour.room);
          }
        }
      }
    }
    
    // Check all subgroups
    for (const subgroup of (this.parsed?.subgroups || [])) {
      for (const day of (subgroup.days || [])) {
        for (const hour of (day.hours || [])) {
          if (hour.room) {
            const key = `${day.day}_${hour.hour}`;
            if (!occupancyMap.has(key)) {
              occupancyMap.set(key, new Set());
            }
            occupancyMap.get(key)!.add(hour.room);
          }
        }
      }
    }
    
    // Build grid: for each day, for each hour, list vacant rooms
    for (const baseDayName of dayOrder) {
      const rawCells: any[] = [];
      
      // Collect all cells data first (morning + afternoon)
      // Process morning hours (H1-H4)
      for (const hour of morningHours) {
        const key = `${baseDayName}_m_${hour.code}`;
        const occupiedRooms = occupancyMap.get(key) || new Set();
        const vacantRooms = this.roomsList.filter(room => !occupiedRooms.has(room));
        const isFreeHalfDay = occupiedRooms.size === 0;
        
        rawCells.push({ 
          rooms: isFreeHalfDay ? [] : vacantRooms, 
          count: isFreeHalfDay ? -1 : vacantRooms.length,
          isFreeHalfDay: isFreeHalfDay,
          period: 'morning'
        });
      }
      
      // Process afternoon hours (H1-H4)
      for (const hour of afternoonHours) {
        const key = `${baseDayName}_s_${hour.code}`;
        const occupiedRooms = occupancyMap.get(key) || new Set();
        const vacantRooms = this.roomsList.filter(room => !occupiedRooms.has(room));
        const isFreeHalfDay = occupiedRooms.size === 0;
        
        rawCells.push({ 
          rooms: isFreeHalfDay ? [] : vacantRooms, 
          count: isFreeHalfDay ? -1 : vacantRooms.length,
          isFreeHalfDay: isFreeHalfDay,
          period: 'afternoon'
        });
      }
      
      // Merge adjacent cells with same rooms (within same period)
      const mergedCells: any[] = [];
      let i = 0;
      while (i < rawCells.length) {
        const currentCell = rawCells[i];
        const currentPeriod = currentCell.period;
        const currentKey = this.getRoomsKey(currentCell.rooms);
        
        let colspan = 1;
        let j = i + 1;
        
        // Check how many consecutive cells have the same rooms in the same period
        while (j < rawCells.length && rawCells[j].period === currentPeriod) {
          const nextKey = this.getRoomsKey(rawCells[j].rooms);
          if (nextKey !== currentKey) break;
          colspan++;
          j++;
        }
        
        mergedCells.push({ ...currentCell, colspan });
        i = j;
      }
      
      this.vacantRoomsData.push({ 
        day: dayLabels[baseDayName] || baseDayName, 
        cells: mergedCells
      });
    }
  }

  // Helper to create a unique key from rooms array for comparison
  private getRoomsKey(rooms: string[]): string {
    if (!rooms || rooms.length === 0) return '__EMPTY__';
    return rooms.sort().join('::');
  }

  // Get hour label from hour code (e.g., "lundi_m_H1" -> "08:30 - 09:30")
  getHourLabel(hourCode: string): string {
    if (!hourCode) return '';
    
    // Extract the hour part (H1, H2, H3, H4)
    const parts = hourCode.split('_');
    if (parts.length < 3) return hourCode;
    
    const period = parts[1]; // 'm' or 's'
    const hourNum = parts[2]; // 'H1', 'H2', 'H3', 'H4'
    
    const hourMap: any = {
      'm': {
        'H1': '08:30 - 09:30',
        'H2': '09:30 - 10:30',
        'H3': '10:30 - 11:30',
        'H4': '11:30 - 12:30'
      },
      's': {
        'H1': '14:30 - 15:30',
        'H2': '15:30 - 16:30',
        'H3': '16:30 - 17:30',
        'H4': '17:30 - 18:30'
      }
    };
    
    return hourMap[period]?.[hourNum] || hourCode;
  }

  // Merge identical adjacent horizontal slots within same period (4 hours each)
  mergeHorizontalSlots(slots: any[]): any[] {
    const result: any[] = [];
    let i = 0;
    
    while (i < slots.length) {
      const slot = slots[i];
      
      // If slot is empty, add it as is
      if (!slot.activity) {
        result.push({ ...slot, colspan: 1, hidden: false });
        i++;
        continue;
      }
      
      // Determine which period this slot belongs to (each period has 4 hours)
      const periodStart = Math.floor(i / 4) * 4;
      const periodEnd = periodStart + 4;
      
      // Count consecutive identical slots within the same period
      let colspan = 1;
      let j = i + 1;
      
      while (j < periodEnd && j < slots.length) {
        const nextSlot = slots[j];
        
        // Check if next slot has same activity
        if (nextSlot.activity &&
            nextSlot.activity.subject === slot.activity.subject &&
            nextSlot.activity.students === slot.activity.students &&
            nextSlot.activity.room === slot.activity.room) {
          colspan++;
          j++;
        } else {
          break;
        }
      }
      
      // Add the merged slot with colspan (no hidden slots needed)
      result.push({ ...slot, colspan, hidden: false });
      
      // Skip the merged positions
      i = j;
    }
    
    return result;
  }

  // Merge identical adjacent vertical slots within same period for option 2
  mergeVerticalSlotsForDay(dayData: any): any {
    const periods = ['m', 's'];
    const hours = ['H1', 'H2', 'H3', 'H4'];
    const result: any = { day: dayData.day, periods: [] };
    
    for (let periodIndex = 0; periodIndex < periods.length; periodIndex++) {
      const period = periods[periodIndex];
      const periodData: any = {
        period: period === 'm' ? 'صباح' : 'مساء',
        periodIndex: periodIndex,
        hours: []
      };
      
      // For each teacher, calculate rowspan for their activities in this period
      const teachersWithRowspan: any[] = dayData.teachers.map((teacherData: any) => {
        const teacherSlots: any = { teacher: teacherData.teacher, slots: {} };
        
        // Collect all activities for this teacher in this period
        const activities: any[] = hours.map(hour => {
          const key = `${period}_${hour}`;
          return teacherData.slots[key] || null;
        });
        
        // Merge consecutive identical activities
        let i = 0;
        while (i < activities.length) {
          const activity = activities[i];
          const hourKey = hours[i];
          
          if (!activity) {
            teacherSlots.slots[hourKey] = { activity: null, rowspan: 1, hidden: false };
            i++;
            continue;
          }
          
          // Count consecutive identical activities
          let rowspan = 1;
          let j = i + 1;
          
          while (j < activities.length) {
            const nextActivity = activities[j];
            
            if (nextActivity &&
                nextActivity.subject === activity.subject &&
                nextActivity.students === activity.students &&
                nextActivity.room === activity.room) {
              rowspan++;
              j++;
            } else {
              break;
            }
          }
          
          // Add the merged activity
          teacherSlots.slots[hourKey] = { activity, rowspan, hidden: false };
          
          // Mark subsequent slots as hidden
          for (let k = i + 1; k < j; k++) {
            teacherSlots.slots[hours[k]] = { activity: null, rowspan: 0, hidden: true };
          }
          
          i = j;
        }
        
        return teacherSlots;
      });
      
      // Build hour rows
      for (const hour of hours) {
        periodData.hours.push({
          hour,
          teachers: teachersWithRowspan.map(t => t.slots[hour])
        });
      }
      
      result.periods.push(periodData);
    }
    
    return result;
  }

  // Build global view data
  buildGlobalView() {
    if (!this.parsed) return;
    
    this.globalViewData = [];
    
    if (this.globalViewOption === 'teachersByDay') {
      // Option 1: Teachers as rows, 48 time slots as columns (6 days x 8 hours)
      this.globalViewData = this.teachersList
        .filter(teacher => teacher && teacher.name && teacher.name.trim() !== '') // Filter valid teachers
        .map(teacher => {
        const teacherName = teacher.name || '';
        const teacherData = this.parsed.teachers.find((t: any) => t.name === teacherName);
        
        // Create a map of slots indexed by position
        const slotMap: any = {};
        const dayNames = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
        const periods = ['m', 's']; // morning, afternoon
        const hours = ['H1', 'H2', 'H3', 'H4'];
        
        // Fill the slot map from teacher data (if exists in parsed.teachers)
        if (teacherData) {
          for (const day of teacherData.days || []) {
            // Parse day.day which contains format like "Mardi_m" or "Mardi_s"
            const dayParts = day.day.split('_');
            if (dayParts.length < 2) continue; // Skip if format is invalid
            
            const baseDayName = dayParts[0].toLowerCase();
            const period = dayParts[1]; // 'm' or 's'
            const dayIndex = dayNames.indexOf(baseDayName);
            const periodIndex = periods.indexOf(period);
            
            if (dayIndex === -1 || periodIndex === -1) continue; // Skip invalid days/periods
            
            for (const hour of day.hours) {
              if (hour.subject || hour.students || hour.room) {
                // hour.hour contains just the hour code like "H1", "H2", etc.
                const hourCode = hour.hour;
                const hourIndex = hours.indexOf(hourCode);
                
                if (hourIndex !== -1) {
                  // Calculate position: dayIndex * 8 + periodIndex * 4 + hourIndex
                  const position = dayIndex * 8 + periodIndex * 4 + hourIndex;
                  
                  slotMap[position] = {
                    activity: {
                      subject: hour.subject,
                      students: hour.students,
                      room: hour.room
                    }
                  };
                }
              }
            }
          }
        }
        
        // Also check in subgroups for this teacher
        for (const subgroup of (this.parsed?.subgroups || [])) {
          for (const day of (subgroup.days || [])) {
            // Parse day.day which contains format like "Mardi_m" or "Mardi_s"
            const dayParts = day.day.split('_');
            if (dayParts.length < 2) continue;
            
            const baseDayName = dayParts[0].toLowerCase();
            const period = dayParts[1]; // 'm' or 's'
            const dayIndex = dayNames.indexOf(baseDayName);
            const periodIndex = periods.indexOf(period);
            
            if (dayIndex === -1 || periodIndex === -1) continue;
            
            for (const hour of (day.hours || [])) {
              if (hour.teacher === teacherName && (hour.subject || hour.students || hour.room)) {
                const hourCode = hour.hour;
                const hourIndex = hours.indexOf(hourCode);
                
                if (hourIndex !== -1) {
                  const position = dayIndex * 8 + periodIndex * 4 + hourIndex;
                  
                  // Only add if slot is empty or add to existing activity
                  if (!slotMap[position]) {
                    slotMap[position] = {
                      activity: {
                        subject: hour.subject,
                        students: hour.students,
                        room: hour.room
                      }
                    };
                  }
                }
              }
            }
          }
        }
        
        // Create ordered array of 48 slots
        const slots = Array(48).fill(null).map((_, i) => slotMap[i] || { activity: null });
        
        // Merge identical adjacent cells horizontally within the same period (4 hours)
        const mergedSlots = this.mergeHorizontalSlots(slots);
        
        return { teacher: teacherName, slots: mergedSlots };
      });
    } else {
      // Option 2: Days/Hours as rows, All Teachers as columns
      // Display all teachers with horizontal scroll
      this.selectedTeachersForGlobal = this.teachersList;
      
      const dayNames = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
      const dayLabels: any = {
        'lundi': 'الاثنين',
        'mardi': 'الثلاثاء',
        'mercredi': 'الأربعاء',
        'jeudi': 'الخميس',
        'vendredi': 'الجمعة',
        'samedi': 'السبت'
      };
      
      this.globalViewData = dayNames.map(dayName => {
        const teachers: any[] = [];
        
        for (const teacher of this.selectedTeachersForGlobal) {
          const teacherName = teacher.name;
          const teacherData = this.parsed.teachers.find((t: any) => t.name === teacherName);
          
          const slots: any = {};
          
          if (teacherData) {
            for (const day of teacherData.days) {
              // Parse day.day which contains format like "Mardi_m" or "Mardi_s"
              const dayParts = day.day.split('_');
              if (dayParts.length < 2) continue;
              
              const baseDayName = dayParts[0].toLowerCase();
              const period = dayParts[1]; // 'm' or 's'
              
              if (baseDayName === dayName) {
                for (const hour of day.hours) {
                  if (hour.subject || hour.students || hour.room) {
                    // hour.hour contains just the hour code like "H1", "H2", etc.
                    const hourCode = hour.hour;
                    const key = `${period}_${hourCode}`;
                    
                    slots[key] = {
                      subject: hour.subject,
                      students: hour.students,
                      room: hour.room
                    };
                  }
                }
              }
            }
          }
          
          teachers.push({ teacher: teacherName, slots });
        }
        
        return this.mergeVerticalSlotsForDay({ day: dayLabels[dayName] || dayName, teachers });
      });
    }
  }
}
