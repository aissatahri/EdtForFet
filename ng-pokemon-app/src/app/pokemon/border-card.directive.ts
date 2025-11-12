import {Directive, ElementRef, HostListener, Input} from '@angular/core';

@Directive({
  selector: '[appBorderCard]'
})
export class BorderCardDirective {

  private initialColor: string = '#009688';
  private defaultColor: string = '#009688';
  private defaultHeight: number = 180

  constructor(private el: ElementRef) {
    this.setBorder('#f5f5f5');
    this.setHeight(this.defaultHeight);
}

@Input('appBorderCard') borderColor : string

@HostListener('mouseenter') onMouseEnter() {
  this.setBorder(this.borderColor || this.initialColor);
}

@HostListener('mouseleave') onMouseLeave() {
  this.setBorder(this.defaultColor);
}

private setBorder(color: string) {
    this.el.nativeElement.style.border = 'solid 4px ' + color;
}

private setHeight(height: number) {
    this.el.nativeElement.style.height = height + 'px';
}

}
